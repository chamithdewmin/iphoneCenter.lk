const { sendSMS, sendBulkSMS, getSMSConfig } = require('../utils/smsService');
const logger = require('../utils/logger');

/**
 * Send SMS to a single recipient
 */
const sendSingleSMS = async (req, res, next) => {
    try {
        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }

        const result = await sendSMS(phoneNumber, message);

        if (result.success) {
            res.json({
                success: true,
                message: 'SMS sent successfully',
                data: {
                    messageId: result.messageId,
                    phoneNumber: result.phoneNumber
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || 'Failed to send SMS'
            });
        }
    } catch (error) {
        logger.error('Send SMS error:', error);
        next(error);
    }
};

/**
 * Send bulk SMS to multiple recipients
 */
const sendBulk = async (req, res, next) => {
    try {
        const { phoneNumbers, message } = req.body;

        if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Phone numbers array is required'
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const result = await sendBulkSMS(phoneNumbers, message);

        res.json({
            success: true,
            message: `SMS sent to ${result.success} recipient(s). ${result.failed} failed.`,
            data: result
        });
    } catch (error) {
        logger.error('Send bulk SMS error:', error);
        next(error);
    }
};

/**
 * Get SMS gateway configuration
 */
const getConfig = async (req, res, next) => {
    try {
        const config = getSMSConfig();
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        logger.error('Get SMS config error:', error);
        next(error);
    }
};

module.exports = {
    sendSingleSMS,
    sendBulk,
    getConfig
};
