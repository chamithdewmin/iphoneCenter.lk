const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { executeQuery, getConnection } = require('../config/database');
const { JWT_EXPIRY } = require('../config/constants');
const { getJwtSecret, getJwtRefreshSecret, getTestLoginCredentials, TEST_USER_ID } = require('../config/env');
const logger = require('../utils/logger');
const { logAudit, getRequestMeta } = require('../services/auditService');
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
    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        const { username, email, password, fullName, role: roleRaw, branchId, phone } = req.body;
        const role = roleRaw != null ? String(roleRaw).toLowerCase().trim() : '';

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

        // Insert user (role already normalized to lowercase above)
        const [result] = await connection.execute(
            `INSERT INTO users (username, email, password_hash, full_name, phone, role, branch_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [username, email, passwordHash, fullName, phone || null, role, branchId || null]
        );

        await connection.commit();

        const userId = result.insertId ?? (result.rows && result.rows[0] && result.rows[0].id);
        logger.info(`User registered: ${username} (ID: ${userId})`);

        await logAudit({
            action: 'user_create',
            userId: req.user.id,
            branchId: req.user.branch_id,
            entityType: 'user',
            entityId: userId,
            newValues: { username, email, role },
            ...getRequestMeta(req),
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userId,
                username,
                email,
                role
            }
        });
    } catch (error) {
        if (connection && connection.rollback) {
            await connection.rollback().catch((err) => logger.error('Rollback error:', err));
        }
        logger.error('Registration error:', { message: error.message, code: error.code, stack: error.stack });
        
        // Check if it's an enum value error (e.g. role case mismatch in PostgreSQL)
        if (error.message && error.message.includes('invalid input value for enum')) {
            return res.status(400).json({
                success: false,
                message: `Invalid role "${req.body?.role}". Use one of: admin, manager, cashier, staff (lowercase).`
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
        if (connection && connection.release) {
            connection.release().catch((err) => logger.error('Release connection error:', err));
        }
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

        // Test/demo login: only when TEST_LOGIN_USERNAME and TEST_LOGIN_PASSWORD are set in env
        const un = String(username || '').trim();
        const pw = String(password || '');
        const testCreds = getTestLoginCredentials();
        const isTestLogin = testCreds && un === testCreds.username && pw === testCreds.password;
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
                const payload = {
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
                };
                if (user.role === 'admin') {
                    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
                    const userAgent = req.headers['user-agent'] || 'unknown';
                    const dateTime = new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
                    const deviceInfo = `IP: ${ipAddress} | Device: ${userAgent}`;
                    const message = `Admin Security Alert: An administrator logged into your system at ${dateTime}. Device/IP: ${deviceInfo}. If this was not you, reset your password immediately.`;
                    const adminPhone = (user.phone || '').trim();
                    if (adminPhone && sendSMS) {
                        sendSMS(adminPhone, message).catch((err) => logger.error('Admin login SMS failed:', err?.message || err));
                    }
                }
                return res.json(payload);
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
            `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.role, u.phone,
                    u.branch_id, u.is_active, b.name as branch_name, b.code as branch_code
             FROM users u
             LEFT JOIN branches b ON u.branch_id = b.id
             WHERE (u.username = ? OR u.email = ?) AND u.is_active = TRUE`,
            [username, username]
        );

        if (users.length === 0) {
            await logAudit({
                action: 'login_failure',
                entityType: 'auth',
                newValues: { identifier: String(username).substring(0, 100) },
                ...getRequestMeta(req),
            });
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            await logAudit({
                action: 'login_failure',
                userId: user.id,
                branchId: user.branch_id,
                entityType: 'auth',
                entityId: user.id,
                newValues: { reason: 'invalid_password', username: user.username },
                ...getRequestMeta(req),
            });
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

        // Log login time
        try {
            const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            
            const [loginLogResult] = await executeQuery(
                `INSERT INTO user_login_logs (user_id, login_time, ip_address, user_agent) 
                 VALUES (?, NOW(), ?, ?) RETURNING id`,
                [user.id, ipAddress, userAgent]
            );

            const loginLogId = loginLogResult.insertId || (loginLogResult.rows && loginLogResult.rows[0] && loginLogResult.rows[0].id);
            logger.info(`User logged in: ${user.username} (ID: ${user.id}, Login Log ID: ${loginLogId})`);
        } catch (logError) {
            // Don't fail login if logging fails, just log the error
            logger.error('Failed to create login log:', logError);
        }

        await logAudit({
            action: 'login_success',
            userId: user.id,
            branchId: user.branch_id,
            entityType: 'user',
            entityId: user.id,
            newValues: { username: user.username },
            ...getRequestMeta(req),
        });

        const payload = {
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
        };
        if (user.role === 'admin') {
            const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            const dateTime = new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
            const deviceInfo = `IP: ${ipAddress} | Device: ${userAgent}`;
            const message = `Admin Security Alert: An administrator logged into your system at ${dateTime}. Device/IP: ${deviceInfo}. If this was not you, reset your password immediately.`;
            const adminPhone = (user.phone || '').trim();
            if (adminPhone && sendSMS) {
                sendSMS(adminPhone, message).catch((err) => logger.error('Admin login SMS failed:', err?.message || err));
            }
        }
        res.json(payload);
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
 * Logout user (revoke refresh token and log logout time)
 */
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const userId = req.user?.id;

        if (refreshToken) {
            await executeQuery(
                'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = ?',
                [refreshToken]
            );
        }

        // Update logout time for the most recent login log without logout time
        if (userId && userId !== TEST_USER_ID) {
            const [loginLogs] = await executeQuery(
                `SELECT id, login_time FROM user_login_logs 
                 WHERE user_id = ? AND logout_time IS NULL 
                 ORDER BY login_time DESC LIMIT 1`,
                [userId]
            );

            if (loginLogs && loginLogs.length > 0) {
                const loginLog = loginLogs[0];
                const logoutTime = new Date();
                const loginTime = new Date(loginLog.login_time);
                const sessionDuration = Math.floor((logoutTime - loginTime) / 1000); // seconds

                await executeQuery(
                    `UPDATE user_login_logs 
                     SET logout_time = NOW(), session_duration_seconds = ? 
                     WHERE id = ?`,
                    [sessionDuration, loginLog.id]
                );

                logger.info(`User logged out: ID ${userId}, Session duration: ${sessionDuration}s`);
            }
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
    logger.info('Password reset OTP request received', {
        bodyKeys: Object.keys(req.body || {}),
        method: req.method,
        path: req.path
    });

    try {
        // Accept email or username only; phone is looked up from DB
        const emailOrUsername = req.body?.email ?? req.body?.username;

        if (emailOrUsername === undefined || emailOrUsername === null || String(emailOrUsername).trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Email or username is required',
                errors: [{ field: 'email', message: 'Email or username is required' }]
            });
        }

        const normalizedEmail = String(emailOrUsername).trim().toLowerCase();
        if (normalizedEmail.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Email or username must be at least 3 characters',
                errors: [{ field: 'email', message: 'Email or username must be at least 3 characters' }]
            });
        }

        logger.info(`Looking up user by email/username: ${normalizedEmail}`);

        // Find user by email or username only
        let users;
        try {
            [users] = await executeQuery(
                'SELECT id, username, email, full_name, phone, role, is_active FROM users WHERE (LOWER(TRIM(email)) = ? OR LOWER(TRIM(username)) = ?) AND is_active = TRUE',
                [normalizedEmail, normalizedEmail]
            );
        } catch (dbError) {
            logger.error('Database error in requestPasswordResetOTP', { message: dbError?.message });
            return res.status(500).json({
                success: false,
                message: 'Database error. Please try again later.'
            });
        }

        if (!Array.isArray(users) || users.length === 0) {
            logger.warn(`No active user found for email/username: ${normalizedEmail}`);
            return res.status(400).json({
                success: false,
                message: 'No account found with this email. Please check and try again.'
            });
        }

        const user = users[0];

        // Get phone from user record and send OTP to that number
        const rawPhone = (user.phone || '').trim().replace(/[\s\-\(\)]/g, '');
        if (!rawPhone || rawPhone.length < 9 || !/^\d+$/.test(rawPhone.replace(/^\+/, ''))) {
            logger.warn(`User ${user.username} has no valid phone number on file`);
            return res.status(400).json({
                success: false,
                message: 'No phone number on file for this account. Please contact your administrator.'
            });
        }

        // Key for OTP store: same format as getOtpLookupKeys uses (user.phone normalized)
        const otpStoreKey = rawPhone;
        const smsPhone = rawPhone.startsWith('94') ? rawPhone : rawPhone.startsWith('0') ? '94' + rawPhone.slice(1) : '94' + rawPhone;

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

        logger.info(`User verified: ${user.username} (${user.email}) - sending OTP to registered phone`);

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 60 * 1000; // 1 minute

        // Store OTP keyed by user's phone (so reset-password can find it when lookup by email)
        otpStore.set(otpStoreKey, {
            otp,
            expiresAt,
            userId: user.id,
            username: user.username,
            phone: otpStoreKey
        });

        const smsTestMode = process.env.SMS_TEST_MODE === 'true';
        if (smsTestMode) {
            logger.warn(`SMS_TEST_MODE enabled - OTP ${otp} for ${user.username} (SMS not sent)`);
            return res.json({
                success: true,
                message: `OTP generated (TEST MODE): ${otp}. SMS not sent in test mode.`
            });
        }

        if (!sendSMS || typeof sendSMS !== 'function') {
            logger.error('SMS service not available');
            return res.status(500).json({
                success: false,
                message: 'SMS service is not configured. Please contact administrator.'
            });
        }

        logger.info(`Sending OTP via SMS to ${smsPhone} for user: ${user.username}`);
        
        let smsResult;
        try {
            const message = `iPhone Center password reset code: ${otp}\nValid for 1 minute. Do not share this code with anyone.`;
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

// Reusable reset-password logic (user lookup by username/email/phone, OTP, update password)
const passwordResetService = require('../services/passwordResetService');

/**
 * Verify OTP and reset password.
 * Accepts username OR phone (Sri Lanka: 0771234567, 771234567, +94771234567).
 * Prevents user enumeration: same generic message for invalid/not-found/expired.
 */
const resetPasswordWithOTP = async (req, res, next) => {
    const logCtx = { path: '/api/auth/reset-password', method: req.method };
    const genericFailMessage = 'Invalid request. Check your details and OTP, or request a new OTP.';

    try {
        const { username: identifier, otp, newPassword, confirmPassword } = req.body;

        logger.info('Reset password request', { ...logCtx, hasIdentifier: !!identifier, hasOtp: !!otp });

        if (!identifier || String(identifier).trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Username, email, or phone is required'
            });
        }
        if (!otp || String(otp).trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'OTP is required'
            });
        }
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }
        if (confirmPassword !== undefined && newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        const attemptCheck = passwordResetService.checkOtpAttemptLimit(identifier);
        if (!attemptCheck.allowed) {
            return res.status(429).json({
                success: false,
                message: attemptCheck.message
            });
        }

        const { findUserByIdentifier, getStoredOTP, getOtpLookupKeys, validateOtp, updatePassword, clearOtpAttempts } = passwordResetService;

        const result = await findUserByIdentifier(executeQuery, identifier);
        if (result.error) {
            logger.error('Reset password DB error', { ...logCtx, message: result.error });
            return res.status(500).json({
                success: false,
                message: 'Database error. Please try again later.'
            });
        }
        if (!result.user) {
            logger.warn('Reset password: user not found (enumeration-safe)', { ...logCtx });
            return res.status(400).json({
                success: false,
                message: genericFailMessage
            });
        }

        const user = result.user;
        logger.info('Reset password: user found', { ...logCtx, userId: user.id, username: user.username });

        const otpKeys = getOtpLookupKeys(user, identifier);
        const { stored: storedOTP, usedKey: otpKey } = getStoredOTP(otpStore, otpKeys);

        const validation = validateOtp(otpStore, storedOTP, otp, otpKeys);
        if (!validation.valid) {
            logger.warn('Reset password: OTP invalid or expired', { ...logCtx, userId: user.id });
            return res.status(400).json({
                success: false,
                message: genericFailMessage
            });
        }

        const userId = storedOTP.userId;
        const [usersById] = await executeQuery(
            'SELECT id, username, is_active FROM users WHERE id = ? AND is_active = TRUE',
            [userId]
        );
        if (!usersById || usersById.length === 0) {
            otpKeys.forEach(k => otpStore.delete(k));
            return res.status(400).json({
                success: false,
                message: genericFailMessage
            });
        }

        await updatePassword(executeQuery, userId, newPassword);
        otpKeys.forEach(k => otpStore.delete(k));
        clearOtpAttempts(identifier);

        logger.info('Password reset successful', { ...logCtx, userId, username: usersById[0].username });

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
