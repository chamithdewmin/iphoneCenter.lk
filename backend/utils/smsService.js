const axios = require('axios');
const logger = require('./logger');

/**
 * SMS Gateway Configuration
 * SMSLenz API Integration
 */
const SMS_CONFIG = {
    userId: process.env.SMS_USER_ID || '295',
    apiKey: process.env.SMS_API_KEY || 'c591f7e0-6a5c-4576-9e79-f87abbe622e4',
    apiBaseUrl: process.env.SMS_API_BASE_URL || 'https://www.smslenz.lk/api',
    senderId: process.env.SMS_SENDER_ID || 'IPHONECENTR'
};

/**
 * Send SMS via SMSLenz API
 * @param {string} phoneNumber - Phone number (with country code, e.g., 94741234567)
 * @param {string} message - Message text
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendSMS = async (phoneNumber, message) => {
    try {
        // Format phone number (remove spaces, dashes, ensure it starts with country code)
        let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
        
        // If phone starts with 0, replace with 94 (Sri Lanka country code)
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '94' + formattedPhone.substring(1);
        }
        // If phone doesn't start with country code, add 94
        else if (!formattedPhone.startsWith('94')) {
            formattedPhone = '94' + formattedPhone;
        }

        // Validate phone number
        if (formattedPhone.length < 11 || formattedPhone.length > 12) {
            throw new Error('Invalid phone number format');
        }

        // Validate message
        if (!message || !message.trim()) {
            throw new Error('Message cannot be empty');
        }

        if (message.length > 160) {
            logger.warn(`SMS message exceeds 160 characters (${message.length}), may be split into multiple messages`);
        }

        // Format phone with + prefix for SMSLenz API
        const contactPhone = formattedPhone.startsWith('94') ? '+' + formattedPhone : formattedPhone;

        // Prepare API request - SMSLenz API format
        const apiUrl = `${SMS_CONFIG.apiBaseUrl}/send-sms`;
        const requestData = {
            user_id: SMS_CONFIG.userId,
            api_key: SMS_CONFIG.apiKey,
            sender_id: SMS_CONFIG.senderId,
            contact: contactPhone,
            message: message.trim()
        };

        logger.info(`Sending SMS to ${contactPhone} via SMSLenz`);

        // Make API request
        const response = await axios.post(apiUrl, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 15000 // 15 second timeout
        });

        // Check response - SMSLenz returns { success: true, data: {...} }
        if (response.data && (response.data.success === true || response.data.data?.status === 'success')) {
            const data = response.data.data || response.data;
            logger.info(`SMS sent successfully to ${contactPhone}. Campaign ID: ${data.campaign_id || 'N/A'}`);
            return {
                success: true,
                messageId: data.campaign_id,
                phoneNumber: contactPhone,
                creditBalance: data.sms_credit_balance
            };
        } else {
            const errorMsg = response.data?.message || response.data?.error || 'Unknown error from SMS gateway';
            logger.error(`SMS gateway error: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        }
    } catch (error) {
        logger.error('SMS sending error:', error.message);
        
        if (error.response) {
            // API responded with error status
            const errorMsg = error.response.data?.message || error.response.data?.error || `HTTP ${error.response.status}`;
            return {
                success: false,
                error: `SMS Gateway Error: ${errorMsg}`
            };
        } else if (error.request) {
            // Request made but no response
            return {
                success: false,
                error: 'SMS Gateway: No response from server. Please check your internet connection.'
            };
        } else {
            // Error in request setup
            return {
                success: false,
                error: `SMS Error: ${error.message}`
            };
        }
    }
};

/**
 * Send bulk SMS to multiple recipients using SMSLenz bulk API
 * @param {Array<string>} phoneNumbers - Array of phone numbers
 * @param {string} message - Message text
 * @returns {Promise<{success: number, failed: number, results: Array}>}
 */
const sendBulkSMS = async (phoneNumbers, message) => {
    try {
        // Format phone numbers with + prefix
        const contacts = phoneNumbers.map(phone => {
            let formatted = phone.replace(/[\s\-\(\)]/g, '');
            if (formatted.startsWith('0')) {
                formatted = '94' + formatted.substring(1);
            } else if (!formatted.startsWith('94')) {
                formatted = '94' + formatted;
            }
            return '+' + formatted;
        });

        // Prepare bulk API request
        const apiUrl = `${SMS_CONFIG.apiBaseUrl}/send-bulk-sms`;
        const requestData = {
            user_id: SMS_CONFIG.userId,
            api_key: SMS_CONFIG.apiKey,
            sender_id: SMS_CONFIG.senderId,
            contacts: contacts,
            message: message.trim()
        };

        logger.info(`Sending bulk SMS to ${contacts.length} recipients via SMSLenz`);

        // Make API request
        const response = await axios.post(apiUrl, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000 // 30 second timeout for bulk
        });

        // Check response
        if (response.data && (response.data.success === true || response.data.data?.status === 'success')) {
            const data = response.data.data || response.data;
            logger.info(`Bulk SMS sent successfully. Campaign ID: ${data.campaign_id || 'N/A'}`);
            return {
                success: contacts.length,
                failed: 0,
                total: contacts.length,
                campaignId: data.campaign_id,
                creditBalance: data.sms_credit_balance,
                results: contacts.map(phone => ({ phoneNumber: phone, success: true }))
            };
        } else {
            const errorMsg = response.data?.message || response.data?.error || 'Unknown error from SMS gateway';
            logger.error(`Bulk SMS gateway error: ${errorMsg}`);
            // Fallback to individual sends if bulk fails
            return await sendBulkSMSIndividual(phoneNumbers, message);
        }
    } catch (error) {
        logger.error('Bulk SMS API error, falling back to individual sends:', error.message);
        // Fallback to individual sends
        return await sendBulkSMSIndividual(phoneNumbers, message);
    }
};

/**
 * Fallback: Send bulk SMS individually (if bulk API fails)
 */
const sendBulkSMSIndividual = async (phoneNumbers, message) => {
    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const phoneNumber of phoneNumbers) {
        const result = await sendSMS(phoneNumber, message);
        results.push({
            phoneNumber,
            ...result
        });

        if (result.success) {
            successCount++;
        } else {
            failedCount++;
        }

        // Add small delay between messages to avoid rate limiting
        if (phoneNumbers.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return {
        success: successCount,
        failed: failedCount,
        total: phoneNumbers.length,
        results
    };
};

/**
 * Get SMS gateway configuration (for settings page)
 */
const getSMSConfig = () => {
    return {
        userId: SMS_CONFIG.userId,
        apiBaseUrl: SMS_CONFIG.apiBaseUrl,
        senderId: SMS_CONFIG.senderId,
        // Don't expose full API key in response
        apiKeyConfigured: !!SMS_CONFIG.apiKey && SMS_CONFIG.apiKey.length > 0
    };
};

module.exports = {
    sendSMS,
    sendBulkSMS,
    getSMSConfig
};
