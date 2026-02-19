/**
 * Phone number utilities for Sri Lanka (+94).
 * Normalizes various formats to a canonical form and generates lookup variants.
 */

const SRI_LANKA_COUNTRY_CODE = '94';
const MIN_DIGITS = 9;
const MAX_DIGITS = 12;

/**
 * Strip all non-digit characters from a string.
 * @param {string} input
 * @returns {string}
 */
function digitsOnly(input) {
    if (input == null || typeof input !== 'string') return '';
    return input.replace(/\D/g, '');
}

/**
 * Normalize Sri Lanka phone to base digits (no country/leading zero).
 * Examples: 0771234567, +94771234567, 771234567 -> "771234567"
 * @param {string} input - Raw phone (e.g. "0771234567", "+94771234567", "771234567")
 * @returns {string} - 9-digit base number or empty string
 */
function normalizeSriLankaPhone(input) {
    const digits = digitsOnly(input);
    if (digits.length < MIN_DIGITS) return '';
    // Strip leading 94 or 0
    const base = digits.replace(/^(94|0)+/, '') || digits;
    if (base.length < MIN_DIGITS || base.length > MAX_DIGITS) return '';
    return base;
}

/**
 * Check if string looks like a phone number (enough digits).
 * @param {string} input
 * @returns {boolean}
 */
function isPhoneLike(input) {
    if (input == null || typeof input !== 'string') return false;
    return digitsOnly(input).length >= MIN_DIGITS;
}

/**
 * Get all common variants for DB/lookup (Sri Lanka formats).
 * Use when querying users.phone or matching OTP store keys.
 * @param {string} input - Any format: 0771234567, 771234567, +94771234567
 * @returns {string[]} - Unique variants, e.g. ["771234567", "0771234567", "94771234567", "+94771234567"]
 */
function getSriLankaPhoneVariants(input) {
    const d = digitsOnly(input);
    if (d.length < MIN_DIGITS) return [];

    const base = d.replace(/^(94|0)+/, '') || d;
    if (base.length < MIN_DIGITS) return [];

    const variants = [
        base,
        '0' + base,
        SRI_LANKA_COUNTRY_CODE + base,
        '+' + SRI_LANKA_COUNTRY_CODE + base
    ];
    return [...new Set(variants)];
}

/**
 * Normalize for consistent storage (recommended: 9-digit base or 94 + 9 digits).
 * @param {string} input
 * @returns {string} - "94771234567" for storage/SMS
 */
function toE164SriLanka(input) {
    const base = normalizeSriLankaPhone(input);
    if (!base) return '';
    return SRI_LANKA_COUNTRY_CODE + base;
}

module.exports = {
    digitsOnly,
    normalizeSriLankaPhone,
    isPhoneLike,
    getSriLankaPhoneVariants,
    toE164SriLanka,
    SRI_LANKA_COUNTRY_CODE,
    MIN_DIGITS,
    MAX_DIGITS
};
