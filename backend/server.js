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
const inventoryRoutes = require('./routes/inventoryRoutes');
const billingRoutes = require('./routes/billingRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const customerRoutes = require('./routes/customerRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize Express app
const app = express();

// Security middleware (Helmet - secure headers)
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// CORS configuration - set CORS_ORIGIN in production (e.g. https://your-frontend.com)
app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// General API rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limit for auth (login/register) to prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many auth attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(503).json({
            status: 'error',
            database: 'disconnected',
            message: err.message,
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
app.use('/api/inventory', inventoryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server – bind to 0.0.0.0 so Docker/proxy can reach the app
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

async function start() {
    const { initDatabase } = require('./config/initDatabase');
    await initDatabase();
    return new Promise((resolve, reject) => {
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
