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
 * IMPORTANT: This route does NOT use express-validator middleware
 * All validation is done directly in this controller to avoid field name issues
 */
const requestPasswordResetOTP = async (req, res, next) => {
    // Log immediately to confirm this function is being called (not express-validator)
    console.log('=== requestPasswordResetOTP FUNCTION CALLED ===');
    console.log('This confirms express-validator is NOT being used');
    console.log('Route: /forgot-password, Method:', req.method);
    console.log('Raw body:', JSON.stringify(req.body, null, 2));
    
    logger.info('Password reset OTP request received', { 
        email: req.body?.email,
        phone: req.body?.phone,
        bodyKeys: Object.keys(req.body || {}),
        hasBody: !!req.body,
        bodyType: typeof req.body,
        bodyString: JSON.stringify(req.body),
        method: req.method,
        path: req.path,
        contentType: req.headers['content-type']
    });
    
    // Log raw request for debugging
    console.log('=== FORGOT PASSWORD REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Email:', req.body?.email, 'Type:', typeof req.body?.email);
    console.log('Phone:', req.body?.phone, 'Type:', typeof req.body?.phone);
    console.log('===============================');
    
    try {
        // Get values from request body
        const email = req.body?.email;
        const phone = req.body?.phone;

        // Validate email/username field - check for existence and non-empty
        if (email === undefined || email === null || email === '') {
            console.log('Validation failed: email is missing or empty');
            return res.status(400).json({
                success: false,
                message: 'Email or username is required',
                errors: [{ field: 'email', message: 'Email or username is required' }]
            });
        }

        // Check if email is a non-empty string after trimming
        const emailStr = String(email).trim();
        if (emailStr.length === 0) {
            console.log('Validation failed: email is empty after trim');
            return res.status(400).json({
                success: false,
                message: 'Email or username cannot be empty',
                errors: [{ field: 'email', message: 'Email or username cannot be empty' }]
            });
        }

        // Validate phone field - check for existence and non-empty
        if (phone === undefined || phone === null || phone === '') {
            console.log('Validation failed: phone is missing or empty');
            return res.status(400).json({
                success: false,
                message: 'Phone number is required',
                errors: [{ field: 'phone', message: 'Phone number is required' }]
            });
        }

        // Check if phone is a non-empty string after trimming
        const phoneStr = String(phone).trim();
        if (phoneStr.length === 0) {
            console.log('Validation failed: phone is empty after trim');
            return res.status(400).json({
                success: false,
                message: 'Phone number cannot be empty',
                errors: [{ field: 'phone', message: 'Phone number cannot be empty' }]
            });
        }

        // Normalize email (trim and lowercase) - allow username or email
        const normalizedEmail = emailStr.toLowerCase();
        
        // Normalize phone number (remove spaces, dashes, etc.)
        const normalizedPhone = phoneStr.replace(/[\s\-\(\)]/g, '');
        
        console.log('Normalized values:', { normalizedEmail, normalizedPhone });
        
        // Validate email/username length
        if (normalizedEmail.length < 3) {
            console.log('Validation failed: email too short');
            return res.status(400).json({
                success: false,
                message: 'Email or username must be at least 3 characters',
                errors: [{ field: 'email', message: 'Email or username must be at least 3 characters' }]
            });
        }
        
        // Validate phone number format
        if (normalizedPhone.length < 9) {
            console.log('Validation failed: phone too short');
            return res.status(400).json({
                success: false,
                message: 'Phone number must be at least 9 digits',
                errors: [{ field: 'phone', message: 'Phone number must be at least 9 digits' }]
            });
        }

        if (!/^\d+$/.test(normalizedPhone)) {
            console.log('Validation failed: phone contains non-digits');
            return res.status(400).json({
                success: false,
                message: 'Phone number must contain only digits',
                errors: [{ field: 'phone', message: 'Phone number must contain only digits' }]
            });
        }

        console.log('Validation passed, proceeding to database lookup...');
        logger.info(`Looking up user by email: ${normalizedEmail} and phone: ${normalizedPhone}`);

        // Find user by BOTH email and phone number - must match the same user
        let users;
        try {
            // Query by both email and phone - check if account is active and has a role
            logger.debug('Executing user lookup query by email and phone number');
            [users] = await executeQuery(
                'SELECT id, username, email, full_name, phone, role, is_active FROM users WHERE (email = ? OR username = ?) AND phone = ? AND is_active = TRUE',
                [normalizedEmail, normalizedEmail, normalizedPhone]
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
            logger.warn(`No active user found matching email: ${normalizedEmail} and phone: ${normalizedPhone}`);
            return res.status(400).json({
                success: false,
                message: 'No account found with the provided email and phone number combination. Please verify both details are correct.'
            });
        }

        const user = users[0];

        // Verify email matches (case-insensitive)
        const userEmail = (user.email || '').trim().toLowerCase();
        if (userEmail !== normalizedEmail && user.username !== normalizedEmail) {
            logger.warn(`Email mismatch for user ${user.username} (ID: ${user.id}). Provided: ${normalizedEmail}, DB: ${userEmail}`);
            return res.status(400).json({
                success: false,
                message: 'Email and phone number do not match. Please verify both details are correct.'
            });
        }

        // Verify phone matches (normalize DB phone for comparison)
        const dbPhone = (user.phone || '').replace(/[\s\-\(\)]/g, '').trim();
        if (dbPhone !== normalizedPhone) {
            logger.warn(`Phone mismatch for user ${user.username} (ID: ${user.id}). Provided: ${normalizedPhone}, DB: ${dbPhone}`);
            return res.status(400).json({
                success: false,
                message: 'Email and phone number do not match. Please verify both details are correct.'
            });
        }

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

        console.log(`User verified: ${user.username} (${user.email}) - Phone: ${normalizedPhone}`);
        console.log('Account is active and has role:', user.role);

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

        // Format phone for SMS (add country code if needed)
        let smsPhone = normalizedPhone;
        // If phone starts with 0, replace with 94 (Sri Lanka country code)
        if (smsPhone.startsWith('0')) {
            smsPhone = '94' + smsPhone.substring(1);
        }
        // If phone doesn't start with country code, add 94
        else if (!smsPhone.startsWith('94')) {
            smsPhone = '94' + smsPhone;
        }

        console.log(`Sending OTP via SMS to: ${smsPhone} for user: ${user.username}`);
        
        let smsResult;
        try {
            const message = `Your password reset OTP for iphone center.lk is: ${otp}. Valid for 10 minutes.`;
            logger.info(`Attempting to send SMS to ${smsPhone} for user ${user.username}`);
            smsResult = await sendSMS(smsPhone, message);
            logger.info(`SMS send result:`, { success: smsResult?.success, error: smsResult?.error });

            // Check if SMS was sent successfully
            if (!smsResult) {
                logger.error(`SMS service returned null/undefined for ${smsPhone}`);
                console.error(`SMS service returned null/undefined for ${smsPhone}`);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send OTP SMS. Please contact administrator.'
                });
            }

            if (smsResult.success !== true) {
                const errorMsg = smsResult.error || 'Unknown SMS error';
                logger.error(`Failed to send OTP SMS to ${smsPhone}:`, errorMsg);
                console.error(`Failed to send OTP SMS to ${smsPhone}:`, errorMsg);
                // OTP is stored, but SMS failed - return error so user knows
                return res.status(500).json({
                    success: false,
                    message: `Failed to send OTP SMS: ${errorMsg}. Please check your phone number or contact administrator.`
                });
            }

            logger.info(`Password reset OTP sent successfully to user ${user.username} (${smsPhone})`);
            console.log(`✅ OTP sent successfully to ${smsPhone} for user ${user.username}`);

            return res.json({
                success: true,
                message: 'OTP has been sent to your registered phone number'
            });
        } catch (smsError) {
            logger.error('SMS sending exception:', {
                message: smsError?.message || 'Unknown error',
                stack: smsError?.stack,
                phone: smsPhone,
                errorName: smsError?.name,
                errorCode: smsError?.code,
                fullError: smsError
            });
            console.error('SMS Exception:', smsError);
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
 * Normalize phone to digits-only, strip leading 94 (Sri Lanka) or 0 for consistent comparison.
 */
function normalizePhoneForLookup(phoneStr) {
    if (!phoneStr || typeof phoneStr !== 'string') return '';
    const digits = phoneStr.replace(/\D/g, '');
    return digits.replace(/^(94|0)+/, '') || digits;
}

/**
 * Get OTP from store by trying multiple possible keys (DB format, request format, digits-only).
 */
function getStoredOTP(otpStore, ...keys) {
    for (const key of keys) {
        if (!key) continue;
        const stored = otpStore.get(key);
        if (stored) return { stored, usedKey: key };
    }
    return { stored: null, usedKey: null };
}

/**
 * Verify OTP and reset password.
 * Supports lookup by username, email, or phone (req.body.username can be any of these).
 * Status codes: 400 invalid input, 401 invalid/expired OTP, 404 user not found, 200 success.
 */
const resetPasswordWithOTP = async (req, res, next) => {
    const logCtx = { path: '/api/auth/reset-password', method: req.method };
    try {
        const { username: identifier, otp, newPassword, confirmPassword } = req.body;

        logger.info('Reset password request received', { ...logCtx, hasUsername: !!identifier, hasOtp: !!otp });

        // --- Validation: required fields ---
        if (!identifier || String(identifier).trim() === '') {
            logger.warn('Reset password validation failed: username/email/phone required', logCtx);
            return res.status(400).json({
                success: false,
                message: 'Username, email, or phone is required'
            });
        }
        if (!otp || String(otp).trim() === '') {
            logger.warn('Reset password validation failed: OTP required', logCtx);
            return res.status(400).json({
                success: false,
                message: 'OTP is required'
            });
        }
        if (!newPassword || newPassword.length < 6) {
            logger.warn('Reset password validation failed: password too short', logCtx);
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }
        if (confirmPassword !== undefined && newPassword !== confirmPassword) {
            logger.warn('Reset password validation failed: passwords do not match', logCtx);
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        const identifierTrimmed = String(identifier).trim();
        const identifierLower = identifierTrimmed.toLowerCase();
        const identifierDigits = identifierTrimmed.replace(/\D/g, '');
        const isPhoneLike = identifierDigits.length >= 9;
        
        // Normalize phone for lookup: try multiple formats
        const phoneVariants = [];
        if (isPhoneLike) {
            const digitsOnly = identifierDigits;
            phoneVariants.push(digitsOnly); // e.g., "741525537"
            phoneVariants.push('0' + digitsOnly); // e.g., "0741525537"
            phoneVariants.push('94' + digitsOnly); // e.g., "94741525537"
            phoneVariants.push('+94' + digitsOnly); // e.g., "+94741525537"
            // Also try with leading 0/94 stripped
            const normalized = normalizePhoneForLookup(identifierTrimmed);
            if (normalized && normalized !== digitsOnly) {
                phoneVariants.push(normalized);
                phoneVariants.push('0' + normalized);
                phoneVariants.push('94' + normalized);
            }
        }

        // --- User lookup: username OR email OR phone (try multiple phone formats) ---
        let users;
        try {
            // Build phone conditions
            const phoneConditions = phoneVariants.length > 0 
                ? phoneVariants.map(() => 'phone = ?').join(' OR ')
                : 'FALSE';
            const phoneParams = phoneVariants;
            
            const query = `SELECT id, username, email, phone, is_active FROM users
                 WHERE is_active = TRUE
                 AND (
                   username = ?
                   OR LOWER(TRIM(COALESCE(email, ''))) = ?
                   ${phoneVariants.length > 0 ? `OR (${phoneConditions})` : ''}
                 )`;
            
            const params = [identifierTrimmed, identifierLower, ...phoneParams];
            
            logger.debug('Reset password user lookup query', { 
                ...logCtx, 
                query: query.substring(0, 200), 
                paramCount: params.length,
                phoneVariants: phoneVariants.slice(0, 3)
            });
            
            [users] = await executeQuery(query, params);
        } catch (dbErr) {
            logger.error('Reset password user lookup error', { 
                ...logCtx, 
                message: dbErr?.message,
                stack: dbErr?.stack 
            });
            return res.status(500).json({
                success: false,
                message: 'Database error. Please try again later.'
            });
        }

        if (!Array.isArray(users) || users.length === 0) {
            logger.warn('Reset password: user not found', { 
                ...logCtx, 
                identifier: identifierTrimmed,
                triedPhoneVariants: phoneVariants.length,
                isPhoneLike 
            });
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];
        logger.info('Reset password: user found', { 
            ...logCtx, 
            userId: user.id, 
            username: user.username,
            userEmail: user.email,
            userPhone: user.phone
        });

        // OTP store keys: try all possible phone formats that might have been used when storing OTP
        const dbPhoneRaw = (user.phone || '').replace(/[\s\-\(\)]/g, '').trim();
        const requestPhoneKey = isPhoneLike ? identifierTrimmed.replace(/[\s\-\(\)]/g, '').trim() : null;
        // Collect all possible keys: DB phone variants, request phone variants, normalized variants
        const allKeys = [
            dbPhoneRaw,
            requestPhoneKey,
            ...phoneVariants,
            identifierDigits,
            normalizePhoneForLookup(dbPhoneRaw),
            normalizePhoneForLookup(requestPhoneKey || '')
        ].filter(Boolean);
        const uniqKeys = [...new Set(allKeys)];
        
        logger.debug('Reset password: trying OTP keys', { 
            ...logCtx, 
            userId: user.id,
            keysCount: uniqKeys.length,
            sampleKeys: uniqKeys.slice(0, 5)
        });
        
        const { stored: storedOTP, usedKey: otpKey } = getStoredOTP(otpStore, ...uniqKeys);
        
        if (otpKey) {
            logger.info('Reset password: OTP found', { ...logCtx, userId: user.id, otpKey });
        }

        if (!storedOTP) {
            logger.warn('Reset password: OTP not found or expired', { ...logCtx, userId: user.id });
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired OTP. Please request a new one.'
            });
        }

        if (storedOTP.expiresAt < Date.now()) {
            uniqKeys.forEach(k => otpStore.delete(k));
            logger.warn('Reset password: OTP expired', { ...logCtx, userId: user.id });
            return res.status(401).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        if (storedOTP.otp !== String(otp).trim()) {
            logger.warn('Reset password: invalid OTP', { ...logCtx, userId: user.id });
            return res.status(401).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        const userId = storedOTP.userId;
        const [usersById] = await executeQuery(
            'SELECT id, username, is_active FROM users WHERE id = ? AND is_active = TRUE',
            [userId]
        );

        if (!usersById || usersById.length === 0) {
            uniqKeys.forEach(k => otpStore.delete(k));
            logger.warn('Reset password: user no longer active', { ...logCtx, userId });
            return res.status(404).json({
                success: false,
                message: 'User account not found or inactive'
            });
        }

        const userToUpdate = usersById[0];

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await executeQuery(
            'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
            [passwordHash, userToUpdate.id]
        );

        uniqKeys.forEach(k => otpStore.delete(k));

        logger.info('Password reset successful', { ...logCtx, userId: userToUpdate.id, username: userToUpdate.username });

        return res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        logger.error('Reset password error', { ...logCtx, message: error?.message, stack: error?.stack });
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
