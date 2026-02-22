const logger = require('../utils/logger');

function jsonError(message, detail = null, extra = {}) {
    return { success: false, message, detail, ...extra };
}

/** Redact sensitive data for production logs */
function safeReqMeta(req) {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        method: req.method,
        url: req.url,
        path: req.path,
        ...(req.user && { userId: req.user.id }),
        ...(!isProd && req.body && typeof req.body === 'object' && {
            bodyKeys: Object.keys(req.body),
            bodySample: Object.fromEntries(
                Object.entries(req.body).slice(0, 5).map(([k, v]) => [
                    k,
                    /password|token|secret|authorization/i.test(k) ? '[REDACTED]' : (typeof v === 'string' && v.length > 100 ? v.slice(0, 100) + '...' : v)
                ])
            )
        })
    };
}

/**
 * Global error handler middleware (must be registered last).
 * Logs full error to stdout and logger so Docker/Dokploy logs show real cause of 500s.
 * In production, does not expose stack/detail to client for generic 500s.
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isProd = process.env.NODE_ENV === 'production';

    // 1. Always log full error to stdout (Docker/Dokploy captures this)
    console.error('[Express Error]', err.message);
    console.error('  code:', err.code);
    console.error('  stack:', err.stack || '(no stack)');
    if (err.detail) console.error('  detail:', err.detail);
    console.error('  request:', req.method, req.url, safeReqMeta(req));

    // 2. Structured log (file + optional console)
    try {
        logger.error('API Error', {
            message: err.message,
            code: err.code,
            stack: err.stack,
            detail: err.detail,
            hint: err.hint,
            ...safeReqMeta(req)
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
    // PostgreSQL: authentication failed (wrong password / invalid user)
    if (err.code === '28P01') {
        return res.status(503).json(jsonError(
            'Database authentication failed. Check DB_USER and DB_PASSWORD (or DATABASE_URL) in backend environment.',
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

    // Default: 500 – always return real message so frontend/Network tab shows the cause (no blind 500s).
    const payload = {
        success: false,
        message: err.message || 'Internal server error',
        code: err.code || null,
        detail: err.detail || null
    };
    if (!isProd && statusCode === 500 && err.stack) payload.stack = err.stack;
    res.status(statusCode).json(payload);
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
