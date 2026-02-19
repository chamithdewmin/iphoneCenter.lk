/**
 * Password reset service – user lookup, OTP validation, password update.
 * Reusable, async/await, production-ready. Works with in-memory OTP store.
 */

const bcrypt = require('bcryptjs');
const {
    getSriLankaPhoneVariants,
    isPhoneLike,
    normalizeSriLankaPhone
} = require('../utils/phoneUtils');
const logger = require('../utils/logger');

const LOG_CTX = { service: 'passwordResetService' };

// OTP attempt limits: max attempts per identifier per window
const OTP_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const attemptMap = new Map(); // key -> { count, firstAt }

function getAttemptKey(identifier) {
    const t = String(identifier || '').trim().toLowerCase();
    const digits = t.replace(/\D/g, '');
    if (digits.length >= 9) return 'phone:' + normalizeSriLankaPhone(t) || digits;
    return 'id:' + t;
}

/**
 * Check and consume one OTP attempt. Returns error message if over limit.
 * @param {string} identifier
 * @returns {{ allowed: boolean, message?: string }}
 */
function checkOtpAttemptLimit(identifier) {
    const key = getAttemptKey(identifier);
    const now = Date.now();
    let rec = attemptMap.get(key);
    if (!rec) {
        rec = { count: 0, firstAt: now };
        attemptMap.set(key, rec);
    }
    if (now - rec.firstAt > OTP_ATTEMPT_WINDOW_MS) {
        rec.count = 0;
        rec.firstAt = now;
    }
    rec.count += 1;
    if (rec.count > OTP_MAX_ATTEMPTS) {
        logger.warn('Reset password: OTP attempt limit exceeded', { ...LOG_CTX, key });
        return {
            allowed: false,
            message: 'Too many attempts. Please try again later.'
        };
    }
    return { allowed: true };
}

function clearOtpAttempts(identifier) {
    const key = getAttemptKey(identifier);
    attemptMap.delete(key);
}

/**
 * Find active user by username, email, or phone (Sri Lanka formats).
 * @param {Function} executeQuery - (sql, params) => Promise<[rows]>
 * @param {string} identifier - username, email, or phone (0771234567, 771234567, +94771234567)
 * @returns {Promise<{ user: object } | { user: null, error?: string }>}
 */
async function findUserByIdentifier(executeQuery, identifier) {
    const trimmed = String(identifier || '').trim();
    const lower = trimmed.toLowerCase();
    const phoneVariants = isPhoneLike(trimmed) ? getSriLankaPhoneVariants(trimmed) : [];

    const conditions = ['username = ?', 'LOWER(TRIM(COALESCE(email, \'\'))) = ?'];
    const params = [trimmed, lower];

    if (phoneVariants.length > 0) {
        conditions.push(phoneVariants.map(() => 'phone = ?').join(' OR '));
        params.push(...phoneVariants);
    }

    const sql = `SELECT id, username, email, phone, is_active FROM users
                 WHERE is_active = TRUE AND (${conditions.join(' OR ')})`;

    try {
        const [rows] = await executeQuery(sql, params);
        if (rows && rows.length > 0) {
            return { user: rows[0] };
        }
        return { user: null };
    } catch (err) {
        logger.error('findUserByIdentifier error', { ...LOG_CTX, message: err.message });
        return { user: null, error: err.message };
    }
}

/**
 * Get stored OTP from in-memory store by trying multiple keys.
 * @param {Map} otpStore
 * @param {string[]} keys
 * @returns {{ stored: object | null, usedKey: string | null }}
 */
function getStoredOTP(otpStore, keys) {
    const uniq = [...new Set(keys)].filter(Boolean);
    for (const key of uniq) {
        const stored = otpStore.get(key);
        if (stored) return { stored, usedKey: key };
    }
    return { stored: null, usedKey: null };
}

/**
 * All possible OTP store keys for a user and the request identifier.
 */
function getOtpLookupKeys(user, identifier) {
    const keys = [];
    const userPhone = (user.phone || '').replace(/[\s\-\(\)]/g, '').trim();
    if (userPhone) keys.push(userPhone);

    if (isPhoneLike(identifier)) {
        keys.push(...getSriLankaPhoneVariants(identifier));
        keys.push(String(identifier).trim().replace(/[\s\-\(\)]/g, ''));
    }
    return [...new Set(keys)];
}

/**
 * Validate OTP and optionally delete from store (consume).
 * @param {Map} otpStore
 * @param {{ otp: string, expiresAt: number, userId: number }} stored
 * @param {string} otpInput
 * @param {string[]} keysToDelete - keys to remove from store after use
 * @returns {{ valid: boolean, message?: string }}
 */
function validateOtp(otpStore, stored, otpInput, keysToDelete) {
    if (!stored) {
        return { valid: false, message: 'Invalid or expired OTP. Please request a new one.' };
    }
    if (stored.expiresAt < Date.now()) {
        keysToDelete.forEach(k => otpStore.delete(k));
        return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }
    if (stored.otp !== String(otpInput).trim()) {
        return { valid: false, message: 'Invalid OTP.' };
    }
    return { valid: true };
}

/**
 * Hash password and update user. Does not clear OTP; controller does that.
 */
async function updatePassword(executeQuery, userId, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    await executeQuery(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [hash, userId]
    );
}

module.exports = {
    checkOtpAttemptLimit,
    clearOtpAttempts,
    findUserByIdentifier,
    getStoredOTP,
    getOtpLookupKeys,
    validateOtp,
    updatePassword,
    OTP_ATTEMPT_WINDOW_MS,
    OTP_MAX_ATTEMPTS
};
