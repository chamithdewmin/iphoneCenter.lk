const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * List all users (Admin only). Excludes password_hash.
 */
const getAllUsers = async (req, res, next) => {
    try {
        const [users] = await executeQuery(
            `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, u.branch_id, u.is_active,
                    u.last_login, u.created_at, u.updated_at,
                    b.name as branch_name, b.code as branch_code
             FROM users u
             LEFT JOIN branches b ON u.branch_id = b.id
             ORDER BY u.id`
        );
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        logger.error('Get all users error:', error);
        next(error);
    }
};

/**
 * Get one user by id (Admin only).
 */
const getUserById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }
        const [users] = await executeQuery(
            `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, u.branch_id, u.is_active,
                    u.last_login, u.created_at, u.updated_at,
                    b.name as branch_name, b.code as branch_code
             FROM users u
             LEFT JOIN branches b ON u.branch_id = b.id
             WHERE u.id = ?`,
            [id]
        );
        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: users[0] });
    } catch (error) {
        logger.error('Get user by id error:', error);
        next(error);
    }
};

/**
 * Update user (Admin only). Password optional.
 */
const updateUser = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }
        const { username, email, fullName, phone, role, branchId, isActive, password } = req.body;

        const [existing] = await executeQuery('SELECT id, username, email FROM users WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updates = [];
        const params = [];

        if (username !== undefined) {
            const [dup] = await executeQuery('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
            if (dup && dup.length > 0) {
                return res.status(409).json({ success: false, message: 'Username already in use' });
            }
            updates.push('username = ?');
            params.push(username);
        }
        if (email !== undefined) {
            const [dup] = await executeQuery('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (dup && dup.length > 0) {
                return res.status(409).json({ success: false, message: 'Email already in use' });
            }
            updates.push('email = ?');
            params.push(email);
        }
        if (fullName !== undefined) {
            updates.push('full_name = ?');
            params.push(fullName);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone === '' ? null : phone);
        }
        if (role !== undefined) {
            updates.push('role = ?');
            params.push(role);
        }
        if (branchId !== undefined) {
            updates.push('branch_id = ?');
            params.push(branchId === null || branchId === '' ? null : branchId);
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(!!isActive);
        }
        if (password !== undefined && String(password).trim().length >= 6) {
            const hash = await bcrypt.hash(String(password), 10);
            updates.push('password_hash = ?');
            params.push(hash);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        await executeQuery(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const [updated] = await executeQuery(
            `SELECT id, username, email, full_name, phone, role, branch_id, is_active, updated_at
             FROM users WHERE id = ?`,
            [id]
        );

        logger.info(`User updated: id=${id}`);
        res.json({ success: true, message: 'User updated', data: updated[0] });
    } catch (error) {
        logger.error('Update user error:', error);
        next(error);
    }
};

/**
 * Delete user (Admin only). Cannot delete self.
 */
const deleteUser = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const currentUserId = req.user?.id;
        if (currentUserId === id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
        }

        const [existing] = await executeQuery('SELECT id, role FROM users WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await executeQuery('DELETE FROM refresh_tokens WHERE user_id = ?', [id]);
        await executeQuery('DELETE FROM users WHERE id = ?', [id]);

        logger.info(`User deleted: id=${id}`);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        logger.error('Delete user error:', error);
        next(error);
    }
};

/**
 * Get user login/logout logs
 */
const getUserLoginLogs = async (req, res, next) => {
    try {
        const userId = req.params.userId ? parseInt(req.params.userId, 10) : null;
        const limit = parseInt(req.query.limit, 10) || 50;
        const offset = parseInt(req.query.offset, 10) || 0;

        let query = `
            SELECT 
                ull.id,
                ull.user_id,
                ull.login_time,
                ull.logout_time,
                ull.ip_address,
                ull.user_agent,
                ull.session_duration_seconds,
                ull.created_at,
                u.username,
                u.full_name,
                u.email,
                u.role
            FROM user_login_logs ull
            INNER JOIN users u ON ull.user_id = u.id
        `;
        const params = [];

        if (userId) {
            query += ' WHERE ull.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY ull.login_time DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [logs] = await executeQuery(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM user_login_logs';
        const countParams = [];
        if (userId) {
            countQuery += ' WHERE user_id = ?';
            countParams.push(userId);
        }
        const [countResult] = await executeQuery(countQuery, countParams);
        const total = countResult[0]?.total || 0;

        res.json({
            success: true,
            data: logs,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });
    } catch (error) {
        logger.error('Get user login logs error:', error);
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserLoginLogs
};
