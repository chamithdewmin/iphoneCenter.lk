const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Log startup errors to stdout so they appear in Docker/Dokploy logs
process.on('uncaughtException', (err) => {
    console.error('FATAL uncaughtException:', err.message);
    console.error(err.stack);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('FATAL unhandledRejection:', reason);
});

const { validateEnv } = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Validate required env (JWT secrets) before starting
validateEnv();

// Import routes
const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const brandRoutes = require('./routes/brandRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const billingRoutes = require('./routes/billingRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const customerRoutes = require('./routes/customerRoutes');
const userRoutes = require('./routes/userRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const smsRoutes = require('./routes/smsRoutes');

// Initialize Express app
const app = express();

// Security middleware (Helmet - secure headers)
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// CORS - allow frontend origin(s). Use comma-separated list for multiple (e.g. https://cloud.iphonecenter.lk,https://old.example.com)
const corsOriginRaw = process.env.CORS_ORIGIN || '';
const corsOrigins = corsOriginRaw ? corsOriginRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
const corsOriginConfig = corsOrigins.length === 0
    ? true
    : corsOrigins.length === 1
        ? corsOrigins[0]
        : corsOrigins;
app.use(cors({
    origin: corsOriginConfig,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// General API rate limiting (profile checks, dashboard, add user, etc.)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 800,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Login: stricter limit to prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);

// Register (Add User): higher limit so admins can create multiple staff users
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth/register', registerLimiter);

// Stricter rate limit for password reset (OTP brute-force protection)
const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many reset attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth/reset-password', resetPasswordLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Health check handlers (used at both /health and /api/health for proxy compatibility)
const healthHandler = (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
};

const healthDbHandler = async (req, res) => {
    try {
        const { pool } = require('./config/database');
        const result = await pool.query('SELECT 1 AS ok');
        const connected = result.rows && result.rows.length > 0;
        res.status(connected ? 200 : 503).json({
            status: connected ? 'ok' : 'error',
            database: connected ? 'connected' : 'unavailable',
            message: connected ? 'Database connected. Tables ready.' : 'Database unavailable.',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(503).json({
            status: 'error',
            database: 'disconnected',
            message: err.message || 'Database connection failed.',
            timestamp: new Date().toISOString()
        });
    }
};

// Root – so https://backend.iphonecenter.logozodev.com/ returns 200
app.get('/', (req, res) => {
    res.json({ ok: true, service: 'iphone-center-api', timestamp: new Date().toISOString() });
});

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/health/db', healthDbHandler);
app.get('/api/health/db', healthDbHandler);
// Same as /api/health/db – for parity with projects that use GET /api/test-connection
app.get('/api/test-connection', healthDbHandler);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sms', smsRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server – bind to 0.0.0.0 so Docker/proxy can reach the app
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// In production (Docker/Dokploy), wait for PostgreSQL and run init.pg.sql before listening
// so tables exist on first request. Set RUN_INIT_AFTER_LISTEN=1 to keep old behavior (init in background).
const WAIT_FOR_DB = process.env.WAIT_FOR_DB === '1' ||
    process.env.RUN_INIT_BEFORE_LISTEN === '1' ||
    (process.env.NODE_ENV === 'production' && process.env.RUN_INIT_AFTER_LISTEN !== '1');

function start() {
    const listen = () => new Promise((resolve, reject) => {
        const server = app.listen(PORT, HOST, () => {
            const msg = `Server running on http://${HOST}:${PORT}`;
            console.log(msg);
            logger.info(`🚀 ${msg}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            try {
                const { getTestLoginCredentials } = require('./config/env');
                const tc = getTestLoginCredentials();
                const testMsg = tc ? `Test login enabled: "${tc.username}" / "${tc.password}" (no DB)` : 'Test login disabled (set TEST_LOGIN_USERNAME & TEST_LOGIN_PASSWORD to enable)';
                console.log(testMsg);
                logger.info(testMsg);
            } catch (e) {
                console.log('Test login: check JWT env vars');
            }
            if (!WAIT_FOR_DB) {
                const { applySchema } = require('./config/initDatabase');
                console.log('Database: installing on first run in background (creating tables if needed)...');
                applySchema()
                    .then(() => {})
                    .catch((err) => {
                        console.error('Database init failed (will retry on next request or restart):', err.message);
                        logger.error('Database init failed', { message: err.message });
                    });
            }
            resolve(server);
        });
        server.on('error', (err) => {
            console.error('Server listen error:', err.message);
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Set PORT in env to another value.`);
            }
            reject(err);
        });
    });

    if (WAIT_FOR_DB) {
        const { verifyConnection, applySchema } = require('./config/initDatabase');
        console.log('Database: verifying PostgreSQL and running init.pg.sql before starting server...');
        return verifyConnection()
            .then(() => applySchema())
            .then(() => {
                console.log('Database ready. Starting HTTP server.');
                return listen();
            });
    }
    return listen();
}

start().catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

module.exports = app;
