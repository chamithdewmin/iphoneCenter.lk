const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { executeQuery, getConnection } = require('../config/database');
const { JWT_EXPIRY } = require('../config/constants');
const { getJwtSecret, getJwtRefreshSecret, getTestLoginCredentials, TEST_USER_ID } = require('../config/env');
const logger = require('../utils/logger');
const { sendSMS } = require('../utils/smsService');

/** Synthetic test user (not in database) for demo login */
function getTestUser() {
    const creds = getTestLoginCredentials();
    return {
        id: TEST_USER_ID,
        username: creds ? creds.username : 'test',
        email: 'test@demo.local',
        full_name: 'Test User (Demo)',
        role: 'admin',
        branch_id: null,
        branch_name: null,
        branch_code: null
    };
}

/**
 * Register a new user (Admin only)
 */
const register = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { username, email, password, fullName, role, branchId, phone } = req.body;

        // Validate required fields
        if (!username || !email || !password || !fullName || !role) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Manager and staff must have a branch (warehouse); admin can have null
        const roleNeedsBranch = role === 'manager' || role === 'cashier' || role === 'staff';
        if (roleNeedsBranch) {
            if (!branchId) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Warehouse (branch) is required for Manager and Staff. Add a warehouse first in Warehouses.'
                });
            }
            const [branchRows] = await connection.execute(
                'SELECT id FROM branches WHERE id = ? AND is_active = TRUE',
                [branchId]
            );
            if (!branchRows || branchRows.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Selected warehouse not found or inactive. Choose a registered warehouse.'
                });
            }
        }

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Validate role is valid enum value
        const validRoles = ['admin', 'manager', 'cashier', 'staff'];
        if (!validRoles.includes(role)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            });
        }

        // Insert user
        const [result] = await connection.execute(
            `INSERT INTO users (username, email, password_hash, full_name, phone, role, branch_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [username, email, passwordHash, fullName, phone || null, role, branchId || null]
        );

        await connection.commit();

        logger.info(`User registered: ${username} (ID: ${result.insertId})`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userId: result.insertId,
                username,
                email,
                role
            }
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Registration error:', error);
        
        // Check if it's an enum value error
        if (error.message && error.message.includes('invalid input value for enum')) {
            return res.status(400).json({
                success: false,
                message: `Invalid role "${role}". The 'staff' role may not be available in your database. Please run the migration to add it, or use 'cashier' instead.`
            });
        }
        
        // Check for other common errors
        if (error.code === '23505') { // PostgreSQL unique constraint violation
            return res.status(409).json({
                success: false,
                message: 'Username or email already exists'
            });
        }
        
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Test/demo login: no database – configured test credentials or hardcoded test/test
        const un = String(username || '').trim();
        const pw = String(password || '');
        const testCreds = getTestLoginCredentials();
        const isTestLogin = (testCreds && un === testCreds.username && pw === testCreds.password) ||
            (un === 'test' && pw === 'test');
        if (isTestLogin) {
            try {
                const user = getTestUser();
                const accessExpiry = (JWT_EXPIRY && JWT_EXPIRY.ACCESS_TOKEN) || '15m';
                const refreshExpiry = (JWT_EXPIRY && JWT_EXPIRY.REFRESH_TOKEN) || '7d';
                const accessToken = jwt.sign(
                    { userId: user.id, role: user.role },
                    getJwtSecret(),
                    { expiresIn: accessExpiry }
                );
                const refreshToken = jwt.sign(
                    { userId: user.id },
                    getJwtRefreshSecret(),
                    { expiresIn: refreshExpiry }
                );
                logger.info(`Test user logged in: ${user.username} (no DB)`);
                return res.json({
                    success: true,
                    message: 'Login successful',
                    data: {
                        accessToken,
                        refreshToken,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            fullName: user.full_name,
                            role: user.role,
                            branchId: user.branch_id,
                            branchName: user.branch_name,
                            branchCode: user.branch_code
                        }
                    }
                });
            } catch (err) {
                logger.error('Test login error:', err.message, err.stack);
                console.error('Test login error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Test login failed. Ensure JWT_SECRET and JWT_REFRESH_SECRET are set in backend environment.'
                });
            }
        }

        // Find user in database
        const [users] = await executeQuery(
            `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.role, 
                    u.branch_id, u.is_active, b.name as branch_name, b.code as branch_code
             FROM users u
             LEFT JOIN branches b ON u.branch_id = b.id
             WHERE (u.username = ? OR u.email = ?) AND u.is_active = TRUE`,
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { userId: user.id, role: user.role },
            getJwtSecret(),
            { expiresIn: JWT_EXPIRY.ACCESS_TOKEN }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            getJwtRefreshSecret(),
            { expiresIn: JWT_EXPIRY.REFRESH_TOKEN }
        );

        // Store refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await executeQuery(
            `INSERT INTO refresh_tokens (user_id, token, expires_at) 
             VALUES (?, ?, ?)`,
            [user.id, refreshToken, expiresAt]
        );

        // Update last login
        await executeQuery(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        logger.info(`User logged in: ${user.username} (ID: ${user.id})`);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    branchId: user.branch_id,
                    branchName: user.branch_name,
                    branchCode: user.branch_code
                }
            }
        });
    } catch (error) {
        logger.error('Login error:', { message: error.message, stack: error.stack, code: error.code });
        console.error('Login error (check Dokploy backend logs):', error.message, error.stack || '');
        next(error);
    }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
    try {
        const { refreshTokenData, userId } = req;

        // Test user: no DB lookup
        if (userId === TEST_USER_ID) {
            const user = getTestUser();
            const accessToken = jwt.sign(
                { userId: user.id, role: user.role },
                getJwtSecret(),
                { expiresIn: JWT_EXPIRY.ACCESS_TOKEN }
            );
            return res.json({
                success: true,
                data: { accessToken }
            });
        }

        // Generate new access token from database user
        const [users] = await executeQuery(
            'SELECT id, role FROM users WHERE id = ? AND is_active = TRUE',
            [userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        const user = users[0];

        const accessToken = jwt.sign(
            { userId: user.id, role: user.role },
            getJwtSecret(),
            { expiresIn: JWT_EXPIRY.ACCESS_TOKEN }
        );

        res.json({
            success: true,
            data: {
                accessToken
            }
        });
    } catch (error) {
        logger.error('Refresh token error:', error);
        next(error);
    }
};

/**
 * Logout user (revoke refresh token)
 */
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await executeQuery(
                'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = ?',
                [refreshToken]
            );
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        logger.error('Logout error:', error);
        next(error);
    }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
    try {
        // Test user: return synthetic profile (not from database)
        if (req.user.id === TEST_USER_ID) {
            const user = getTestUser();
            return res.json({
                success: true,
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    branch_id: user.branch_id,
                    branch_name: user.branch_name,
                    branch_code: user.branch_code,
                    last_login: null,
                    created_at: null
                }
            });
        }

        const [users] = await executeQuery(
            `SELECT u.id, u.username, u.email, u.full_name, u.role, u.branch_id, 
                    u.last_login, u.created_at,
                    b.name as branch_name, b.code as branch_code
             FROM users u
             LEFT JOIN branches b ON u.branch_id = b.id
             WHERE u.id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];
        delete user.password_hash;

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        next(error);
    }
};

