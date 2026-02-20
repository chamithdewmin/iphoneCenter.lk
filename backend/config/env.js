/**
 * Environment validation - ensures required secrets are set (no fallbacks in production)
 */
function validateEnv() {
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = required.filter((key) => !process.env[key] || process.env[key].trim() === '');
    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}. ` +
            'In Dokploy/Docker set these in the app Environment tab (not in a file). Use long random strings.'
        );
    }
    if (process.env.NODE_ENV === 'production') {
        const weak = [];
        if ((process.env.JWT_SECRET || '').length < 32) weak.push('JWT_SECRET');
        if ((process.env.JWT_REFRESH_SECRET || '').length < 32) weak.push('JWT_REFRESH_SECRET');
        if (weak.length > 0) {
            throw new Error(
                `In production, use strong secrets (32+ characters): ${weak.join(', ')}`
            );
        }
    }
}

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim() === '') {
        throw new Error('JWT_SECRET is not set');
    }
    return secret;
}

function getJwtRefreshSecret() {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret || secret.trim() === '') {
        throw new Error('JWT_REFRESH_SECRET is not set');
    }
    return secret;
}

/** Test/demo login (not in DB). Only active when BOTH TEST_LOGIN_USERNAME and TEST_LOGIN_PASSWORD are set. */
function getTestLoginCredentials() {
    const user = (process.env.TEST_LOGIN_USERNAME ?? '').trim();
    const pass = (process.env.TEST_LOGIN_PASSWORD ?? '').trim();
    if (!user || !pass) return null;
    return { username: user, password: pass };
}

/** Synthetic test user id (not in database). */
const TEST_USER_ID = 0;

module.exports = {
    validateEnv,
    getJwtSecret,
    getJwtRefreshSecret,
    getTestLoginCredentials,
    TEST_USER_ID
};
