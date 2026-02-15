const { executeQuery } = require('../config/database');
const { ROLES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Branch guard middleware - ensures data isolation based on branch
 * Admin can access all branches, others can only access their branch
 */
const branchGuard = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Normalize role (PostgreSQL enum may come as string)
        const role = req.user.role != null ? String(req.user.role).toLowerCase() : '';

        // Admin can access all branches
        if (role === ROLES.ADMIN) {
            // If branch_id is provided in query/params, validate it exists
            const branchId = req.params.branchId || req.query.branchId || req.body.branchId;
            if (branchId) {
                const [branches] = await executeQuery(
                    'SELECT id FROM branches WHERE id = ? AND is_active = TRUE',
                    [branchId]
                );
                if (branches.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Branch not found'
                    });
                }
            }
            return next();
        }

        // Non-admin users must have a branch_id
        if (req.user.branch_id == null || req.user.branch_id === '') {
            return res.status(403).json({
                success: false,
                message: 'User must be assigned to a branch'
            });
        }

        // Set user's branch_id in request for use in queries
        req.userBranchId = req.user.branch_id;

        // If branch_id is provided in request, verify it matches user's branch
        const branchId = req.params.branchId || req.query.branchId || req.body.branchId;
        if (branchId && parseInt(branchId) !== req.user.branch_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this branch'
            });
        }

        next();
    } catch (error) {
        logger.error('Branch guard error:', { message: error.message, code: error.code, stack: error.stack });
        if (process.env.NODE_ENV === 'production') {
            console.error('Branch guard error:', error.code, error.message);
        }
        // Always return 503 (never 500) so client gets a clear, consistent response; check logs for real cause
        return res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable. Check backend logs for "Branch guard error" or "Get branches error".'
        });
    }
};

/**
 * Middleware to extract branch_id from request and set it
 */
const setBranchContext = (req, res, next) => {
    // Priority: params > query > body > user's branch
    req.branchId = req.params.branchId || 
                   req.query.branchId || 
                   req.body.branchId || 
                   req.user?.branch_id;

    // For admin, allow branch_id override
    if (req.user?.role === ROLES.ADMIN && (req.params.branchId || req.query.branchId || req.body.branchId)) {
        req.branchId = req.params.branchId || req.query.branchId || req.body.branchId;
    }

    next();
};

module.exports = {
    branchGuard,
    setBranchContext
};
