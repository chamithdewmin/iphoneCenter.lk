const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * List all users (Admin only). Excludes password_hash.
 */
const getAllUsers = async (req, res, next) => {
    try {
        const [users] = await executeQuery(
            `SELECT u.id, u.username, u.email, u.full_name, u.role, u.branch_id, u.is_active,
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

module.exports = {
    getAllUsers
};
