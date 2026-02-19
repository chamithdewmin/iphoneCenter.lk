const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const smsController = require('../controllers/smsController');
const { authenticate } = require('../middleware/auth');
const { requireManager } = require('../middleware/roleGuard');
const { handleValidationErrors } = require('../middleware/validate');

// Validation rules
const sendSMSValidation = [
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
];

const sendBulkValidation = [
    body('phoneNumbers').isArray({ min: 1 }).withMessage('At least one phone number is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
];

// Routes
router.post('/send', authenticate, requireManager, sendSMSValidation, handleValidationErrors, smsController.sendSingleSMS);
router.post('/bulk', authenticate, requireManager, sendBulkValidation, handleValidationErrors, smsController.sendBulk);
router.get('/config', authenticate, requireManager, smsController.getConfig);

module.exports = router;
