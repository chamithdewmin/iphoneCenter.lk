const { executeQuery, getConnection } = require('../config/database');
const { generateBarcode, validateIMEI, isAdmin } = require('../utils/helpers');
const { getEffectiveUserId } = require('../utils/userResolution');
const logger = require('../utils/logger');

/**
 * Get all products
 */
const getAllProducts = async (req, res, next) => {
    try {
        const { search, category, brand } = req.query;

        const query = `SELECT p.*, b.barcode,
                       COALESCE(bs.total_quantity, 0) AS quantity
                       FROM products p
                       LEFT JOIN barcodes b ON b.product_id = p.id AND b.is_active = TRUE
                       LEFT JOIN (
                           SELECT product_id, SUM(quantity) AS total_quantity
                           FROM branch_stock
                           GROUP BY product_id
                       ) bs ON bs.product_id = p.id
                       WHERE 1=1`;
        const params = [];

        if (search) {
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            // query already has WHERE 1=1; add AND (p.name LIKE ? OR ...)
        }
        let fullQuery = query;
        if (search) {
            fullQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)';
        }
        if (category) {
            fullQuery += ' AND p.category = ?';
            params.push(category);
        }
        if (brand) {
            fullQuery += ' AND p.brand = ?';
            params.push(brand);
        }

        fullQuery += ' ORDER BY p.name ASC';

        const [rows] = await executeQuery(fullQuery, params);
        const products = (rows || []).map((row) => {
            const { barcode, quantity: qty, ...rest } = row;
            return {
                ...rest,
                barcode: barcode || null,
                quantity: parseInt(qty, 10) || 0,
                stock: parseInt(qty, 10) || 0, // alias for compatibility
            };
        });

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        logger.error('Get products error:', error);
        next(error);
    }
};

/**
 * Get product by ID
 */
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [products] = await executeQuery(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: products[0]
        });
    } catch (error) {
        logger.error('Get product error:', error);
        next(error);
    }
};

/**
 * Create product
 */
