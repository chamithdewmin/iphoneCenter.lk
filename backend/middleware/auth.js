const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { getJwtSecret, getJwtRefreshSecret, getTestLoginCredentials, TEST_USER_ID } = require('../config/env');
const logger = require('../utils/logger');

function getTestUserForAuth() {
    const creds = getTestLoginCredentials();
    return {
        id: TEST_USER_ID,
        username: creds ? creds.username : 'test',
        email: 'test@demo.local',
        role: 'admin',
        branch_id: null,
        is_active: true
    };
}

/**
 * Verify JWT access token
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, getJwtSecret());

            if (decoded.userId === TEST_USER_ID) {
                req.user = getTestUserForAuth();
                return next();
            }

            // Verify user still exists and is active
            const [users] = await executeQuery(
                'SELECT id, username, email, role, branch_id, is_active FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (!users || users.length === 0 || !users[0].is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or inactive'
                });
            }

            req.user = users[0];
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
            }
            throw error;
        }
    } catch (error) {
        logger.error('Authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(refreshToken, getJwtRefreshSecret());

        if (decoded.userId === TEST_USER_ID) {
            req.refreshTokenData = { user_id: TEST_USER_ID };
            req.userId = TEST_USER_ID;
            return next();
        }

        // Check if token exists in database and is not revoked
        const [tokens] = await executeQuery(
            'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND is_revoked = FALSE AND expires_at > NOW()',
            [refreshToken, decoded.userId]
        );

        if (!tokens || tokens.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        req.refreshTokenData = tokens[0];
        req.userId = decoded.userId;
        next();
    } catch (error) {
        logger.error('Refresh token verification error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
};

module.exports = {
    authenticate,
    verifyRefreshToken
};
