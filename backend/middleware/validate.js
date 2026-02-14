const { validationResult } = require('express-validator');

/**
 * Middleware to handle express-validator results.
 * Call after validation chains; returns 400 with errors if validation failed.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

module.exports = { handleValidationErrors };
