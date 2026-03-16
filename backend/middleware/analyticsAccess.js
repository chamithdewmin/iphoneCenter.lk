const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Require verified Analytics OTP access.
 *
 * Checks for a recent analytics_otp_sessions record for this user where:
 * - consumed = TRUE
 * - granted_until > NOW()
 */
const requireAnalyticsAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const [rows] = await executeQuery(
      `SELECT id, granted_until
       FROM analytics_otp_sessions
       WHERE user_id = ?
         AND consumed = TRUE
         AND granted_until > NOW()
       ORDER BY granted_until DESC
       LIMIT 1`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(403).json({
        success: false,
        code: 'ANALYTICS_OTP_REQUIRED',
        message: 'Analytics access requires OTP verification.',
      });
    }

    // Attach for optional use in controllers
    req.analyticsAccess = {
      sessionId: rows[0].id,
      grantedUntil: rows[0].granted_until,
    };

    return next();
  } catch (error) {
    logger.error('Analytics access middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify analytics access',
    });
  }
};

module.exports = {
  requireAnalyticsAccess,
};

