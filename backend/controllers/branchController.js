const { executeQuery, getConnection } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all branches (Admin sees all active, others see only their branch)
 */
const getAllBranches = async (req, res, next) => {
    try {
        const user = req.user || {};
        const role = user.role != null ? String(user.role).toLowerCase() : '';
        const branchId = user.branch_id;

        let query = 'SELECT * FROM branches WHERE 1=1';
        const params = [];

        // Non-admin users can only see their branch
        if (role !== 'admin' && branchId != null && branchId !== '') {
            query += ' AND id = ?';
            params.push(branchId);
        }

        query += ' ORDER BY name ASC';

        const [rows] = await executeQuery(query, params);
        const raw = Array.isArray(rows) ? rows : [];
        // Only return active branches (is_active may be missing in old schemas)
        const list = raw.filter((b) => b.is_active !== false);

        if (process.env.NODE_ENV === 'production') {
            console.log('Get branches OK:', list.length, 'branches');
        }
        logger.info('Get branches OK', { count: list.length });

        res.json({
            success: true,
            data: list
        });
    } catch (error) {
        // Log full error so container logs show the real PostgreSQL/code cause
        logger.error('Get branches error:', { message: error.message, code: error.code, stack: error.stack });
        if (process.env.NODE_ENV === 'production') {
            console.error('Get branches error:', error.code, error.message);
        }
        // Always return 503 for this endpoint so we never send 500; message hints at logs
        return res.status(503).json({
            success: false,
            message: 'Could not load warehouses. Check backend container logs for "Get branches error" and the PostgreSQL error (e.g. permission: GRANT SELECT ON branches TO your_db_user).'
        });
    }
};

/**
 * Get branch by ID
 */
const getBranchById = async (req, res, next) => {
    try {
        const { id } = req.params;

        let query = 'SELECT * FROM branches WHERE id = ?';
        const params = [id];

        // Non-admin users can only access their branch
        if (req.user.role !== 'admin' && req.user.branch_id) {
            if (parseInt(id) !== req.user.branch_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this branch'
                });
            }
        }

        const [branches] = await executeQuery(query, params);

        if (branches.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        res.json({
            success: true,
            data: branches[0]
        });
    } catch (error) {
        logger.error('Get branch error:', error);
        next(error);
    }
};

/**
 * Create new branch (Admin/Manager only)
 */
const createBranch = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { name, code, address, phone, email } = req.body;

        if (!name || !code) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Name and code are required'
            });
        }

        // Check if code already exists
        const [existing] = await connection.execute(
            'SELECT id FROM branches WHERE code = ?',
            [code]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Branch code already exists'
            });
        }

        const [result] = await connection.execute(
            `INSERT INTO branches (name, code, address, phone, email) 
             VALUES (?, ?, ?, ?, ?) RETURNING id`,
            [name, code, address || null, phone || null, email || null]
        );

        await connection.commit();

        logger.info(`Branch created: ${name} (ID: ${result.insertId})`);

        res.status(201).json({
            success: true,
            message: 'Branch created successfully',
            data: {
                id: result.insertId,
                name,
                code
            }
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Create branch error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Update branch (Admin/Manager only)
 */
const updateBranch = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { name, code, address, phone, email, isActive } = req.body;

        // Check if branch exists
        const [branches] = await connection.execute(
            'SELECT id FROM branches WHERE id = ?',
            [id]
        );

        if (branches.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // If code is being updated, check for duplicates
        if (code) {
            const [existing] = await connection.execute(
                'SELECT id FROM branches WHERE code = ? AND id != ?',
                [code, id]
            );

            if (existing.length > 0) {
                await connection.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Branch code already exists'
                });
            }
        }

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (code) {
            updates.push('code = ?');
            params.push(code);
        }
        if (address !== undefined) {
            updates.push('address = ?');
            params.push(address);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(isActive);
        }

        if (updates.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(id);

        await connection.execute(
            `UPDATE branches SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        await connection.commit();

        logger.info(`Branch updated: ID ${id}`);

        res.json({
            success: true,
            message: 'Branch updated successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Update branch error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Disable branch (Admin only)
 */
const disableBranch = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        const [result] = await connection.execute(
            'UPDATE branches SET is_active = FALSE WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        await connection.commit();

        logger.info(`Branch disabled: ID ${id}`);

        res.json({
            success: true,
            message: 'Branch disabled successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Disable branch error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllBranches,
    getBranchById,
    createBranch,
    updateBranch,
    disableBranch
};
