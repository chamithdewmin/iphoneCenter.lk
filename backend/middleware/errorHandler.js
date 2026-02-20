const logger = require('../utils/logger');

function jsonError(message, detail = null, extra = {}) {
    return { success: false, message, detail, ...extra };
}

/**
 * Global error handler middleware
 * Returns JSON: { message, detail: error.detail || null }
 */
const errorHandler = (err, req, res, next) => {
    // Always log to console in production so Dokploy/container logs show the real error
    if (process.env.NODE_ENV === 'production') {
        console.error('API Error:', err.code || '', err.message, req.method, req.url);
        if (err.stack) console.error(err.stack);
    }
    try {
        logger.error('Error:', {
            message: err.message,
            code: err.code,
            stack: err.stack,
            url: req.url,
            method: req.method,
            userId: req.user?.id
        });
    } catch (logErr) {
        console.error('Logger failed:', logErr.message);
    }

    // PostgreSQL: relation/table does not exist (tables not created)
    if (err.code === '42P01') {
        return res.status(503).json(jsonError(
            'Database tables missing. The backend auto-creates them on startup. Set DATABASE_URL in the backend app, redeploy, and check backend container logs for "Database init" or errors. If it still fails, run backend/database/init.pg.sql manually (see RUN_SCHEMA.md).',
            err.detail || null
        ));
    }
    // PostgreSQL: undefined column (schema out of date)
    if (err.code === '42703') {
        return res.status(503).json(jsonError(
            'Database schema out of date. Run backend/database/init.pg.sql on your PostgreSQL database and restart the backend.',
            err.detail || null
        ));
    }
    // PostgreSQL: permission denied (e.g. no SELECT on branches)
    if (err.code === '42501') {
        return res.status(503).json(jsonError(
            'Database permission denied. Grant SELECT on table branches to your database user, e.g. GRANT SELECT ON branches TO your_db_user;',
            err.detail || null
        ));
    }
    // PostgreSQL: connection/auth errors (e.g. DB unreachable)
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
        return res.status(503).json(jsonError(
            'Database unavailable. Check DATABASE_URL and that PostgreSQL is running.',
            err.detail || null
        ));
    }

    // MySQL errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json(jsonError('Duplicate entry. This record already exists.', null));
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json(jsonError('Referenced record does not exist.', err.detail || null));
    }
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json(jsonError('Cannot delete. This record is referenced by other records.', err.detail || null));
    }

    // PostgreSQL: NOT NULL violation
    if (err.code === '23502') {
        const msg = err.column
            ? `Required field missing: ${err.column}. ${err.message || 'Check your input.'}`
            : (err.message || 'Required field missing. Check your input.');
        return res.status(400).json(jsonError(msg, err.detail || null));
    }
    // PostgreSQL: unique violation (e.g. SKU)
    if (err.code === '23505') {
        const message = (err.constraint && String(err.constraint).toLowerCase().includes('sku')) || (err.detail && String(err.detail).toLowerCase().includes('sku'))
            ? 'SKU already exists'
            : 'Duplicate entry. This record already exists.';
        return res.status(409).json(jsonError(message, err.detail || null));
    }
    // PostgreSQL: foreign key violation
    if (err.code === '23503') {
        return res.status(400).json(jsonError(
            err.message || 'Referenced record does not exist or record is in use.',
            err.detail || null
        ));
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json(jsonError(err.message, err.detail || null));
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json(jsonError('Invalid token', null));
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json(jsonError('Token expired', null));
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
    const hint = process.env.NODE_ENV === 'production' && statusCode === 500
        ? ' Check backend server logs (e.g. Dokploy container logs) for details.'
        : '';

    res.status(statusCode).json({
        ...jsonError(message + hint, err.detail || null),
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};