// In-memory OTP store (in production, use Redis or database)
const otpStore = new Map();

/**
 * Request OTP for password reset
 */
const requestPasswordResetOTP = async (req, res, next) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username or email is required'
            });
        }

        // Find user by username or email
        const [users] = await executeQuery(
            'SELECT id, username, email, full_name, phone FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE',
            [username.trim(), username.trim()]
        );

        if (users.length === 0) {
            // Don't reveal if user exists for security
            return res.json({
                success: true,
                message: 'If the account exists, an OTP has been sent to the registered phone number'
            });
        }

        const user = users[0];

        // Check if user has phone number
        if (!user.phone) {
            return res.status(400).json({
                success: false,
                message: 'No phone number registered for this account. Please contact administrator.'
            });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP
        otpStore.set(user.id.toString(), {
            otp,
            expiresAt,
            username: user.username
        });

        // Send OTP via SMS
        const message = `Your password reset OTP for iphone center.lk is: ${otp}. Valid for 10 minutes.`;
        const smsResult = await sendSMS(user.phone, message);

        if (!smsResult.success) {
            logger.error(`Failed to send OTP SMS to ${user.phone}:`, smsResult.error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP. Please try again later.'
            });
        }

        logger.info(`Password reset OTP sent to user ${user.username} (${user.phone})`);

        res.json({
            success: true,
            message: 'OTP has been sent to your registered phone number'
        });
    } catch (error) {
        logger.error('Request password reset OTP error:', error);
        next(error);
    }
};

/**
 * Verify OTP and reset password
 */
const resetPasswordWithOTP = async (req, res, next) => {
    try {
        const { username, otp, newPassword } = req.body;

        if (!username || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Username, OTP, and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Find user
        const [users] = await executeQuery(
            'SELECT id, username FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE',
            [username.trim(), username.trim()]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];
        const storedOTP = otpStore.get(user.id.toString());

        // Verify OTP
        if (!storedOTP) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found or expired. Please request a new OTP.'
            });
        }

        if (storedOTP.expiresAt < Date.now()) {
            otpStore.delete(user.id.toString());
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        if (storedOTP.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await executeQuery(
            'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
            [passwordHash, user.id]
        );

        // Remove OTP from store
        otpStore.delete(user.id.toString());

        logger.info(`Password reset successful for user ${user.username}`);

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        logger.error('Reset password error:', error);
        next(error);
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getProfile,
    requestPasswordResetOTP,
    resetPasswordWithOTP
};
