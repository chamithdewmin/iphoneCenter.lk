const { executeQuery, getConnection } = require('../config/database');
const { generateBarcode, validateIMEI, isAdmin } = require('../utils/helpers');
const { getEffectiveUserId } = require('../utils/userResolution');
const logger = require('../utils/logger');
const { createProduct } = require('./createProductHandler');
const { generateSingleBarcodePdf } = require('../utils/barcodePdf');

/**
 * Get all products (hybrid: inventory_type, stock = product.stock for quantity, device count for unique)
 */
const getAllProducts = async (req, res, next) => {
    try {
        const { search, category, brand, inventory_type: invType } = req.query;

        const query = `SELECT p.*, c.name AS category_name, b.barcode,
                       COALESCE(p.inventory_type, 'quantity') AS inventory_type,
                       CASE WHEN COALESCE(p.inventory_type, 'quantity') = 'quantity'
                            THEN COALESCE(p.stock, 0)
                            ELSE (SELECT COUNT(*)::int FROM product_imeis pi
                                  WHERE pi.product_id = p.id AND pi.status IN ('in_stock', 'available'))
                       END AS stock
                       FROM products p
                       LEFT JOIN categories c ON c.id = p.category_id
                       LEFT JOIN barcodes b ON b.product_id = p.id AND b.is_active = TRUE
                       WHERE p.is_active = TRUE`;
        const params = [];

        if (search) {
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            // add AND (p.name LIKE ? OR ...)
        }
        let fullQuery = query;
        if (search) {
            fullQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)';
        }
        if (category) {
            fullQuery += ' AND (p.category = ? OR c.name = ?)';
            params.push(category, category);
        }
        if (brand) {
            fullQuery += ' AND p.brand = ?';
            params.push(brand);
        }
        if (invType === 'unique' || invType === 'quantity') {
            fullQuery += ' AND COALESCE(p.inventory_type, ?) = ?';
            params.push('quantity', invType);
        }

        fullQuery += ' ORDER BY p.name ASC';

        const [rows] = await executeQuery(fullQuery, params);
        const products = (rows || []).map((row) => {
            const { barcode, stock: st, category_name, ...rest } = row;
            const stockVal = parseInt(st, 10) || 0;
            return {
                ...rest,
                category_name: category_name || row.category || null,
                barcode: barcode || null,
                quantity: stockVal,
                stock: stockVal,
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
 * Get product by ID (include inventory_type, stock, category_id/category_name)
 */
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [products] = await executeQuery(
            `SELECT p.*, c.name AS category_name,
                    COALESCE(p.inventory_type, 'quantity') AS inventory_type,
                    CASE WHEN COALESCE(p.inventory_type, 'quantity') = 'quantity'
                         THEN COALESCE(p.stock, 0)
                         ELSE (SELECT COUNT(*)::int FROM product_imeis pi
                               WHERE pi.product_id = p.id AND pi.status IN ('in_stock', 'available'))
                    END AS stock
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.id = ? AND p.is_active = TRUE`,
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const row = products[0];
        const stockVal = parseInt(row.stock, 10) || 0;
        res.json({
            success: true,
            data: {
                ...row,
                category_name: row.category_name || row.category || null,
                stock: stockVal,
                quantity: stockVal,
            }
        });
    } catch (error) {
        logger.error('Get product error:', error);
        next(error);
    }
};


/**
 * Get stock for a branch (or all branches when branchId=all). Hybrid: quantity = product.stock, unique = device count.
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
                `SELECT p.id AS product_id, p.name AS product_name, p.sku,
                        p.base_price, p.wholesale_price, p.retail_price, p.category, p.brand, p.category_id,
                        COALESCE(p.inventory_type, 'quantity') AS inventory_type,
                        (SELECT b2.barcode FROM barcodes b2 WHERE b2.product_id = p.id AND b2.is_active = TRUE LIMIT 1) AS barcode,
                        CASE WHEN COALESCE(p.inventory_type, 'quantity') = 'quantity'
                             THEN COALESCE(p.stock, 0)
                             ELSE (SELECT COUNT(*)::int FROM product_imeis pi WHERE pi.product_id = p.id AND pi.status IN ('in_stock', 'available'))
                        END AS quantity,
                        0 AS reserved_quantity
                 FROM products p
                 WHERE p.is_active = TRUE
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
            `SELECT p.id AS product_id, p.name AS product_name, p.sku, p.category, p.brand, p.category_id,
                    COALESCE(p.inventory_type, 'quantity') AS inventory_type,
                    p.base_price, p.wholesale_price, p.retail_price,
                    (SELECT b.barcode FROM barcodes b WHERE b.product_id = p.id AND b.is_active = TRUE LIMIT 1) AS barcode,
                    CASE WHEN COALESCE(p.inventory_type, 'quantity') = 'quantity'
                         THEN COALESCE(p.stock, 0)
                         ELSE (SELECT COUNT(*)::int FROM product_imeis pi WHERE pi.product_id = p.id AND pi.branch_id = ? AND pi.status IN ('in_stock', 'available'))
                    END AS quantity,
                    COALESCE(bs.reserved_quantity, 0) AS reserved_quantity,
                    bs.branch_id
             FROM products p
             LEFT JOIN branch_stock bs ON bs.product_id = p.id AND bs.branch_id = ?
             WHERE p.is_active = TRUE
             ORDER BY p.name ASC`,
            [branchId, branchId]
        );

        res.json({
            success: true,
            data: (stock || []).map((row) => ({
                ...row,
                id: row.product_id,
                quantity: parseInt(row.quantity, 10) || 0,
                reserved_quantity: parseInt(row.reserved_quantity, 10) || 0,
            }))
        });
    } catch (error) {
        logger.error('Get branch stock error:', error);
        next(error);
    }
};

/**
 * Update stock quantity (quantity products only; unique products use Add Devices)
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

        const [productRows] = await connection.execute(
            'SELECT id, inventory_type FROM products WHERE id = ? AND is_active = TRUE',
            [productId]
        );
        if (productRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        const invType = (productRows[0].inventory_type || 'quantity').toLowerCase();
        if (invType === 'unique') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Stock for unique (IMEI) products is managed via Add Devices. Adjust stock by adding or removing devices.'
            });
        }

        const qty = Math.max(0, parseInt(quantity, 10) || 0);
        await connection.execute(
            'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [qty, productId]
        );

        const [existing] = await connection.execute(
            'SELECT id FROM branch_stock WHERE branch_id = ? AND product_id = ?',
            [branchId, productId]
        );
        if (existing.length > 0) {
            const updates = ['quantity = ?'];
            const params = [qty];
            if (minStockLevel !== undefined) {
                updates.push('min_stock_level = ?');
                params.push(minStockLevel);
            }
            params.push(branchId, productId);
            await connection.execute(
                `UPDATE branch_stock SET ${updates.join(', ')} WHERE branch_id = ? AND product_id = ?`,
                params
            );
        } else {
            await connection.execute(
                'INSERT INTO branch_stock (branch_id, product_id, quantity, min_stock_level) VALUES (?, ?, ?, ?)',
                [branchId, productId, qty, minStockLevel || 0]
            );
        }

        await connection.commit();

        logger.info(`Stock updated: Branch ${branchId}, Product ${productId}, Quantity ${qty}`);

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
 * Add IMEI/device to product (unique products only). Supports single IMEI or bulk (imeis array).
 */
const addIMEI = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const branchId = req.branchId || req.user.branch_id;
        const { productId, imei: singleImei, imeis: bulkImeis, purchasePrice } = req.body;

        const imeiList = Array.isArray(bulkImeis) && bulkImeis.length > 0
            ? bulkImeis.map((i) => (typeof i === 'string' ? i.trim() : String(i).trim())).filter(Boolean)
            : (singleImei != null && String(singleImei).trim() ? [String(singleImei).trim()] : []);

        if (!productId || imeiList.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Product ID and at least one IMEI are required (or use imeis array for bulk)'
            });
        }

        const [productRows] = await connection.execute(
            'SELECT id, inventory_type FROM products WHERE id = ? AND is_active = TRUE',
            [productId]
        );
        if (productRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        const invType = (productRows[0].inventory_type || 'quantity').toLowerCase();
        if (invType !== 'unique') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Devices (IMEI) can only be added to products with inventory type "unique". Change product to unique or use stock for quantity products.'
            });
        }

        if (!branchId) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Branch is required. Set branch context or send branchId.'
            });
        }

        const added = [];
        const errors = [];
        const statusVal = 'in_stock';

        for (const imei of imeiList) {
            if (!validateIMEI(imei)) {
                errors.push({ imei, error: 'Invalid IMEI format (15 digits)' });
                continue;
            }
            const [existing] = await connection.execute(
                'SELECT id FROM product_imeis WHERE imei = ?',
                [imei]
            );
            if (existing.length > 0) {
                errors.push({ imei, error: 'IMEI already exists' });
                continue;
            }
            const [result] = await connection.execute(
                `INSERT INTO product_imeis (product_id, branch_id, imei, purchase_price, status) 
                 VALUES (?, ?, ?, ?, ?) RETURNING id`,
                [productId, branchId, imei, purchasePrice || null, statusVal]
            );
            const id = result.insertId ?? (result.rows && result.rows[0] && result.rows[0].id);
            added.push({ id, imei });
        }

        await connection.commit();

        logger.info(`IMEI(s) added: ${added.length} for Product ${productId}${errors.length ? `; ${errors.length} failed` : ''}`);

        res.status(201).json({
            success: true,
            message: added.length ? `${added.length} device(s) added successfully` : 'No devices added',
            data: {
                added,
                errors: errors.length ? errors : undefined,
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
                    INNER JOIN products p ON pi.product_id = p.id AND p.is_active = TRUE
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
            INNER JOIN products p ON b.product_id = p.id AND p.is_active = TRUE
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

/**
 * Download single barcode as PDF (print-ready, one barcode per page).
 * Query: productName (optional).
 */
const downloadBarcodePdf = async (req, res, next) => {
    try {
        const { barcode } = req.params;
        const productName = (req.query.productName || '').trim();

        if (!barcode) {
            return res.status(400).json({
                success: false,
                message: 'Barcode is required'
            });
        }

        const pdfBuffer = await generateSingleBarcodePdf(barcode, productName);
        const filename = `barcode_${(productName || barcode).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    } catch (error) {
        logger.error('Download barcode PDF error:', error);
        next(error);
    }
};

/**
 * Update product (Admin/Manager only)
 */
const updateProduct = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { name, sku, description, category, brand, basePrice, wholesalePrice, retailPrice, inventory_type: inventoryType, category_id: categoryId, stock: stockVal } = req.body;

        if (!name || !name.trim()) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Product name is required'
            });
        }

        if (!sku || !sku.trim()) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'SKU is required'
            });
        }

        let base = basePrice != null ? parseFloat(basePrice) : NaN;
        let wholesale = wholesalePrice != null ? parseFloat(wholesalePrice) : NaN;
        let retail = retailPrice != null ? parseFloat(retailPrice) : NaN;

        if (Number.isNaN(retail) && !Number.isNaN(base)) {
            retail = base;
        }
        if (Number.isNaN(base) && !Number.isNaN(retail)) {
            base = retail;
        }
        if (Number.isNaN(wholesale)) {
            wholesale = retail;
        }

        if (Number.isNaN(base) || base < 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Valid base price / retail price is required'
            });
        }

        if (!Number.isNaN(wholesale) && wholesale < 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Wholesale price cannot be negative'
            });
        }

        if (!Number.isNaN(wholesale) && !Number.isNaN(retail) && wholesale > retail) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Wholesale price cannot be higher than retail price'
            });
        }

        // Check if product exists
        const [existing] = await connection.execute(
            'SELECT id FROM products WHERE id = ? AND is_active = TRUE',
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if SKU is already used by another product
        const [duplicate] = await connection.execute(
            'SELECT id FROM products WHERE sku = ? AND id != ? AND is_active = TRUE',
            [sku.trim(), id]
        );

        if (duplicate.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'SKU already exists'
            });
        }

        const invType = (inventoryType && String(inventoryType).toLowerCase()) || null;
        const catId = categoryId != null && categoryId !== '' ? parseInt(categoryId, 10) : null;
        const stockNum = stockVal != null && stockVal !== '' ? parseInt(stockVal, 10) : null;

        await connection.execute(
            `UPDATE products 
             SET name = ?, sku = ?, description = ?, category = ?, brand = ?, 
                 wholesale_price = ?, retail_price = ?, base_price = ?,
                 inventory_type = COALESCE(?, inventory_type),
                 category_id = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name.trim(), sku.trim(), description?.trim() || null, category?.trim() || null, brand?.trim() || null,
             Number.isNaN(wholesale) ? null : wholesale,
             Number.isNaN(retail) ? base : retail,
             base,
             invType || 'quantity',
             Number.isNaN(catId) ? null : catId,
             id]
        );
        if (invType === 'quantity' && stockNum !== null && !Number.isNaN(stockNum) && stockNum >= 0) {
            await connection.execute(
                'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [stockNum, id]
            );
        }

        await connection.commit();

        logger.info(`Product updated: ${name.trim()} (ID: ${id})`);

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: {
                id: parseInt(id),
                name: name.trim(),
                sku: sku.trim()
            }
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Update product error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Delete product (hard delete - Admin/Manager only)
 * This will permanently remove the product and all related data (stock, IMEIs, barcodes)
 */
const deleteProduct = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if product exists
        const [existing] = await connection.execute(
            'SELECT id, name FROM products WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Hard delete - permanently remove from database
        // Related records (branch_stock, product_imeis, barcodes, sale_items) will be 
        // automatically deleted due to ON DELETE CASCADE foreign key constraints
        await connection.execute(
            'DELETE FROM products WHERE id = ?',
            [id]
        );

        await connection.commit();

        logger.info(`Product deleted (hard): ID ${id}`);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Delete product error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getBranchStock,
    updateStock,
    addIMEI,
    getIMEIs,
    transferStock,
    completeTransfer,
    generateBarcodeForProduct,
    validateBarcode,
    downloadBarcodePdf
};
