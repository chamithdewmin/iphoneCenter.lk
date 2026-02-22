const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get audit logs (Admin only). Supports filters: userId, branchId, action, entityType, dateFrom, dateTo, limit.
 */
const getAuditLogs = async (req, res, next) => {
    try {
        const { userId, branchId, action, entityType, dateFrom, dateTo, limit = 100 } = req.query;
        const params = [];
        let query = `
            SELECT a.id, a.user_id, a.branch_id, a.action, a.entity_type, a.entity_id,
                   a.old_values, a.new_values, a.ip_address, a.user_agent, a.created_at,
                   u.username
            FROM audit_logs a
            LEFT JOIN users u ON u.id = a.user_id
            WHERE 1=1
        `;
        if (userId) {
            query += ' AND a.user_id = ?';
            params.push(userId);
        }
        if (branchId) {
            query += ' AND a.branch_id = ?';
            params.push(branchId);
        }
        if (action) {
            query += ' AND a.action = ?';
            params.push(action);
        }
        if (entityType) {
            query += ' AND a.entity_type = ?';
            params.push(entityType);
        }
        if (dateFrom) {
            query += ' AND a.created_at >= ?';
            params.push(dateFrom + 'T00:00:00');
        }
        if (dateTo) {
            query += ' AND a.created_at <= ?';
            params.push(dateTo + 'T23:59:59');
        }
        query += ' ORDER BY a.created_at DESC LIMIT ?';
        params.push(Math.min(parseInt(limit, 10) || 100, 500));

        const [rows] = await executeQuery(query, params);

        res.json({
            success: true,
            data: rows || [],
        });
    } catch (error) {
        logger.error('Get audit logs error:', error);
        next(error);
    }
};

/**
 * Get distinct action types for filter dropdown
 */
const getAuditActions = async (req, res, next) => {
    try {
        const [rows] = await executeQuery(
            'SELECT DISTINCT action FROM audit_logs ORDER BY action'
        );
        res.json({
            success: true,
            data: (rows || []).map((r) => r.action),
        });
    } catch (error) {
        logger.error('Get audit actions error:', error);
        next(error);
    }
};

module.exports = {
    getAuditLogs,
    getAuditActions,
};
