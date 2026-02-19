const { validationResult } = require('express-validator');

/**
 * Middleware to handle express-validator results.
 * Call after validation chains; returns 400 with errors if validation failed.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errList = errors.array().map((e) => ({ field: e.path || e.param, message: e.msg }));
        const firstMessage = errList[0]?.message || 'Validation failed';
        
        // Log validation errors for debugging
        console.log('Validation errors:', {
            errors: errList,
            body: req.body,
            method: req.method,
            path: req.path
        });
        
        return res.status(400).json({
            success: false,
            message: errList.length === 1 ? firstMessage : 'Please fix the errors below.',
            errors: errList
        });
    }
    next();
};

module.exports = { handleValidationErrors };
