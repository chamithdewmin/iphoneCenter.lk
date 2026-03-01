const { executeQuery, getConnection } = require('../config/database');
const { generateOrderNumber, generateInvoiceNumber, isAdmin } = require('../utils/helpers');
const { PAYMENT_STATUS, IMEI_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Resolve branch_id for per order: admin may send branch_id in body; others use user's branch.
 */
function resolveBranchId(req) {
    if (isAdmin(req) && req.body.branch_id != null && req.body.branch_id !== '') {
        return parseInt(req.body.branch_id, 10);
    }
    const bid = req.user?.branch_id;
    return bid != null && bid !== '' ? parseInt(bid, 10) : null;
}

/**
 * List per orders. Admin: optional branchId query; others: only their branch.
 */
const listPerOrders = async (req, res, next) => {
    try {
        const role = req.user?.role != null ? String(req.user.role).toLowerCase() : '';
        const isAdminUser = role === 'admin';
        const userBranchId = req.user?.branch_id != null ? parseInt(req.user.branch_id, 10) : null;
        const queryBranchId = req.query.branchId != null && req.query.branchId !== '' ? parseInt(req.query.branchId, 10) : null;

        let sql = `
            SELECT po.id, po.order_number, po.branch_id, po.customer_id, po.user_id,
                   po.customer_name, po.customer_phone, po.customer_email, po.customer_address,
                   po.subtotal, po.advance_payment, po.due_amount, po.payment_status, po.status,
                   po.notes, po.created_at, po.updated_at,
                   b.name AS branch_name,
                   u.full_name AS user_name
            FROM per_orders po
            LEFT JOIN branches b ON b.id = po.branch_id
            LEFT JOIN users u ON u.id = po.user_id
            WHERE 1=1
        `;
        const params = [];

        if (!isAdminUser) {
            if (userBranchId == null) {
                return res.status(403).json({
                    success: false,
                    message: 'User must be assigned to a branch'
                });
            }
            sql += ' AND po.branch_id = ?';
            params.push(userBranchId);
        } else if (queryBranchId != null) {
            sql += ' AND po.branch_id = ?';
            params.push(queryBranchId);
        }

        sql += ' ORDER BY po.created_at DESC';

        const [rows] = await executeQuery(sql, params);

        res.json({
            success: true,
            data: rows || []
        });
    } catch (error) {
        logger.error('List per orders error:', { message: error.message });
        next(error);
    }
};

/**
 * Get one per order by id with items. Branch access: admin any, others only their branch.
 */
const getPerOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = req.user?.role != null ? String(req.user.role).toLowerCase() : '';
        const isAdminUser = role === 'admin';
        const userBranchId = req.user?.branch_id != null ? parseInt(req.user.branch_id, 10) : null;

        const [orders] = await executeQuery(
            `SELECT po.*, b.name AS branch_name, u.full_name AS user_name
             FROM per_orders po
             LEFT JOIN branches b ON b.id = po.branch_id
             LEFT JOIN users u ON u.id = po.user_id
             WHERE po.id = ?`,
            [id]
        );

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Per order not found'
            });
        }

        const order = orders[0];
        if (!isAdminUser && order.branch_id !== userBranchId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this order'
            });
        }

        const [itemRows] = await executeQuery(
            `SELECT poi.id, poi.per_order_id, poi.product_id, poi.custom_product_name,
                    poi.quantity, poi.unit_price, poi.subtotal,
                    p.name AS product_name, p.inventory_type
             FROM per_order_items poi
             LEFT JOIN products p ON p.id = poi.product_id
             WHERE poi.per_order_id = ?
             ORDER BY poi.id`,
            [id]
        );

        const items = (itemRows || []).map(row => ({
            id: row.id,
            per_order_id: row.per_order_id,
            product_id: row.product_id,
            custom_product_name: row.custom_product_name || null,
            product_name: row.product_name || null,
            inventory_type: row.inventory_type || 'quantity',
            quantity: row.quantity,
            unit_price: parseFloat(row.unit_price),
            subtotal: parseFloat(row.subtotal),
            display_name: row.custom_product_name || row.product_name || '—'
        }));

        res.json({
            success: true,
            data: {
                ...order,
                subtotal: parseFloat(order.subtotal),
                advance_payment: parseFloat(order.advance_payment),
                due_amount: parseFloat(order.due_amount),
                items
            }
        });
    } catch (error) {
        logger.error('Get per order error:', { message: error.message });
        next(error);
    }
};

