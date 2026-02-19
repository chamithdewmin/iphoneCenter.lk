const { validationResult } = require('express-validator');

/**
 * Middleware to handle express-validator results.
 * Call after validation chains; returns 400 with errors if validation failed.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errList = errors.array().map((e) => ({ 
            field: e.path || e.param || e.location, 
            message: e.msg,
            value: e.value
        }));
        const firstMessage = errList[0]?.message || 'Validation failed';
        
        // Log validation errors for debugging
        console.error('Validation errors:', {
            errors: errList,
            rawErrors: errors.array(),
            body: req.body,
            bodyKeys: Object.keys(req.body || {}),
            method: req.method,
            path: req.path,
            contentType: req.headers['content-type']
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
