const { validationResult } = require('express-validator');

/**
 * Middleware to handle express-validator results.
 * Call after validation chains; returns 400 with errors if validation failed.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errList = errors.array().map((e) => {
            // For custom validators, the field name is in the nested structure
            // Try multiple ways to get the field name
            const fieldName = e.path || e.param || (e.nestedErrors && e.nestedErrors[0]?.path) || 'unknown';
            return {
                field: fieldName,
                message: e.msg,
                value: e.value
            };
        });
        const firstMessage = errList[0]?.message || 'Validation failed';
        
        // Log validation errors for debugging
        console.error('Validation errors:', {
            errors: errList,
            rawErrors: errors.array(),
            rawErrorsDetailed: errors.array().map(e => ({
                path: e.path,
                param: e.param,
                location: e.location,
                msg: e.msg,
                value: e.value,
                nestedErrors: e.nestedErrors
            })),
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