const createProduct = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { name, sku, description, category, brand, basePrice, initialQuantity, branchId: bodyBranchId } = req.body;

        if (!name || !sku || !basePrice) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Name, SKU, and base price are required'
            });
        }

        // Branch for initial stock: admin must send branchId (dropdown); manager/staff use their branch only
        let branchIdForStock = null;
        if (isAdmin(req) && bodyBranchId != null && bodyBranchId !== '') {
            branchIdForStock = parseInt(bodyBranchId, 10);
            if (Number.isNaN(branchIdForStock)) branchIdForStock = null;
        } else if (req.user?.branch_id != null) {
            branchIdForStock = parseInt(req.user.branch_id, 10) || req.user.branch_id;
        }
        if (isAdmin(req) && !branchIdForStock) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Please select a branch for this product'
            });
        }
        if (!branchIdForStock) {
            const [branches] = await connection.execute(
                'SELECT id FROM branches WHERE is_active = TRUE ORDER BY id LIMIT 1'
            );
            branchIdForStock = branches.length > 0 ? branches[0].id : null;
        }

        // Check if SKU exists
        const [existing] = await connection.execute(
            'SELECT id FROM products WHERE sku = ?',
            [sku]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'SKU already exists'
            });
        }

        const [result] = await connection.execute(
            `INSERT INTO products (name, sku, description, category, brand, base_price) 
             VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
            [name, sku, description || null, category || null, brand || null, basePrice]
        );

        const productId = result.insertId;

        // Generate barcode
        const barcode = generateBarcode(productId, sku);
        await connection.execute(
            'INSERT INTO barcodes (product_id, barcode) VALUES (?, ?)',
            [productId, barcode]
        );

        // Set initial stock quantity at the chosen branch
        const qty = Math.max(0, parseInt(initialQuantity, 10) || 0);
        if (qty >= 0 && branchIdForStock) {
            await connection.execute(
                `INSERT INTO branch_stock (branch_id, product_id, quantity) VALUES (?, ?, ?)
                 ON CONFLICT (branch_id, product_id) DO UPDATE SET quantity = branch_stock.quantity + EXCLUDED.quantity`,
                [branchIdForStock, productId, qty]
            );
        }

        await connection.commit();

        logger.info(`Product created: ${name} (ID: ${result.insertId})`);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                id: result.insertId,
                name,
                sku,
                barcode
            }
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Create product error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Get stock for a branch (or all branches aggregated when branchId=all for admin)
 */
const getBranchStock = async (req, res, next) => {
    try {
        const branchId = req.branchId || req.user.branch_id;

        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: 'Branch ID is required'
            });
        }

        if (branchId === 'all' && isAdmin(req)) {
            const [stock] = await executeQuery(
                `SELECT p.id AS product_id, p.name AS product_name, p.sku, p.base_price, p.category, p.brand,
                        (SELECT b2.barcode FROM barcodes b2 WHERE b2.product_id = p.id AND b2.is_active = TRUE LIMIT 1) AS barcode,
                        COALESCE(agg.total_quantity, 0) AS quantity, COALESCE(agg.total_reserved, 0) AS reserved_quantity
                 FROM products p
                 LEFT JOIN (
                     SELECT product_id, SUM(quantity) AS total_quantity, SUM(reserved_quantity) AS total_reserved
                     FROM branch_stock GROUP BY product_id
                 ) agg ON agg.product_id = p.id
                 ORDER BY p.name ASC`
            );
            const normalized = (stock || []).map((row) => ({
                ...row,
                id: row.product_id,
                quantity: parseInt(row.quantity, 10) || 0,
                reserved_quantity: parseInt(row.reserved_quantity, 10) || 0,
            }));
            return res.json({ success: true, data: normalized });
        }

        const [stock] = await executeQuery(
            `SELECT bs.*, p.name as product_name, p.sku, p.base_price, p.category, p.brand, b.barcode
             FROM branch_stock bs
             INNER JOIN products p ON bs.product_id = p.id
             LEFT JOIN barcodes b ON b.product_id = p.id AND b.is_active = TRUE
             WHERE bs.branch_id = ?
             ORDER BY p.name ASC`,
            [branchId]
        );

        res.json({
            success: true,
            data: stock
        });
    } catch (error) {
        logger.error('Get branch stock error:', error);
        next(error);
    }
};

/**
 * Update stock quantity
 */
const updateStock = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        let branchId = (isAdmin(req) && (req.body.branchId != null && req.body.branchId !== ''))
            ? parseInt(req.body.branchId, 10) || req.body.branchId
            : (req.branchId || req.user.branch_id);
        if (!branchId && isAdmin(req)) {
            const [branches] = await connection.execute(
                'SELECT id FROM branches WHERE is_active = TRUE ORDER BY id LIMIT 1'
            );
            if (branches.length > 0) branchId = branches[0].id;
        }
        const { productId, quantity, minStockLevel } = req.body;

        if (!productId || quantity === undefined) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Product ID and quantity are required'
            });
        }

        if (!branchId) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Branch is required. Create a branch or assign one to your user.'
            });
        }

        // Check if stock record exists
        const [existing] = await connection.execute(
            'SELECT id FROM branch_stock WHERE branch_id = ? AND product_id = ?',
            [branchId, productId]
        );

        if (existing.length > 0) {
            // Update existing stock
            const updates = ['quantity = ?'];
            const params = [quantity];

            if (minStockLevel !== undefined) {
                updates.push('min_stock_level = ?');
                params.push(minStockLevel);
            }

            params.push(branchId, productId);

            await connection.execute(
                `UPDATE branch_stock SET ${updates.join(', ')} 
                 WHERE branch_id = ? AND product_id = ?`,
                params
            );
        } else {
            // Create new stock record
            await connection.execute(
                `INSERT INTO branch_stock (branch_id, product_id, quantity, min_stock_level) 
                 VALUES (?, ?, ?, ?)`,
                [branchId, productId, quantity, minStockLevel || 0]
            );
        }

        await connection.commit();

        logger.info(`Stock updated: Branch ${branchId}, Product ${productId}, Quantity ${quantity}`);

        res.json({
            success: true,
            message: 'Stock updated successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Update stock error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Add IMEI to product
 */
const addIMEI = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const branchId = req.branchId || req.user.branch_id;
        const { productId, imei, purchasePrice } = req.body;

        if (!productId || !imei) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Product ID and IMEI are required'
            });
        }

        if (!validateIMEI(imei)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid IMEI format (must be 15 digits)'
            });
        }

        // Check if IMEI already exists
        const [existing] = await connection.execute(
            'SELECT id FROM product_imeis WHERE imei = ?',
            [imei]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'IMEI already exists'
            });
        }

        // Add IMEI
        const [result] = await connection.execute(
            `INSERT INTO product_imeis (product_id, branch_id, imei, purchase_price, status) 
             VALUES (?, ?, ?, ?, 'available') RETURNING id`,
            [productId, branchId, imei, purchasePrice || null]
        );

        // Update stock quantity (PostgreSQL upsert)
        await connection.execute(
            `INSERT INTO branch_stock (branch_id, product_id, quantity) 
             VALUES (?, ?, 1)
             ON CONFLICT (branch_id, product_id) DO UPDATE SET quantity = branch_stock.quantity + 1`,
            [branchId, productId]
        );

        await connection.commit();

        logger.info(`IMEI added: ${imei} for Product ${productId}`);

        res.status(201).json({
            success: true,
            message: 'IMEI added successfully',
            data: {
                id: result.insertId,
                imei
            }
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Add IMEI error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Get IMEIs for a product/branch
 */
const getIMEIs = async (req, res, next) => {
    try {
        const branchId = req.branchId || req.user.branch_id;
        const { productId, status } = req.query;

        let query = `SELECT pi.*, p.name as product_name, p.sku
                     FROM product_imeis pi
                     INNER JOIN products p ON pi.product_id = p.id
                     WHERE pi.branch_id = ?`;
        const params = [branchId];

        if (productId) {
            query += ' AND pi.product_id = ?';
            params.push(productId);
        }
        if (status) {
            query += ' AND pi.status = ?';
            params.push(status);
        }

        query += ' ORDER BY pi.created_at DESC';

        const [imeis] = await executeQuery(query, params);

        res.json({
            success: true,
            data: imeis
        });
    } catch (error) {
        logger.error('Get IMEIs error:', error);
        next(error);
    }
};

/**
 * Transfer stock between branches
 */
const transferStock = async (req, res, next) => {
    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        const effectiveUserId = await getEffectiveUserId(connection, req.user.id);
        if (effectiveUserId == null) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'No active user in database. Add a user in Users first.'
            });
        }

        const { toBranchId: rawTo, productId: rawProductId, quantity: rawQty, imei, notes, fromBranchId: bodyFrom } = req.body;
        const rawFrom = isAdmin(req) && bodyFrom != null && bodyFrom !== '' ? bodyFrom : req.user.branch_id;
        const fromBranchId = rawFrom != null && rawFrom !== '' ? parseInt(rawFrom, 10) : null;
        const toBranchId = rawTo != null && rawTo !== '' ? parseInt(rawTo, 10) : null;
        const productId = rawProductId != null && rawProductId !== '' ? parseInt(rawProductId, 10) : null;
        const quantity = rawQty != null && rawQty !== '' ? parseInt(Number(rawQty), 10) : NaN;

        if (fromBranchId == null || Number.isNaN(fromBranchId) || toBranchId == null || Number.isNaN(toBranchId) ||
            productId == null || Number.isNaN(productId) || !Number.isInteger(quantity) || quantity < 1) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'From branch, to branch, product, and quantity (positive integer) are required'
            });
        }

        if (fromBranchId === toBranchId) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot transfer to the same branch'
            });
        }

        // Check available stock
        const [stock] = await connection.execute(
            'SELECT quantity, reserved_quantity FROM branch_stock WHERE branch_id = ? AND product_id = ?',
            [fromBranchId, productId]
        );

        const qty = Number(stock[0]?.quantity ?? 0);
        const reserved = Number(stock[0]?.reserved_quantity ?? 0);
        if (stock.length === 0 || qty - reserved < quantity) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock available for transfer'
            });
        }

        // Generate transfer number
        const { generateTransferNumber } = require('../utils/helpers');
        const transferNumber = generateTransferNumber();

        // Create transfer record (RETURNING id for PostgreSQL insertId)
        const [transferResult] = await connection.execute(
            `INSERT INTO stock_transfers (transfer_number, from_branch_id, to_branch_id, 
                                         product_id, quantity, imei, notes, requested_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [transferNumber, fromBranchId, toBranchId, productId, quantity, imei || null, notes || null, effectiveUserId]
        );

        // If IMEI is specified, update IMEI status
        if (imei) {
            await connection.execute(
                `UPDATE product_imeis 
                 SET status = 'transferred', branch_id = ? 
                 WHERE imei = ? AND branch_id = ? AND status = 'available'`,
                [toBranchId, imei, fromBranchId]
            );
        }

        // Update stock (decrease from source, increase at destination)
        await connection.execute(
            'UPDATE branch_stock SET quantity = quantity - ? WHERE branch_id = ? AND product_id = ?',
            [quantity, fromBranchId, productId]
        );

        await connection.execute(
            `INSERT INTO branch_stock (branch_id, product_id, quantity) 
             VALUES (?, ?, ?)
             ON CONFLICT (branch_id, product_id) DO UPDATE SET quantity = branch_stock.quantity + EXCLUDED.quantity`,
            [toBranchId, productId, quantity]
        );

        await connection.commit();

        logger.info(`Stock transfer created: ${transferNumber}`);

        res.status(201).json({
            success: true,
            message: 'Stock transfer initiated successfully',
            data: {
                transferId: transferResult.insertId,
                transferNumber
            }
        });
    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (_) { /* ignore */ }
        }
        logger.error('Transfer stock error:', error);
        next(error);
    } finally {
        if (connection) {
            try { connection.release(); } catch (_) { /* ignore */ }
        }
    }
};

