const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { requireManager } = require('../middleware/roleGuard');
const { sendAnalyticsOtp, verifyAnalyticsOtp } = require('../controllers/analyticsSecurityController');

// All analytics security routes require authentication and at least manager role (admin always allowed)
router.use(authenticate);
router.use(requireManager);

router.post('/otp/send', sendAnalyticsOtp);
router.post('/otp/verify', verifyAnalyticsOtp);

module.exports = router;

