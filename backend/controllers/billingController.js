const { executeQuery, getConnection } = require('../config/database');
const { generateInvoiceNumber, isAdmin } = require('../utils/helpers');
const { PAYMENT_STATUS, SALE_STATUS, IMEI_STATUS } = require('../config/constants');
const { getEffectiveUserId } = require('../utils/userResolution');
const logger = require('../utils/logger');

/**
 * Create a new sale/bill (Transaction-safe)
 */
const createSale = async (req, res, next) => {
    if (isAdmin(req)) {
        return res.status(403).json({
            success: false,
            message: 'Admin cannot make sales. Use a staff, manager, or cashier account.'
        });
    }
    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        const effectiveUserId = await getEffectiveUserId(connection, req.user.id);
        if (effectiveUserId == null) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'No active user in database. Add a user (e.g. Admin) in Users first.'
            });
        }

        let branchId = req.user.branch_id;
        const { customerId, items, discountAmount, taxRate, paidAmount, notes } = req.body;

        if (!items || items.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Sale items are required'
            });
        }

        // If user has no branch (e.g. test user), use first active branch
        if (branchId == null) {
            const [firstBranch] = await connection.execute(
                'SELECT id, code FROM branches WHERE is_active = TRUE ORDER BY id LIMIT 1'
            );
            if (firstBranch.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'No branch found. Create a branch first or assign user to a branch.'
                });
            }
            branchId = firstBranch[0].id;
        }

        // Get branch code for invoice number
        const [branches] = await connection.execute(
            'SELECT code FROM branches WHERE id = ?',
            [branchId]
        );

        if (branches.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        const branchCode = branches[0].code;
        const invoiceNumber = generateInvoiceNumber(branchCode);

        // Calculate totals
        let subtotal = 0;
        const saleItems = [];

        // Validate items and check stock (use resolved branchId)
        for (const item of items) {
            const { productId, quantity, unitPrice, discount, imei } = item;

            if (!productId || !quantity || !unitPrice) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Product ID, quantity, and unit price are required for all items'
                });
            }

            // Check stock availability
            const [stock] = await connection.execute(
                'SELECT quantity, reserved_quantity FROM branch_stock WHERE branch_id = ? AND product_id = ?',
                [branchId, productId]
            );

            if (stock.length === 0 || stock[0].quantity - stock[0].reserved_quantity < quantity) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product ID ${productId}`
                });
            }

            // If IMEI is provided, validate it
            if (imei) {
                const [imeiRecord] = await connection.execute(
                    'SELECT id, status FROM product_imeis WHERE imei = ? AND branch_id = ?',
                    [imei, branchId]
                );

                if (imeiRecord.length === 0 || imeiRecord[0].status !== 'available') {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `IMEI ${imei} is not available`
                    });
                }
            }

            const itemDiscount = parseFloat(discount) || 0;
            const itemSubtotal = (parseFloat(unitPrice) * parseInt(quantity)) - itemDiscount;
            subtotal += itemSubtotal;

            saleItems.push({
                productId,
                quantity,
                unitPrice: parseFloat(unitPrice),
                discount: itemDiscount,
                subtotal: itemSubtotal,
                imei: imei || null
            });
        }

        const discount = parseFloat(discountAmount) || 0;
        const tax = (subtotal - discount) * ((parseFloat(taxRate) || 0) / 100);
        const totalAmount = subtotal - discount + tax;
        const paid = parseFloat(paidAmount) || 0;
        const due = totalAmount - paid;

        // Determine payment status
        let paymentStatus;
        if (due <= 0) {
            paymentStatus = PAYMENT_STATUS.PAID;
        } else if (paid > 0) {
            paymentStatus = PAYMENT_STATUS.PARTIAL;
        } else {
            paymentStatus = PAYMENT_STATUS.DUE;
        }

        // Create sale record
        const [saleResult] = await connection.execute(
            `INSERT INTO sales (invoice_number, branch_id, customer_id, user_id, total_amount, 
                               discount_amount, tax_amount, paid_amount, due_amount, payment_status, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [invoiceNumber, branchId, customerId || null, effectiveUserId, totalAmount, 
             discount, tax, paid, due, paymentStatus, notes || null]
        );

        const saleId = saleResult.insertId || (saleResult.rows && saleResult.rows[0] && saleResult.rows[0].id);
        if (!saleId) {
            await connection.rollback();
            logger.error('Create sale: INSERT did not return id', { saleResult, fullResult: JSON.stringify(saleResult) });
            return res.status(500).json({
                success: false,
                message: 'Could not create sale record. Check backend logs.'
            });
        }

        // Create sale items and update stock
        for (const item of saleItems) {
            // Insert sale item
            await connection.execute(
                `INSERT INTO sale_items (sale_id, product_id, imei, quantity, unit_price, discount_amount, subtotal) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [saleId, item.productId, item.imei, item.quantity, item.unitPrice, item.discount, item.subtotal]
            );

            // Update stock
            await connection.execute(
                'UPDATE branch_stock SET quantity = quantity - ? WHERE branch_id = ? AND product_id = ?',
                [item.quantity, branchId, item.productId]
            );

            // Update IMEI status if provided
            if (item.imei) {
                await connection.execute(
                    'UPDATE product_imeis SET status = ?, sale_id = ? WHERE imei = ? AND branch_id = ?',
                    [IMEI_STATUS.SOLD, saleId, item.imei, branchId]
                );
            }
        }

        // Create payment record if paid
        if (paid > 0) {
            await connection.execute(
                `INSERT INTO payments (sale_id, amount, payment_method, created_by) 
                 VALUES (?, ?, 'cash', ?)`,
                [saleId, paid, effectiveUserId]
            );
        }

        await connection.commit();

        logger.info(`Sale created: ${invoiceNumber} (ID: ${saleId})`);

        // Fetch complete sale data
        const [sales] = await executeQuery(
            `SELECT s.*, c.name as customer_name, c.phone as customer_phone,
                    u.full_name as cashier_name, b.name as branch_name
             FROM sales s
             LEFT JOIN customers c ON s.customer_id = c.id
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN branches b ON s.branch_id = b.id
             WHERE s.id = ?`,
            [saleId]
        );

        const [saleItemsData] = await executeQuery(
            `SELECT si.*, p.name as product_name, p.sku
             FROM sale_items si
             INNER JOIN products p ON si.product_id = p.id
             WHERE si.sale_id = ?`,
            [saleId]
        );

        res.status(201).json({
            success: true,
            message: 'Sale created successfully',
            data: {
                ...sales[0],
                items: saleItemsData
            }
        });
    } catch (error) {
        if (connection && connection.rollback) await connection.rollback().catch(() => {});
        logger.error('Create sale error:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            body: req.body
        });
        next(error);
    } finally {
        if (connection && connection.release) connection.release();
    }
};

/**
 * Get sale by invoice number or ID
 */
const getSale = async (req, res, next) => {
    try {
        const { id } = req.params;
        const branchId = req.user.branch_id;

        // Admin can access any branch's sales
        let query = `SELECT s.*, c.name as customer_name, c.phone as customer_phone,
                            u.full_name as cashier_name, b.name as branch_name
                     FROM sales s
                     LEFT JOIN customers c ON s.customer_id = c.id
                     LEFT JOIN users u ON s.user_id = u.id
                     LEFT JOIN branches b ON s.branch_id = b.id
                     WHERE (s.id = ? OR s.invoice_number = ?)`;
        const params = [id, id];

        if (!isAdmin(req)) {
            query += ' AND s.branch_id = ?';
            params.push(branchId);
        }

        const [sales] = await executeQuery(query, params);

        if (sales.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        const sale = sales[0];

        // Get sale items
        const [saleItems] = await executeQuery(
            `SELECT si.*, p.name as product_name, p.sku
             FROM sale_items si
             INNER JOIN products p ON si.product_id = p.id
             WHERE si.sale_id = ?`,
            [sale.id]
        );

        // Get payments
        const [payments] = await executeQuery(
            `SELECT p.*, u.full_name as created_by_name
             FROM payments p
             LEFT JOIN users u ON p.created_by = u.id
             WHERE p.sale_id = ?
             ORDER BY p.created_at ASC`,
            [sale.id]
        );

        res.json({
            success: true,
            data: {
                ...sale,
                items: saleItems,
                payments
            }
        });
    } catch (error) {
        logger.error('Get sale error:', error);
        next(error);
    }
};

/**
 * Add payment to sale (for partial payments)
 */
const addPayment = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const effectiveUserId = await getEffectiveUserId(connection, req.user.id);
        if (effectiveUserId == null) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'No active user in database. Add a user in Users first.'
            });
        }

        const { saleId } = req.params;
        const { amount, paymentMethod, paymentReference, notes } = req.body;

        if (!amount || amount <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Payment amount is required and must be positive'
            });
        }

        // Get sale
        const [sales] = await connection.execute(
            'SELECT * FROM sales WHERE id = ?',
            [saleId]
        );

        if (sales.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        const sale = sales[0];

        if (!isAdmin(req) && sale.branch_id !== req.user.branch_id) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'Access denied to this sale'
            });
        }

        if (sale.sale_status !== 'completed') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot add payment to cancelled or refunded sale'
            });
        }

        const newPaidAmount = parseFloat(sale.paid_amount) + parseFloat(amount);
        const newDueAmount = parseFloat(sale.total_amount) - newPaidAmount;

        // Determine payment status
        let paymentStatus;
        if (newDueAmount <= 0) {
            paymentStatus = PAYMENT_STATUS.PAID;
        } else {
            paymentStatus = PAYMENT_STATUS.PARTIAL;
        }

        // Create payment record
        await connection.execute(
            `INSERT INTO payments (sale_id, amount, payment_method, payment_reference, notes, created_by) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [saleId, amount, paymentMethod || 'cash', paymentReference || null, notes || null, effectiveUserId]
        );

        // Update sale
        await connection.execute(
            'UPDATE sales SET paid_amount = ?, due_amount = ?, payment_status = ? WHERE id = ?',
            [newPaidAmount, newDueAmount, paymentStatus, saleId]
        );

        await connection.commit();

        logger.info(`Payment added to sale ${saleId}: ${amount}`);

        res.json({
            success: true,
            message: 'Payment added successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Add payment error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Cancel sale
 */
const cancelSale = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { reason } = req.body;

        // Get sale
        const [sales] = await connection.execute(
            'SELECT * FROM sales WHERE id = ?',
            [id]
        );

        if (sales.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        const sale = sales[0];

        if (!isAdmin(req) && sale.branch_id !== req.user.branch_id) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'Access denied to this sale'
            });
        }

        if (sale.sale_status !== 'completed') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Sale is already cancelled or refunded'
            });
        }

        const [saleItems] = await connection.execute(
            'SELECT * FROM sale_items WHERE sale_id = ?',
            [id]
        );

        // Restore stock and IMEI
        for (const item of saleItems) {
            // Restore stock
            await connection.execute(
                'UPDATE branch_stock SET quantity = quantity + ? WHERE branch_id = ? AND product_id = ?',
                [item.quantity, sale.branch_id, item.product_id]
            );

            // Restore IMEI if exists
            if (item.imei) {
                await connection.execute(
                    'UPDATE product_imeis SET status = ?, sale_id = NULL WHERE imei = ?',
                    [IMEI_STATUS.AVAILABLE, item.imei]
                );
            }
        }

        // Update sale status
        await connection.execute(
            'UPDATE sales SET sale_status = ?, notes = CONCAT(COALESCE(notes, ""), ?) WHERE id = ?',
            ['cancelled', `\nCancelled: ${reason || 'No reason provided'}`, id]
        );

        await connection.commit();

        logger.info(`Sale cancelled: ID ${id}`);

        res.json({
            success: true,
            message: 'Sale cancelled successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Cancel sale error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Create refund
 */
const createRefund = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { saleId } = req.params;
        const { amount, reason } = req.body;

        if (!amount || amount <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Refund amount is required and must be positive'
            });
        }

        // Get sale
        const [sales] = await connection.execute(
            'SELECT * FROM sales WHERE id = ?',
            [saleId]
        );

        if (sales.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        const sale = sales[0];

        if (!isAdmin(req) && sale.branch_id !== req.user.branch_id) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'Access denied to this sale'
            });
        }

        if (sale.sale_status === 'cancelled') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot refund a cancelled sale'
            });
        }

        if (parseFloat(amount) > parseFloat(sale.paid_amount)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Refund amount cannot exceed paid amount'
            });
        }

        // Generate refund number
        const { generateRefundNumber } = require('../utils/helpers');
        const refundNumber = generateRefundNumber();

        // Create refund record
        const [refundResult] = await connection.execute(
            `INSERT INTO refunds (sale_id, refund_number, amount, reason, status) 
             VALUES (?, ?, ?, ?, 'pending') RETURNING id`,
            [saleId, refundNumber, amount, reason || null]
        );

        await connection.commit();

        logger.info(`Refund created: ${refundNumber} for Sale ${saleId}`);

        res.status(201).json({
            success: true,
            message: 'Refund request created successfully',
            data: {
                refundId: refundResult.insertId,
                refundNumber
            }
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Create refund error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Process refund (Manager/Admin only)
 */
const processRefund = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const effectiveUserId = await getEffectiveUserId(connection, req.user.id);
        if (effectiveUserId == null) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'No active user in database. Add a user in Users first.'
            });
        }

        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        if (!['approve', 'reject'].includes(action)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Action must be "approve" or "reject"'
            });
        }

        // Get refund
        const [refunds] = await connection.execute(
            'SELECT * FROM refunds WHERE id = ? AND status = ?',
            [id, 'pending']
        );

        if (refunds.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Refund not found or already processed'
            });
        }

        const refund = refunds[0];

        if (action === 'reject') {
            await connection.execute(
                'UPDATE refunds SET status = ?, processed_by = ? WHERE id = ?',
                ['rejected', effectiveUserId, id]
            );

            await connection.commit();
            return res.json({
                success: true,
                message: 'Refund rejected'
            });
        }

        // Approve refund
        // Get sale
        const [sales] = await connection.execute(
            'SELECT * FROM sales WHERE id = ?',
            [refund.sale_id]
        );

        const sale = sales[0];

        if (!isAdmin(req) && sale.branch_id !== req.user.branch_id) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'Access denied to this sale'
            });
        }

        await connection.execute(
            'UPDATE refunds SET status = ?, processed_by = ? WHERE id = ?',
            ['completed', effectiveUserId, id]
        );

        // Update sale paid amount and status
        const newPaidAmount = parseFloat(sale.paid_amount) - parseFloat(refund.amount);
        const newDueAmount = parseFloat(sale.total_amount) - newPaidAmount;

        let paymentStatus = sale.payment_status;
        if (newDueAmount > 0) {
            paymentStatus = newPaidAmount > 0 ? PAYMENT_STATUS.PARTIAL : PAYMENT_STATUS.DUE;
        } else {
            paymentStatus = PAYMENT_STATUS.PAID;
        }

        await connection.execute(
            'UPDATE sales SET paid_amount = ?, due_amount = ?, payment_status = ?, sale_status = ? WHERE id = ?',
            [newPaidAmount, newDueAmount, paymentStatus, 'refunded', sale.id]
        );

        await connection.commit();

        logger.info(`Refund processed: ID ${id}`);

        res.json({
            success: true,
            message: 'Refund processed successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Process refund error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Get all sales with filters
 */
const getAllSales = async (req, res, next) => {
    try {
        const { startDate, endDate, paymentStatus, customerId, limit, offset } = req.query;
        const branchId = req.user && req.user.branch_id != null ? req.user.branch_id : null;

        // Non-admin must have branch_id (branchGuard should enforce; avoid pushing undefined into query)
        if (!isAdmin(req) && (branchId == null || branchId === '')) {
            return res.status(403).json({
                success: false,
                message: 'User must be assigned to a branch to view sales.'
            });
        }

        const limitNum = Math.min(Math.max(0, parseInt(limit, 10) || 50), 500);
        const offsetNum = Math.max(0, parseInt(offset, 10) || 0);

        let query = `SELECT s.*, c.name as customer_name, u.full_name as cashier_name, b.name as branch_name,
                     (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
                     FROM sales s
                     LEFT JOIN customers c ON s.customer_id = c.id
                     LEFT JOIN users u ON s.user_id = u.id
                     LEFT JOIN branches b ON s.branch_id = b.id
                     WHERE 1=1`;
        const params = [];

        if (!isAdmin(req)) {
            query += ' AND s.branch_id = ?';
            params.push(branchId);
        } else if (req.query.branchId) {
            query += ' AND s.branch_id = ?';
            params.push(req.query.branchId);
        }

        if (startDate) {
            query += ' AND DATE(s.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND DATE(s.created_at) <= ?';
            params.push(endDate);
        }
        if (paymentStatus) {
            query += ' AND s.payment_status = ?';
            params.push(paymentStatus);
        }
        if (customerId) {
            query += ' AND s.customer_id = ?';
            params.push(customerId);
        }

        query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
        params.push(limitNum, offsetNum);

        const [sales] = await executeQuery(query, params);

        res.json({
            success: true,
            data: Array.isArray(sales) ? sales : []
        });
    } catch (error) {
        logger.error('Get all sales error:', error);
        next(error);
    }
};

module.exports = {
    createSale,
    getSale,
    getAllSales,
    addPayment,
    cancelSale,
    createRefund,
    processRefund
};
