'use strict';
const { getConnection } = require('../config/database');
const { generateBarcode, isAdmin } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Create product - in separate file to avoid try/catch parse issues in main controller.
 * DB columns: name, sku, description, category, brand, base_price.
 */
async function createProduct(req, res, next) {
    if (process.env.NODE_ENV !== 'production') {
        logger.debug('Create product request', { bodyKeys: Object.keys(req.body || {}), name: req.body?.name, sku: req.body?.sku });
    }
    let connection;
    try {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const sku = typeof req.body.sku === 'string' ? req.body.sku.trim() : '';
        const base_price = Number(req.body.base_price ?? req.body.basePrice);

        if (!name) {
            return res.status(400).json({ success: false, message: 'Product name is required' });
        }
        if (!sku) {
            return res.status(400).json({ success: false, message: 'SKU is required' });
        }
        if (base_price === undefined || base_price === null || Number.isNaN(base_price) || base_price < 0) {
            return res.status(400).json({ success: false, message: 'Valid base price is required (0 or greater)' });
        }

        const { description, category, brand, initialQuantity, branchId: bodyBranchId } = req.body || {};

        connection = await getConnection();
        await connection.beginTransaction();

        let branchIdForStock = null;
        if (isAdmin(req) && bodyBranchId != null && bodyBranchId !== '') {
            branchIdForStock = parseInt(bodyBranchId, 10);
            if (Number.isNaN(branchIdForStock)) branchIdForStock = null;
        } else if (req.user && req.user.branch_id != null) {
            branchIdForStock = parseInt(req.user.branch_id, 10) || req.user.branch_id;
        }
        if (isAdmin(req) && !branchIdForStock) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Please select a branch for this product' });
        }
        if (!branchIdForStock) {
            const [branches] = await connection.execute('SELECT id FROM branches WHERE is_active = TRUE ORDER BY id LIMIT 1');
            branchIdForStock = branches.length > 0 ? branches[0].id : null;
        }

        if (branchIdForStock) {
            const [branchRows] = await connection.execute(
                'SELECT id FROM branches WHERE id = ? AND is_active = TRUE',
                [branchIdForStock]
            );
            if (!branchRows || branchRows.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Selected branch not found or inactive. Add a warehouse (branch) first in Warehouses.'
                });
            }
        }

        const [existing] = await connection.execute('SELECT id FROM products WHERE sku = ?', [sku]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'SKU already exists' });
        }

        const [result] = await connection.execute(
            'INSERT INTO products (name, sku, description, category, brand, base_price) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
            [name, sku, description || null, category || null, brand || null, base_price]
        );

        const productId = result.insertId || (result.rows && result.rows[0] && result.rows[0].id);
        if (!productId) {
            await connection.rollback();
            logger.error('Create product: INSERT did not return id', { result });
            return res.status(500).json({ success: false, message: 'Could not create product record. Check backend logs.' });
        }

        const barcode = generateBarcode(productId, sku);
        await connection.execute('INSERT INTO barcodes (product_id, barcode) VALUES (?, ?)', [productId, barcode]);

        const qty = Math.max(0, parseInt(initialQuantity, 10) || 0);
        if (qty >= 0 && branchIdForStock) {
            await connection.execute(
                'INSERT INTO branch_stock (branch_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT (branch_id, product_id) DO UPDATE SET quantity = branch_stock.quantity + EXCLUDED.quantity',
                [branchIdForStock, productId, qty]
            );
        }

        await connection.commit();
        logger.info('Product created: ' + name + ' (ID: ' + productId + ')');
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { id: productId, name, sku, barcode }
        });
    } catch (error) {
        if (connection && connection.rollback) {
            await connection.rollback().catch((err) => logger.error('Rollback error:', err));
        }
        logger.error('Create product error', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail,
            bodyKeys: req.body ? Object.keys(req.body) : []
        });
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'SKU already exists', detail: error.detail || null });
        }
        if (error.code === '23502') {
            return res.status(400).json({ success: false, message: 'Missing required field', detail: error.detail || null });
        }
        const msg = error.message || (error.code ? 'Error ' + error.code : '') || error.detail || 'Could not add product';
        return res.status(500).json({ success: false, message: msg, detail: error.detail || null, code: error.code || null });
    } finally {
        if (connection && connection.release) {
            await connection.release().catch((err) => logger.error('Release connection error:', err));
        }
    }
}

module.exports = { createProduct };
