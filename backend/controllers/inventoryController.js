const { executeQuery, getConnection } = require('../config/database');
const { generateBarcode, validateIMEI } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get all products
 */
const getAllProducts = async (req, res, next) => {
    try {
        const { search, category, brand } = req.query;
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR sku LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (brand) {
            query += ' AND brand = ?';
            params.push(brand);
        }

        query += ' ORDER BY name ASC';

        const [products] = await executeQuery(query, params);

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

        const { name, sku, description, category, brand, basePrice } = req.body;

        if (!name || !sku || !basePrice) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Name, SKU, and base price are required'
            });
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

        // Generate barcode
        const barcode = generateBarcode(result.insertId, sku);
        await connection.execute(
            'INSERT INTO barcodes (product_id, barcode) VALUES (?, ?)',
            [result.insertId, barcode]
        );

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
 * Get stock for a branch
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

        const [stock] = await executeQuery(
            `SELECT bs.*, p.name as product_name, p.sku, p.base_price, p.category, p.brand
             FROM branch_stock bs
             INNER JOIN products p ON bs.product_id = p.id
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

        const branchId = req.branchId || req.user.branch_id;
        const { productId, quantity, minStockLevel } = req.body;

        if (!productId || quantity === undefined) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Product ID and quantity are required'
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

        // Update stock quantity
        await connection.execute(
            `INSERT INTO branch_stock (branch_id, product_id, quantity) 
             VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
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
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const fromBranchId = req.user.branch_id;
        const { toBranchId, productId, quantity, imei, notes } = req.body;

        if (!toBranchId || !productId || !quantity) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'To branch, product, and quantity are required'
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

        if (stock.length === 0 || stock[0].quantity - stock[0].reserved_quantity < quantity) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock available for transfer'
            });
        }

        // Generate transfer number
        const { generateTransferNumber } = require('../utils/helpers');
        const transferNumber = generateTransferNumber();

        // Create transfer record
        const [transferResult] = await connection.execute(
            `INSERT INTO stock_transfers (transfer_number, from_branch_id, to_branch_id, 
                                         product_id, quantity, imei, notes, requested_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [transferNumber, fromBranchId, toBranchId, productId, quantity, imei || null, notes || null, req.user.id]
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
             ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
            [toBranchId, productId, quantity, quantity]
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
        await connection.rollback();
        logger.error('Transfer stock error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Complete stock transfer (Manager/Admin only)
 */
const completeTransfer = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

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
            ['completed', req.user.id, id]
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
