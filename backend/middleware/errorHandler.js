const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        userId: req.user?.id
    });

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

    res.status(statusCode).json({
        success: false,
        message: message,
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
