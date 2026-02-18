const { executeQuery, getConnection } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all categories
 */
const getAllCategories = async (req, res, next) => {
    try {
        const query = 'SELECT * FROM categories WHERE is_active = TRUE ORDER BY name ASC';
        const [rows] = await executeQuery(query);
        const list = Array.isArray(rows) ? rows : [];

        logger.info('Get categories OK', { count: list.length });

        res.json({
            success: true,
            data: list
        });
    } catch (error) {
        logger.error('Get categories error:', error);
        next(error);
    }
};

/**
 * Get category by ID
 */
const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await executeQuery('SELECT * FROM categories WHERE id = ? AND is_active = TRUE', [id]);
        
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        logger.error('Get category by ID error:', error);
        next(error);
    }
};

/**
 * Create new category (Admin/Manager only)
 */
const createCategory = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { name, description } = req.body;

        if (!name || !name.trim()) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Check if category already exists
        const [existing] = await connection.execute(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND is_active = TRUE',
            [name.trim()]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Category already exists'
            });
        }

        const [result] = await connection.execute(
            `INSERT INTO categories (name, description) 
             VALUES (?, ?) RETURNING id`,
            [name.trim(), description?.trim() || null]
        );

        await connection.commit();

        logger.info(`Category created: ${name.trim()} (ID: ${result.insertId})`);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: {
                id: result.insertId,
                name: name.trim(),
                description: description?.trim() || null
            }
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Create category error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Update category (Admin/Manager only)
 */
const updateCategory = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Check if category exists
        const [existing] = await connection.execute(
            'SELECT id FROM categories WHERE id = ? AND is_active = TRUE',
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if another category with the same name exists
        const [duplicate] = await connection.execute(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ? AND is_active = TRUE',
            [name.trim(), id]
        );

        if (duplicate.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Category name already exists'
            });
        }

        await connection.execute(
            `UPDATE categories 
             SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name.trim(), description?.trim() || null, id]
        );

        await connection.commit();

        logger.info(`Category updated: ${name.trim()} (ID: ${id})`);

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: {
                id: parseInt(id),
                name: name.trim(),
                description: description?.trim() || null
            }
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Update category error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Delete category (soft delete - Admin/Manager only)
 */
const deleteCategory = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if category exists
        const [existing] = await connection.execute(
            'SELECT id FROM categories WHERE id = ? AND is_active = TRUE',
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Soft delete
        await connection.execute(
            'UPDATE categories SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        await connection.commit();

        logger.info(`Category deleted (soft): ID ${id}`);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Delete category error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
