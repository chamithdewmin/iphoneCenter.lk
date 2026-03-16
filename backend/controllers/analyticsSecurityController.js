const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');
const { sendSMS } = require('../utils/smsService');
const logger = require('../utils/logger');
const { ROLES } = require('../config/constants');

const OTP_TTL_MINUTES = 5;
const ANALYTICS_ACCESS_MINUTES = 15;

function getClientMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  };
}

async function logAnalyticsAccess({ userId, action, req, details = null }) {
  try {
    const meta = getClientMeta(req);
    await executeQuery(
      `INSERT INTO analytics_access_logs (user_id, action, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, action, meta.ip, meta.userAgent, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    logger.warn('Failed to log analytics access event:', err?.message);
  }
}

/**
 * POST /api/analytics/unlock-with-password
 * Verify account password and create an analytics access window.
 */
const unlockWithPassword = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const role = user.role ? String(user.role).toLowerCase() : '';
    if (![ROLES.ADMIN, ROLES.MANAGER].includes(role)) {
      await logAnalyticsAccess({ userId: user.id, action: 'denied', req, details: { reason: 'role_not_allowed_password' } });
      return res.status(403).json({ success: false, message: 'Only admin/manager can access analytics.' });
    }

    const { password } = req.body || {};
    if (!password || String(password).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const [rows] = await executeQuery(
      'SELECT password_hash, phone FROM users WHERE id = ? AND is_active = TRUE',
      [user.id]
    );
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'User not found.' });
    }

    const row = rows[0];
    const match = await bcrypt.compare(String(password), row.password_hash);
    if (!match) {
      await logAnalyticsAccess({ userId: user.id, action: 'denied', req, details: { reason: 'bad_password' } });
      return res.status(400).json({ success: false, message: 'Password incorrect.' });
    }

    const phone = row.phone ? String(row.phone).trim() : 'n/a';
    const now = new Date();
    const grantedUntil = new Date(now.getTime() + ANALYTICS_ACCESS_MINUTES * 60 * 1000);
    const meta = getClientMeta(req);

    const placeholderHash = await bcrypt.hash('analytics-password-unlock', 8);

    await executeQuery(
      `INSERT INTO analytics_otp_sessions
        (user_id, phone, otp_hash, expires_at, granted_until, consumed, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, TRUE, ?, ?)`,
      [
        user.id,
        phone,
        placeholderHash,
        now.toISOString(),
        grantedUntil.toISOString(),
        meta.ip,
        meta.userAgent,
      ]
    );

    await logAnalyticsAccess({
      userId: user.id,
      action: 'password_verified',
      req,
      details: { grantedUntil },
    });

    return res.json({
      success: true,
      message: 'Analytics access granted.',
      grantedUntil,
    });
  } catch (error) {
    logger.error('unlockWithPassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify password for analytics access',
    });
  }
};

/**
 * POST /api/analytics/otp/send
 * Sends a 6-digit OTP to the admin/manager phone number for Analytics access.
 */
const sendAnalyticsOtp = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const role = user.role ? String(user.role).toLowerCase() : '';
    if (![ROLES.ADMIN, ROLES.MANAGER].includes(role)) {
      await logAnalyticsAccess({ userId: user.id, action: 'denied', req, details: { reason: 'role_not_allowed' } });
      return res.status(403).json({ success: false, message: 'Only admin/manager can access analytics.' });
    }

    // Load latest phone from DB to avoid stale data
    const [rows] = await executeQuery(
      'SELECT phone FROM users WHERE id = ? AND is_active = TRUE',
      [user.id]
    );
    const phone = rows && rows[0] && rows[0].phone ? String(rows[0].phone).trim() : null;
    if (!phone) {
      await logAnalyticsAccess({ userId: user.id, action: 'denied', req, details: { reason: 'missing_phone' } });
      return res.status(400).json({
        success: false,
        message: 'No phone number configured for this user. Please add a phone number to your profile.',
      });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);
    const grantedUntil = new Date(now.getTime() + ANALYTICS_ACCESS_MINUTES * 60 * 1000);

    const meta = getClientMeta(req);

    // Insert session
    await executeQuery(
      `INSERT INTO analytics_otp_sessions
        (user_id, phone, otp_hash, expires_at, granted_until, consumed, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, FALSE, ?, ?)`,
      [user.id, phone, otpHash, expiresAt.toISOString(), grantedUntil.toISOString(), meta.ip, meta.userAgent]
    );

    // Send SMS
    const message = `Your Analytics OTP is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`;
    const smsResult = await sendSMS(phone, message);
    if (!smsResult.success) {
      logger.error('Failed to send analytics OTP SMS:', smsResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP SMS. Please try again later.',
      });
    }

    await logAnalyticsAccess({
      userId: user.id,
      action: 'otp_sent',
      req,
      details: { phone: smsResult.phoneNumber },
    });

    return res.json({
      success: true,
      message: 'OTP sent to your registered phone number.',
      // No OTP or session id is returned for security; frontend just proceeds to verify step.
      expiresInSeconds: OTP_TTL_MINUTES * 60,
    });
  } catch (error) {
    logger.error('sendAnalyticsOtp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send analytics OTP',
    });
  }
};

/**
 * POST /api/analytics/otp/verify
 * Body: { otp: "123456" }
 */
const verifyAnalyticsOtp = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { otp } = req.body || {};
    const trimmedOtp = String(otp || '').trim();
    if (!/^\d{6}$/.test(trimmedOtp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format',
      });
    }

    // Get latest, not-yet-consumed session for this user
    const [sessions] = await executeQuery(
      `SELECT id, otp_hash, expires_at, granted_until, consumed
       FROM analytics_otp_sessions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id]
    );

    if (!sessions || sessions.length === 0) {
      await logAnalyticsAccess({ userId: user.id, action: 'denied', req, details: { reason: 'no_session' } });
      return res.status(400).json({
        success: false,
        message: 'No OTP session found. Please request a new code.',
      });
    }

    const session = sessions[0];
    if (session.consumed) {
      await logAnalyticsAccess({ userId: user.id, action: 'denied', req, details: { reason: 'already_consumed' } });
      return res.status(400).json({
        success: false,
        message: 'This OTP has already been used. Please request a new code.',
      });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      await logAnalyticsAccess({ userId: user.id, action: 'denied', req, details: { reason: 'expired' } });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code.',
      });
    }

    const match = await bcrypt.compare(trimmedOtp, session.otp_hash);
    if (!match) {
      await logAnalyticsAccess({ userId: user.id, action: 'denied', req, details: { reason: 'invalid_otp' } });
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
      });
    }

    // Mark session consumed
    await executeQuery(
      `UPDATE analytics_otp_sessions
       SET consumed = TRUE, used_at = NOW()
       WHERE id = ?`,
      [session.id]
    );

    await logAnalyticsAccess({
      userId: user.id,
      action: 'otp_verified',
      req,
      details: { sessionId: session.id, grantedUntil: session.granted_until },
    });

    return res.json({
      success: true,
      message: 'Analytics access granted.',
      grantedUntil: session.granted_until,
    });
  } catch (error) {
    logger.error('verifyAnalyticsOtp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify analytics OTP',
    });
  }
};

module.exports = {
  unlockWithPassword,
  sendAnalyticsOtp,
  verifyAnalyticsOtp,
};