/**
 * Complete stock transfer (Manager/Admin only)
 */
const completeTransfer = async (req, res, next) => {
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

        const [transfers] = await connection.execute(
            'SELECT * FROM stock_transfers WHERE id = ? AND status = ?',
            [id, 'pending']
        );

        if (transfers.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Transfer not found or already processed'
            });
        }

        const transfer = transfers[0];

        // Update transfer status
        await connection.execute(
            'UPDATE stock_transfers SET status = ?, approved_by = ?, completed_at = NOW() WHERE id = ?',
            ['completed', effectiveUserId, id]
        );

        await connection.commit();

        logger.info(`Stock transfer completed: ID ${id}`);

        res.json({
            success: true,
            message: 'Stock transfer completed successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Complete transfer error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Generate barcode for product
 */
const generateBarcodeForProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const [products] = await executeQuery(
            'SELECT id, sku FROM products WHERE id = ?',
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const product = products[0];
        const barcode = generateBarcode(product.id, product.sku);

        // Check if barcode already exists
        const [existing] = await executeQuery(
            'SELECT id FROM barcodes WHERE product_id = ?',
            [productId]
        );

        if (existing.length === 0) {
            await executeQuery(
                'INSERT INTO barcodes (product_id, barcode) VALUES (?, ?)',
                [productId, barcode]
            );
        } else {
            await executeQuery(
                'UPDATE barcodes SET barcode = ? WHERE product_id = ?',
                [barcode, productId]
            );
        }

        res.json({
            success: true,
            data: {
                productId: product.id,
                barcode
            }
        });
    } catch (error) {
        logger.error('Generate barcode error:', error);
        next(error);
    }
};

/**
 * Validate barcode
 */
const validateBarcode = async (req, res, next) => {
    try {
        const { barcode } = req.params;

        const [barcodes] = await executeQuery(
            `SELECT b.*, p.id as product_id, p.name, p.sku, p.base_price, p.category, p.brand
             FROM barcodes b
             INNER JOIN products p ON b.product_id = p.id
             WHERE b.barcode = ? AND b.is_active = TRUE`,
            [barcode]
        );

        if (barcodes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Barcode not found'
            });
        }

        res.json({
            success: true,
            data: barcodes[0]
        });
    } catch (error) {
        logger.error('Validate barcode error:', error);
        next(error);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    getBranchStock,
    updateStock,
    addIMEI,
    getIMEIs,
    transferStock,
    completeTransfer,
    generateBarcodeForProduct,
    validateBarcode
};
