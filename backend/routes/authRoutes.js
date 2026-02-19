const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate, verifyRefreshToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleGuard');
const { handleValidationErrors } = require('../middleware/validate');

// Validation rules
const registerValidation = [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('role').isIn(['admin', 'manager', 'staff', 'cashier']).withMessage('Invalid role')
];

const loginValidation = [
    body('username').trim().notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// GET /api/auth/login → 405 (login is POST only; avoids "route not found" when URL is opened in browser)
router.get('/login', (req, res) => {
    res.set('Allow', 'POST');
    res.status(405).json({
        success: false,
        message: 'Method not allowed. Use POST with JSON body { username, password }.'
    });
});

// Routes (authenticate runs first so req.user is set for requireAdmin)
router.post('/register', authenticate, requireAdmin, registerValidation, handleValidationErrors, authController.register);
router.post('/login', loginValidation, handleValidationErrors, authController.login);
router.post('/refresh', verifyRefreshToken, authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);

// Password reset routes (no authentication required)
// IMPORTANT: Do NOT add express-validator middleware here - validation is done in the controller
// This avoids field name confusion (e.g., "username" vs "email")
router.post('/forgot-password', authController.requestPasswordResetOTP);
router.post('/reset-password', [
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('otp').trim().notEmpty().withMessage('OTP is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], handleValidationErrors, authController.resetPasswordWithOTP);

module.exports = router;
