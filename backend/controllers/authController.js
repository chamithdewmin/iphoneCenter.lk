const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { executeQuery, getConnection } = require('../config/database');
const { JWT_EXPIRY } = require('../config/constants');
const { getJwtSecret, getJwtRefreshSecret, getTestLoginCredentials, TEST_USER_ID } = require('../config/env');
const logger = require('../utils/logger');
const smsService = require('../utils/smsService');
const sendSMS = smsService?.sendSMS;
if (!sendSMS) {
    logger.error('sendSMS function not found in smsService module. Available:', Object.keys(smsService || {}));
}

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
    logger.info('Password reset OTP request received', { 
        phone: req.body?.phone,
        hasBody: !!req.body,
        method: req.method,
        path: req.path
    });
    
    try {
        const { phone } = req.body;

        if (!phone) {
            logger.warn('Password reset request missing phone number');
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Normalize phone number (remove spaces, dashes, etc.)
        const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '').trim();
        
        if (!normalizedPhone || normalizedPhone.length < 9) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        logger.info(`Looking up user by phone: ${normalizedPhone}`);

        // Find user by phone number
        let users;
        try {
            // Query by phone number - check if account is active and has a role
            logger.debug('Executing user lookup query by phone number');
            [users] = await executeQuery(
                'SELECT id, username, email, full_name, phone, role, is_active FROM users WHERE phone = ? AND is_active = TRUE',
                [normalizedPhone]
            );
            logger.debug(`Query returned ${users?.length || 0} users`);
        } catch (dbError) {
            logger.error('Database error in requestPasswordResetOTP:', {
                message: dbError?.message || 'Unknown database error',
                code: dbError?.code,
                sqlState: dbError?.sqlState,
                stack: dbError?.stack
            });
            
            // Check if it's a column not found error (PostgreSQL: 42703, MySQL: 42S22)
            const isColumnError = dbError?.code === '42703' || 
                                 dbError?.code === '42S22' ||
                                 (dbError?.message && (
                                     dbError.message.toLowerCase().includes('phone') || 
                                     dbError.message.toLowerCase().includes('column') ||
                                     dbError.message.toLowerCase().includes('does not exist')
                                 ));
            
            } else {
                logger.error('Unexpected database error:', dbError);
                return res.status(500).json({
                    success: false,
                    message: 'Database error. Please try again later.'
                });
            }
        }

        // Ensure users is an array
        if (!Array.isArray(users)) {
            logger.warn('Users query did not return an array:', typeof users);
            users = [];
        }

        if (!users || users.length === 0) {
            // Don't reveal if user exists for security
            logger.warn(`No active user found with phone number: ${normalizedPhone}`);
            return res.json({
                success: true,
                message: 'If the account exists, an OTP has been sent to the registered phone number'
            });
        }

        const user = users[0];

        // Verify account is active
        if (!user.is_active) {
            logger.warn(`User ${user.username} (ID: ${user.id}) account is not active`);
            return res.status(403).json({
                success: false,
                message: 'Account is not active. Please contact administrator.'
            });
        }

        // Verify user has a role
        if (!user.role) {
            logger.warn(`User ${user.username} (ID: ${user.id}) has no role assigned`);
            return res.status(403).json({
                success: false,
                message: 'Account role not assigned. Please contact administrator.'
            });
        }

        // Use the normalized phone number from request (not from DB, as DB might have different format)
        const userPhone = normalizedPhone;

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP with phone number as key (normalized) and include user info
        otpStore.set(normalizedPhone, {
            otp,
            expiresAt,
            userId: user.id,
            username: user.username,
            phone: normalizedPhone
        });

        // Send OTP via SMS
        // For testing: if SMS_TEST_MODE is enabled, skip actual SMS sending
        const smsTestMode = process.env.SMS_TEST_MODE === 'true';
        
        if (smsTestMode) {
            logger.warn(`SMS_TEST_MODE enabled - OTP ${otp} generated for ${user.username} but SMS not sent`);
            return res.json({
                success: true,
                message: `OTP generated (TEST MODE): ${otp}. SMS not sent in test mode.`
            });
        }

        // Check if SMS service is available
        if (!sendSMS || typeof sendSMS !== 'function') {
            logger.error('SMS service not available');
            return res.status(500).json({
                success: false,
                message: 'SMS service is not configured. Please contact administrator.'
            });
        }

        let smsResult;
        try {
            const message = `Your password reset OTP for iphone center.lk is: ${otp}. Valid for 10 minutes.`;
            logger.info(`Attempting to send SMS to ${userPhone} for user ${user.username}`);
            smsResult = await sendSMS(userPhone, message);
            logger.info(`SMS send result:`, { success: smsResult?.success, error: smsResult?.error });

            // Check if SMS was sent successfully
            if (!smsResult) {
                logger.error(`SMS service returned null/undefined for ${userPhone}`);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send OTP SMS. Please contact administrator.'
                });
            }

            if (smsResult.success !== true) {
                const errorMsg = smsResult.error || 'Unknown SMS error';
                logger.error(`Failed to send OTP SMS to ${userPhone}:`, errorMsg);
                // OTP is stored, but SMS failed - return error so user knows
                return res.status(500).json({
                    success: false,
                    message: `Failed to send OTP SMS: ${errorMsg}. Please check your phone number or contact administrator.`
                });
            }

            logger.info(`Password reset OTP sent successfully to user ${user.username} (${userPhone})`);

            return res.json({
                success: true,
                message: 'OTP has been sent to your registered phone number'
            });
        } catch (smsError) {
            logger.error('SMS sending exception:', {
                message: smsError?.message || 'Unknown error',
                stack: smsError?.stack,
                phone: userPhone,
                errorName: smsError?.name,
                errorCode: smsError?.code,
                fullError: smsError
            });
            // OTP is still stored, but SMS failed
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP. Please contact administrator or verify your phone number is correct.'
            });
        }
    } catch (error) {
        logger.error('Request password reset OTP error (outer catch):', {
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            code: error?.code,
            name: error?.name,
            type: typeof error
        });
        
        // Make sure we return a response, don't let it fall through to next()
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: 'An error occurred while processing your request. Please try again later or contact administrator.'
            });
        }
        // If headers already sent, call next() to let error handler deal with it
        next(error);
    }
};

