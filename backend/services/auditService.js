/**
 * Audit logging service. Writes to audit_logs for enterprise traceability.
 * Use for: login (success/fail), user create/update/delete, settings reset, sale create/refund, etc.
 */
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Log an audit event. All params optional except action.
 * @param {Object} opts
 * @param {string} opts.action - e.g. 'login_success', 'login_failure', 'user_create', 'user_update', 'user_delete', 'settings_reset', 'sale_create', 'sale_refund'
 * @param {number|null} opts.userId - acting user id (null for login failure before user is known)
 * @param {number|null} opts.branchId - branch context if applicable
 * @param {string|null} opts.entityType - e.g. 'user', 'sale', 'branch'
 * @param {number|null} opts.entityId - id of affected entity
 * @param {Object|null} opts.oldValues - snapshot before change (for updates/deletes)
 * @param {Object|null} opts.newValues - snapshot after change (for creates/updates)
 * @param {string|null} opts.ipAddress - req.ip or x-forwarded-for
 * @param {string|null} opts.userAgent - req.get('user-agent')
 */
async function logAudit(opts) {
    const {
        action,
        userId = null,
        branchId = null,
        entityType = null,
        entityId = null,
        oldValues = null,
        newValues = null,
        ipAddress = null,
        userAgent = null,
    } = opts || {};

    if (!action || typeof action !== 'string') {
        logger.warn('Audit log skipped: action is required');
        return;
    }

    try {
        const oldJson = oldValues != null ? JSON.stringify(oldValues) : null;
        const newJson = newValues != null ? JSON.stringify(newValues) : null;
        const ip = ipAddress && String(ipAddress).length <= 45 ? String(ipAddress).trim() : null;
        const ua = userAgent ? String(userAgent).substring(0, 500) : null;

        await executeQuery(
            `INSERT INTO audit_logs (user_id, branch_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, CAST(? AS jsonb), CAST(? AS jsonb), ?, ?)`,
            [userId, branchId, action.substring(0, 50), entityType ? entityType.substring(0, 50) : null, entityId, oldJson || null, newJson || null, ip, ua]
        );
    } catch (err) {
        logger.error('Audit log write failed:', err.message);
        // Do not throw - audit failure must not break the main flow
    }
}

/**
 * Helper to get IP and User-Agent from Express req
 */
function getRequestMeta(req) {
    return {
        ipAddress: req.ip || req.connection?.remoteAddress || (req.headers && req.headers['x-forwarded-for']) || null,
        userAgent: req.headers && req.headers['user-agent'] ? req.headers['user-agent'] : null,
    };
}

module.exports = {
    logAudit,
    getRequestMeta,
};