/**
 * Create per order. Admin sends branch_id; others use profile branch. Items: productId or customProductName + quantity, unitPrice.
 */
const createPerOrder = async (req, res, next) => {
    const conn = await getConnection();
    try {
        await conn.beginTransaction();

        const branchId = resolveBranchId(req);
        if (branchId == null) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: 'Branch is required. Assign user to a branch or (admin) send branch_id.'
            });
        }

        const {
            customer_id,
            customer_name,
            customer_phone,
            customer_email,
            customer_address,
            advance_payment,
            expected_delivery_date,
            notes,
            items: bodyItems
        } = req.body;

        if (!customer_name || !customer_phone) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: 'Customer name and phone are required'
            });
        }

        if (!bodyItems || !Array.isArray(bodyItems) || bodyItems.length === 0) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: 'At least one order item is required'
            });
        }

        let subtotal = 0;
        const validItems = [];
        for (const it of bodyItems) {
            const productId = it.productId != null && it.productId !== '' ? parseInt(it.productId, 10) : null;
            const customProductName = it.customProductName != null ? String(it.customProductName).trim() : '';
            const quantity = parseInt(it.quantity, 10) || 1;
            const unitPrice = parseFloat(it.unitPrice);
            if (isNaN(unitPrice) || unitPrice < 0) continue;
            if (productId == null && !customProductName) continue;
            const st = quantity * unitPrice;
            subtotal += st;
            validItems.push({ productId, customProductName: customProductName || null, quantity, unitPrice, subtotal: st });
        }

        if (validItems.length === 0) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: 'Valid items required (productId or customProductName, quantity, unitPrice)'
            });
        }

        const adv = parseFloat(advance_payment) || 0;
        const dueAmount = Math.max(0, subtotal - adv);
        const paymentStatus = dueAmount <= 0 ? 'paid' : (adv > 0 ? 'partial' : 'due');
        // Enterprise: Pre-Order stays PENDING until Convert to Sale (never completed just because advance = total)
        const status = 'pending';

        const orderNumber = generateOrderNumber();
        const expectedDate = expected_delivery_date ? (expected_delivery_date instanceof Date ? expected_delivery_date : new Date(expected_delivery_date)).toISOString().slice(0, 10) : null;

        const [ins] = await conn.execute(
            `INSERT INTO per_orders (
                order_number, branch_id, customer_id, user_id,
                customer_name, customer_phone, customer_email, customer_address,
                subtotal, advance_payment, due_amount, payment_status, status, expected_delivery_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id`,
            [
                orderNumber,
                branchId,
                customer_id || null,
                req.user.id,
                customer_name.trim(),
                String(customer_phone).trim(),
                customer_email ? String(customer_email).trim() : null,
                customer_address ? String(customer_address).trim() : null,
                subtotal,
                adv,
                dueAmount,
                paymentStatus,
                status,
                expectedDate,
                notes != null ? String(notes).trim() : null
            ]
        );

        const perOrderId = ins.insertId || (ins.rows && ins.rows[0] && ins.rows[0].id);
        if (!perOrderId) {
            await conn.rollback();
            return res.status(500).json({
                success: false,
                message: 'Failed to create per order'
            });
        }

        for (const it of validItems) {
            await conn.execute(
                `INSERT INTO per_order_items (per_order_id, product_id, custom_product_name, quantity, unit_price, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    perOrderId,
                    it.productId || null,
                    it.customProductName || null,
                    it.quantity,
                    it.unitPrice,
                    it.subtotal
                ]
            );
        }

        await conn.commit();
        await conn.release();

        const [created] = await executeQuery(
            `SELECT po.*, b.name AS branch_name, u.full_name AS user_name
             FROM per_orders po
             LEFT JOIN branches b ON b.id = po.branch_id
             LEFT JOIN users u ON u.id = po.user_id
             WHERE po.id = ?`,
            [perOrderId]
        );
        const [itemRows] = await executeQuery(
            `SELECT poi.id, poi.product_id, poi.custom_product_name, poi.quantity, poi.unit_price, poi.subtotal,
                    p.name AS product_name
             FROM per_order_items poi
             LEFT JOIN products p ON p.id = poi.product_id
             WHERE poi.per_order_id = ? ORDER BY poi.id`,
            [perOrderId]
        );
        const items = (itemRows || []).map(r => ({
            id: r.id,
            product_id: r.product_id,
            custom_product_name: r.custom_product_name,
            product_name: r.product_name,
            quantity: r.quantity,
            unit_price: parseFloat(r.unit_price),
            subtotal: parseFloat(r.subtotal),
            display_name: r.custom_product_name || r.product_name || '—'
        }));

        const data = {
            ...created[0],
            subtotal: parseFloat(created[0].subtotal),
            advance_payment: parseFloat(created[0].advance_payment),
            due_amount: parseFloat(created[0].due_amount),
            items
        };

        res.status(201).json({
            success: true,
            message: 'Per order created successfully',
            data
        });
    } catch (error) {
        await conn.rollback().catch(() => {});
        conn.release().catch(() => {});
        logger.error('Create per order error:', { message: error.message });
        next(error);
    }
};

/**
 * Update per order (notes, advance_payment, status). Branch access same as get. Optional: replace items.
 */
const updatePerOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = req.user?.role != null ? String(req.user.role).toLowerCase() : '';
        const isAdminUser = role === 'admin';
        const userBranchId = req.user?.branch_id != null ? parseInt(req.user.branch_id, 10) : null;

        const [existing] = await executeQuery('SELECT id, branch_id, subtotal FROM per_orders WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Per order not found'
            });
        }
        if (!isAdminUser && existing[0].branch_id !== userBranchId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this order'
            });
        }

        const { notes, advance_payment, status, expected_delivery_date } = req.body;
        const updates = [];
        const params = [];

        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes != null ? String(notes).trim() : null);
        }
        if (expected_delivery_date !== undefined) {
            const d = expected_delivery_date ? (expected_delivery_date instanceof Date ? expected_delivery_date : new Date(expected_delivery_date)).toISOString().slice(0, 10) : null;
            updates.push('expected_delivery_date = ?');
            params.push(d);
        }
        if (advance_payment !== undefined) {
            const adv = parseFloat(advance_payment) || 0;
            const subtotal = parseFloat(existing[0].subtotal);
            const dueAmount = Math.max(0, subtotal - adv);
            updates.push('advance_payment = ?', 'due_amount = ?');
            params.push(adv, dueAmount);
            updates.push('payment_status = ?');
            params.push(dueAmount <= 0 ? 'paid' : (adv > 0 ? 'partial' : 'due'));
            // Enterprise: do not set status to completed when due is 0; only Convert to Sale sets completed
            if (status === undefined) {
                // leave status unchanged when only updating advance
            }
        }
        if (status !== undefined) {
            updates.push('status = ?');
            params.push(String(status));
        }

        if (updates.length > 0) {
            params.push(id);
            await executeQuery(
                `UPDATE per_orders SET ${updates.join(', ')} WHERE id = ?`,
                params
            );
        }

        const [updated] = await executeQuery(
            `SELECT po.*, b.name AS branch_name, u.full_name AS user_name
             FROM per_orders po
             LEFT JOIN branches b ON b.id = po.branch_id
             LEFT JOIN users u ON u.id = po.user_id
             WHERE po.id = ?`,
            [id]
        );
        const [itemRows] = await executeQuery(
            `SELECT poi.id, poi.product_id, poi.custom_product_name, poi.quantity, poi.unit_price, poi.subtotal,
                    p.name AS product_name
             FROM per_order_items poi
             LEFT JOIN products p ON p.id = poi.product_id
             WHERE poi.per_order_id = ? ORDER BY poi.id`,
            [id]
        );
        const items = (itemRows || []).map(r => ({
            id: r.id,
            product_id: r.product_id,
            custom_product_name: r.custom_product_name,
            product_name: r.product_name,
            quantity: r.quantity,
            unit_price: parseFloat(r.unit_price),
            subtotal: parseFloat(r.subtotal),
            display_name: r.custom_product_name || r.product_name || '—'
        }));

        res.json({
            success: true,
            data: {
                ...updated[0],
                subtotal: parseFloat(updated[0].subtotal),
                advance_payment: parseFloat(updated[0].advance_payment),
                due_amount: parseFloat(updated[0].due_amount),
                items
            }
        });
    } catch (error) {
        logger.error('Update per order error:', { message: error.message });
        next(error);
    }
};

/**
 * Cancel per order. Enterprise: set status=cancelled, optionally refund. Manager/Admin.
 */
const cancelPerOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = req.user?.role != null ? String(req.user.role).toLowerCase() : '';
        const isAdminUser = role === 'admin';
        const userBranchId = req.user?.branch_id != null ? parseInt(req.user.branch_id, 10) : null;

        const [existing] = await executeQuery(
            'SELECT id, branch_id, status, advance_payment FROM per_orders WHERE id = ?',
            [id]
        );
        if (!existing || existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Per order not found'
            });
        }
        if (!isAdminUser && existing[0].branch_id !== userBranchId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this order'
            });
        }
        if (existing[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending per orders can be cancelled'
            });
        }

        const { refund = false, reason } = req.body || {};
        await executeQuery(
            `UPDATE per_orders SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancelled_by = ?, cancel_reason = ? WHERE id = ?`,
            [req.user.id, reason != null ? String(reason).trim() : null, id]
        );

        res.json({
            success: true,
            message: refund ? 'Per order cancelled and advance will be refunded.' : 'Per order cancelled.',
            data: { id: parseInt(id, 10), status: 'cancelled', refund: !!refund }
        });
    } catch (error) {
        logger.error('Cancel per order error:', { message: error.message });
        next(error);
    }
};

/**
 * Convert per order to sale. Enterprise: deduct stock / assign IMEI, create sale, set per order completed.
 * Body: { remainingPayment?: number, paymentMethod?: string, items: [{ perOrderItemId, imei? }] }
 * For unique product lines, send imei for that item. For quantity products, no imei.
 */
const convertToSale = async (req, res, next) => {
    const conn = await getConnection();
    try {
        const { id } = req.params;
        const role = req.user?.role != null ? String(req.user.role).toLowerCase() : '';
        const isAdminUser = role === 'admin';
        const userBranchId = req.user?.branch_id != null ? parseInt(req.user.branch_id, 10) : null;
        const effectiveUserId = req.user?.id;

        const [orders] = await conn.execute(
            `SELECT po.*, b.code AS branch_code FROM per_orders po
             LEFT JOIN branches b ON b.id = po.branch_id WHERE po.id = ?`,
            [id]
        );
        if (!orders || orders.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(404).json({ success: false, message: 'Per order not found' });
        }
        const order = orders[0];
        if (!isAdminUser && order.branch_id !== userBranchId) {
            await conn.rollback();
            conn.release();
            return res.status(403).json({ success: false, message: 'Access denied to this order' });
        }
        if (order.status !== 'pending') {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ success: false, message: 'Only pending per orders can be converted to sale' });
        }

        const [itemRows] = await conn.execute(
            `SELECT poi.id, poi.per_order_id, poi.product_id, poi.custom_product_name, poi.quantity, poi.unit_price, poi.subtotal,
                    p.name AS product_name, p.inventory_type
             FROM per_order_items poi
             LEFT JOIN products p ON p.id = poi.product_id
             WHERE poi.per_order_id = ? ORDER BY poi.id`,
            [id]
        );
        const items = itemRows || [];
        const subtotal = parseFloat(order.subtotal) || 0;
        const advancePaid = parseFloat(order.advance_payment) || 0;
        const { remainingPayment = 0, paymentMethod = 'cash', items: bodyItems = [] } = req.body || {};
        const remaining = parseFloat(remainingPayment) || 0;
        const totalPaid = advancePaid + remaining;
        const branchId = order.branch_id;
        const branchCode = (order.branch_code || 'BR').toString();
        const invoiceNumber = generateInvoiceNumber(branchCode);

        // Build map: per_order_item id -> { imei? } from body
        const itemMap = {};
        for (const it of bodyItems) {
            const key = String(it.perOrderItemId ?? it.per_order_item_id ?? it.id ?? '');
            if (key) itemMap[key] = { imei: it.imei != null ? String(it.imei).trim() : null };
        }

        const saleItemsToInsert = [];
        for (const it of items) {
            const productId = it.product_id;
            const customName = it.custom_product_name ? String(it.custom_product_name).trim() : null;
            const qty = parseInt(it.quantity, 10) || 1;
            const unitPrice = parseFloat(it.unit_price) || 0;
            const sub = parseFloat(it.subtotal) || 0;
            const invType = (it.inventory_type || 'quantity').toLowerCase();
            const bodyItem = itemMap[String(it.id)] || {};

            if (productId != null) {
                if (invType === 'unique') {
                    const imei = bodyItem.imei;
                    if (!imei) {
                        await conn.rollback();
                        conn.release();
                        return res.status(400).json({
                            success: false,
                            message: `Unique product "${it.product_name || productId}" requires IMEI selection for item id ${it.id}`
                        });
                    }
                    const [imeiRows] = await conn.execute(
                        'SELECT id, status, purchase_price FROM product_imeis WHERE imei = ? AND branch_id = ?',
                        [imei, branchId]
                    );
                    if (!imeiRows || imeiRows.length === 0 || !['available', 'in_stock'].includes(imeiRows[0].status)) {
                        await conn.rollback();
                        conn.release();
                        return res.status(400).json({
                            success: false,
                            message: `IMEI ${imei} is not available for sale at this branch`
                        });
                    }
                    const costPrice = imeiRows[0].purchase_price != null ? Number(imeiRows[0].purchase_price) : 0;
                    saleItemsToInsert.push({
                        product_id: productId,
                        custom_product_name: null,
                        imei,
                        quantity: 1,
                        unit_price: unitPrice,
                        cost_price: costPrice,
                        discount_amount: 0,
                        subtotal: sub
                    });
                } else {
                    const [stockRows] = await conn.execute(
                        'SELECT stock FROM products WHERE id = ?',
                        [productId]
                    );
                    const available = stockRows && stockRows.length > 0 ? (parseInt(stockRows[0].stock, 10) || 0) : 0;
                    if (available < qty) {
                        await conn.rollback();
                        conn.release();
                        return res.status(400).json({
                            success: false,
                            message: `Insufficient stock for product "${it.product_name || productId}". Required: ${qty}, Available: ${available}`
                        });
                    }
                    saleItemsToInsert.push({
                        product_id: productId,
                        custom_product_name: null,
                        imei: null,
                        quantity: qty,
                        unit_price: unitPrice,
                        cost_price: 0,
                        discount_amount: 0,
                        subtotal: sub
                    });
                }
            } else if (customName) {
                saleItemsToInsert.push({
                    product_id: null,
                    custom_product_name: customName,
                    imei: null,
                    quantity: qty,
                    unit_price: unitPrice,
                    cost_price: 0,
                    discount_amount: 0,
                    subtotal: sub
                });
            }
        }

        await conn.beginTransaction();

        const [saleResult] = await conn.execute(
            `INSERT INTO sales (invoice_number, branch_id, customer_id, user_id, total_amount, discount_amount, tax_amount, paid_amount, due_amount, payment_status, notes)
             VALUES (?, ?, ?, ?, ?, 0, 0, ?, 0, ?, ?)
             RETURNING id`,
            [
                invoiceNumber,
                branchId,
                order.customer_id || null,
                effectiveUserId,
                subtotal,
                totalPaid,
                PAYMENT_STATUS.PAID,
                (order.notes || '') + (order.order_number ? ` [Converted from Per Order ${order.order_number}]` : '')
            ]
        );
        const saleId = saleResult.insertId || (saleResult.rows && saleResult.rows[0] && saleResult.rows[0].id);
        if (!saleId) {
            await conn.rollback();
            conn.release();
            return res.status(500).json({ success: false, message: 'Failed to create sale record' });
        }

        for (const it of saleItemsToInsert) {
            await conn.execute(
                `INSERT INTO sale_items (sale_id, product_id, custom_product_name, imei, quantity, unit_price, cost_price, discount_amount, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    saleId,
                    it.product_id,
                    it.custom_product_name,
                    it.imei,
                    it.quantity,
                    it.unit_price,
                    it.cost_price,
                    it.discount_amount,
                    it.subtotal
                ]
            );
            if (it.imei) {
                await conn.execute(
                    'UPDATE product_imeis SET status = ?, sale_id = ? WHERE imei = ? AND branch_id = ?',
                    [IMEI_STATUS.SOLD, saleId, it.imei, branchId]
                );
            } else if (it.product_id != null) {
                await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [it.quantity, it.product_id]);
                const [bs] = await conn.execute('SELECT 1 FROM branch_stock WHERE branch_id = ? AND product_id = ?', [branchId, it.product_id]);
                if (bs && bs.length > 0) {
                    await conn.execute(
                        'UPDATE branch_stock SET quantity = quantity - ? WHERE branch_id = ? AND product_id = ?',
                        [it.quantity, branchId, it.product_id]
                    );
                }
            }
        }

        if (totalPaid > 0) {
            await conn.execute(
                `INSERT INTO payments (sale_id, amount, payment_method, created_by) VALUES (?, ?, ?, ?)`,
                [saleId, totalPaid, paymentMethod || 'cash', effectiveUserId]
            );
        }

        await conn.execute(
            'UPDATE per_orders SET status = ?, converted_sale_id = ? WHERE id = ?',
            ['completed', saleId, id]
        );

        await conn.commit();
        conn.release();

        const [updated] = await executeQuery(
            `SELECT po.*, b.name AS branch_name, u.full_name AS user_name FROM per_orders po
             LEFT JOIN branches b ON b.id = po.branch_id LEFT JOIN users u ON u.id = po.user_id WHERE po.id = ?`,
            [id]
        );
        const [saleRow] = await executeQuery(
            'SELECT id, invoice_number, total_amount, paid_amount FROM sales WHERE id = ?',
            [saleId]
        );

        res.json({
            success: true,
            message: 'Per order converted to sale successfully',
            data: {
                per_order: updated && updated[0] ? updated[0] : null,
                sale_id: saleId,
                sale: saleRow && saleRow[0] ? saleRow[0] : null
            }
        });
    } catch (error) {
        await conn.rollback().catch(() => {});
        conn.release().catch(() => {});
        logger.error('Convert to sale error:', { message: error.message });
        next(error);
    }
};

/**
 * Delete per order. Admin: any branch; others: only their branch.
 */
const deletePerOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = req.user?.role != null ? String(req.user.role).toLowerCase() : '';
        const isAdminUser = role === 'admin';
        const userBranchId = req.user?.branch_id != null ? parseInt(req.user.branch_id, 10) : null;

        const [existing] = await executeQuery('SELECT id, branch_id FROM per_orders WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Per order not found'
            });
        }
        if (!isAdminUser && existing[0].branch_id !== userBranchId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this order'
            });
        }

        await executeQuery('DELETE FROM per_orders WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Per order deleted successfully'
        });
    } catch (error) {
        logger.error('Delete per order error:', { message: error.message });
        next(error);
    }
};

module.exports = {
    listPerOrders,
    getPerOrder,
    createPerOrder,
    updatePerOrder,
    cancelPerOrder,
    convertToSale,
    deletePerOrder
};
