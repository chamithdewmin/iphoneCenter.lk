const { executeQuery, getConnection } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all brands
 */
const getAllBrands = async (req, res, next) => {
    try {
        const query = 'SELECT * FROM brands WHERE is_active = TRUE ORDER BY name ASC';
        const [rows] = await executeQuery(query);
        const list = Array.isArray(rows) ? rows : [];

        logger.info('Get brands OK', { count: list.length });

        res.json({
            success: true,
            data: list
        });
    } catch (error) {
        logger.error('Get brands error:', error);
        next(error);
    }
};

/**
 * Get brand by ID
 */
const getBrandById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await executeQuery('SELECT * FROM brands WHERE id = ? AND is_active = TRUE', [id]);
        
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        logger.error('Get brand by ID error:', error);
        next(error);
    }
};

/**
 * Create new brand (Admin/Manager only)
 */
const createBrand = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { name, description } = req.body;

        if (!name || !name.trim()) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Brand name is required'
            });
        }

        // Check if brand already exists
        const [existing] = await connection.execute(
            'SELECT id FROM brands WHERE LOWER(name) = LOWER(?) AND is_active = TRUE',
            [name.trim()]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Brand already exists'
            });
        }

        const [result] = await connection.execute(
            `INSERT INTO brands (name, description) 
             VALUES (?, ?) RETURNING id`,
            [name.trim(), description?.trim() || null]
        );

        await connection.commit();

        logger.info(`Brand created: ${name.trim()} (ID: ${result.insertId})`);

        res.status(201).json({
            success: true,
            message: 'Brand created successfully',
            data: {
                id: result.insertId,
                name: name.trim(),
                description: description?.trim() || null
            }
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Create brand error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Update brand (Admin/Manager only)
 */
const updateBrand = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Brand name is required'
            });
        }

        // Check if brand exists
        const [existing] = await connection.execute(
            'SELECT id FROM brands WHERE id = ? AND is_active = TRUE',
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Brand not found'
            });
        }

        // Check if another brand with the same name exists
        const [duplicate] = await connection.execute(
            'SELECT id FROM brands WHERE LOWER(name) = LOWER(?) AND id != ? AND is_active = TRUE',
            [name.trim(), id]
        );

        if (duplicate.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Brand name already exists'
            });
        }

        await connection.execute(
            `UPDATE brands 
             SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name.trim(), description?.trim() || null, id]
        );

        await connection.commit();

        logger.info(`Brand updated: ${name.trim()} (ID: ${id})`);

        res.json({
            success: true,
            message: 'Brand updated successfully',
            data: {
                id: parseInt(id),
                name: name.trim(),
                description: description?.trim() || null
            }
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Update brand error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Delete brand (soft delete - Admin/Manager only)
 */
const deleteBrand = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if brand exists
        const [existing] = await connection.execute(
            'SELECT id FROM brands WHERE id = ? AND is_active = TRUE',
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Brand not found'
            });
        }

        // Soft delete
        await connection.execute(
            'UPDATE brands SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        await connection.commit();

        logger.info(`Brand deleted (soft): ID ${id}`);

        res.json({
            success: true,
            message: 'Brand deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Delete brand error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand
};
