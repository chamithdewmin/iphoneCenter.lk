const { ROLES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Role-based access control middleware
 * @param {...string} allowedRoles - Roles allowed to access the route
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userRole = req.user.role;

        // Admin has access to everything
        if (userRole === ROLES.ADMIN) {
            return next();
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(userRole)) {
            logger.warn(`Access denied for user ${req.user.id} with role ${userRole}`);
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = requireRole(ROLES.ADMIN);

/**
 * Middleware to check if user is admin or manager
 */
const requireManager = requireRole(ROLES.ADMIN, ROLES.MANAGER);

module.exports = {
    requireRole,
    requireAdmin,
    requireManager
};