/**
 * Verify OTP and reset password
 */
const resetPasswordWithOTP = async (req, res, next) => {
    try {
        const { phone, otp, newPassword, confirmPassword } = req.body;

        if (!phone || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Phone number, OTP, and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        if (confirmPassword && newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Normalize phone number (same as request)
        const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '').trim();

        // Get stored OTP by phone number
        const storedOTP = otpStore.get(normalizedPhone);

        // Verify OTP exists
        if (!storedOTP) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found or expired. Please request a new OTP.'
            });
        }

        // Verify OTP not expired
        if (storedOTP.expiresAt < Date.now()) {
            otpStore.delete(normalizedPhone);
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        // Verify OTP matches
        if (storedOTP.otp !== otp.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Verify user still exists and is active
        const [users] = await executeQuery(
            'SELECT id, username, is_active FROM users WHERE id = ? AND is_active = TRUE',
            [storedOTP.userId]
        );

        if (users.length === 0) {
            otpStore.delete(normalizedPhone);
            return res.status(404).json({
                success: false,
                message: 'User account not found or inactive'
            });
        }

        const user = users[0];

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await executeQuery(
            'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
            [passwordHash, user.id]
        );

        // Remove OTP from store
        otpStore.delete(normalizedPhone);

        logger.info(`Password reset successful for user ${user.username} (phone: ${normalizedPhone})`);

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        logger.error('Reset password error:', {
            message: error?.message,
            stack: error?.stack,
            code: error?.code
        });
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
