const logger = require('../utils/logger');

/**
 * Global error handler middleware
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
        return res.status(503).json({
            success: false,
            message: 'Database tables missing. The backend auto-creates them on startup. Set DATABASE_URL in the backend app, redeploy, and check backend container logs for "Database init" or errors. If it still fails, run backend/database/init.pg.sql manually (see RUN_SCHEMA.md).'
        });
    }
    // PostgreSQL: connection/auth errors (e.g. DB unreachable)
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
        return res.status(503).json({
            success: false,
            message: 'Database unavailable. Check DATABASE_URL and that PostgreSQL is running.'
        });
    }

    // MySQL errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry. This record already exists.'
        });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'Referenced record does not exist.'
        });
    }
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete. This record is referenced by other records.'
        });
    }

    // PostgreSQL errors
    if (err.code === '23505') {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry. This record already exists.'
        });
    }
    if (err.code === '23503') {
        return res.status(400).json({
            success: false,
            message: err.message || 'Referenced record does not exist or record is in use.'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
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
        success: false,
        message: message + hint,
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
