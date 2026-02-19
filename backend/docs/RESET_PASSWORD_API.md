# Reset Password API – Production Guide

## Route

- **Method:** `POST`
- **Path:** `/api/auth/reset-password`
- **Auth:** None (public)

## Request body (JSON)

| Field           | Type   | Required | Description                                      |
|----------------|--------|----------|--------------------------------------------------|
| `username`     | string | Yes      | Username, email, or phone (Sri Lanka formats)   |
| `otp`          | string | Yes      | 6-digit OTP from forgot-password flow           |
| `newPassword`  | string | Yes      | Min 6 characters                                |
| `confirmPassword` | string | Yes   | Must match `newPassword`                         |

## Phone formats supported (Sri Lanka)

- `0771234567`
- `771234567`
- `+94771234567`
- `94771234567`

All are normalized automatically for user lookup.

## Responses

**Success (200)**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Validation / invalid request (400)**

```json
{
  "success": false,
  "message": "Username, email, or phone is required"
}
```

```json
{
  "success": false,
  "message": "Invalid request. Check your details and OTP, or request a new OTP."
}
```

**Too many attempts (429)**

```json
{
  "success": false,
  "message": "Too many attempts. Please try again later."
}
```

**Server error (500)**

```json
{
  "success": false,
  "message": "Database error. Please try again later."
}
```

## Express route setup (authRoutes.js)

```javascript
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { handleValidationErrors } = require('../middleware/validate');

router.post('/reset-password', [
    body('username').trim().notEmpty().withMessage('Username, email, or phone is required'),
    body('otp').trim().notEmpty().withMessage('OTP is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], handleValidationErrors, authController.resetPasswordWithOTP);
```

## App mounting (server.js)

```javascript
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Rate limit for reset-password (recommended)
const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many reset attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth/reset-password', resetPasswordLimiter);
```

## cURL test

```bash
# Replace BASE_URL and values as needed
BASE_URL="https://backend.iphonecenter.lk"

curl -X POST "${BASE_URL}/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "741525537",
    "otp": "123456",
    "newPassword": "12345678",
    "confirmPassword": "12345678"
  }'
```

With phone in other formats:

```bash
curl -X POST "${BASE_URL}/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"username":"0771234567","otp":"123456","newPassword":"newpass123","confirmPassword":"newpass123"}'
```

## Security

- **Bcrypt:** Passwords hashed with bcrypt (cost 10) before storing.
- **OTP:** Deleted from store after successful use or on expiry.
- **User enumeration:** Same generic message for “user not found” and “invalid/expired OTP”.
- **Rate limiting:** 10 requests per 15 minutes per IP for `/api/auth/reset-password`.
- **OTP attempt limit:** 5 failed OTP attempts per identifier per 15 minutes (in-memory).

## Database

- **users:** `id`, `username`, `email`, `phone`, `password_hash`, `is_active`, etc.
- **password_resets (optional):** Table exists for future DB-backed OTP; current implementation uses in-memory OTP store.

## Files

- `controllers/authController.js` – `resetPasswordWithOTP`
- `services/passwordResetService.js` – find user, OTP validation, update password, attempt limits
- `utils/phoneUtils.js` – Sri Lanka phone normalization and variants
