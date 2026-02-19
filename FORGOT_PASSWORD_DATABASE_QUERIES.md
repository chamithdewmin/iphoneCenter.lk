# Forgot Password Feature - Database Queries

This document contains all database queries used in the forgot password feature.

## Table Schema

### Users Table Structure
```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),  -- Phone number column for OTP
    role user_role NOT NULL DEFAULT 'cashier',
    branch_id INT NULL REFERENCES branches(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Add Phone Column (for existing databases)
```sql
-- PostgreSQL
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN phone VARCHAR(20);
EXCEPTION WHEN duplicate_column THEN NULL; 
END $$;

-- MySQL (alternative)
ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER full_name;
```

### Index on Phone Column (for better query performance)
```sql
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
```

---

## 1. Request OTP - Find User by Phone Number

### Main Query
```sql
SELECT 
    id, 
    username, 
    email, 
    full_name, 
    phone, 
    role, 
    is_active 
FROM users 
WHERE phone = ? 
AND is_active = TRUE
```

**Parameters:**
- `?` = normalized phone number (spaces, dashes, parentheses removed)

**Example:**
```sql
SELECT 
    id, 
    username, 
    email, 
    full_name, 
    phone, 
    role, 
    is_active 
FROM users 
WHERE phone = '94771234567' 
AND is_active = TRUE;
```

**Purpose:** Find active user account by phone number to send OTP.

---

## 2. Reset Password - Verify User Exists

### Query
```sql
SELECT 
    id, 
    username, 
    is_active 
FROM users 
WHERE id = ? 
AND is_active = TRUE
```

**Parameters:**
- `?` = user ID from OTP store

**Example:**
```sql
SELECT 
    id, 
    username, 
    is_active 
FROM users 
WHERE id = 1 
AND is_active = TRUE;
```

**Purpose:** Verify user still exists and is active before resetting password.

---

## 3. Reset Password - Update Password Hash

### Query
```sql
UPDATE users 
SET password_hash = ?, 
    updated_at = NOW() 
WHERE id = ?
```

**Parameters:**
- `?` (first) = bcrypt hashed password
- `?` (second) = user ID

**Example:**
```sql
UPDATE users 
SET password_hash = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890', 
    updated_at = NOW() 
WHERE id = 1;
```

**Purpose:** Update user's password after OTP verification.

---

## 4. Utility Queries

### Check if Phone Column Exists
```sql
-- PostgreSQL
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'phone';

-- MySQL
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'users' 
AND column_name = 'phone';
```

### Find All Users with Phone Numbers
```sql
SELECT 
    id, 
    username, 
    email, 
    full_name, 
    phone, 
    role, 
    is_active 
FROM users 
WHERE phone IS NOT NULL 
AND phone != '' 
ORDER BY id;
```

### Find Users Without Phone Numbers
```sql
SELECT 
    id, 
    username, 
    email, 
    full_name, 
    phone, 
    role, 
    is_active 
FROM users 
WHERE phone IS NULL 
OR phone = '' 
ORDER BY id;
```

### Find User by Specific Phone Number
```sql
SELECT 
    id, 
    username, 
    email, 
    full_name, 
    phone, 
    role, 
    is_active 
FROM users 
WHERE phone = '94771234567';
```

### Update User Phone Number
```sql
UPDATE users 
SET phone = ?, 
    updated_at = NOW() 
WHERE id = ?;
```

**Example:**
```sql
UPDATE users 
SET phone = '94771234567', 
    updated_at = NOW() 
WHERE id = 1;
```

### Add Phone Number to User
```sql
UPDATE users 
SET phone = '94771234567', 
    updated_at = NOW() 
WHERE username = 'john_doe' 
AND phone IS NULL;
```

### Check User Account Status
```sql
SELECT 
    id, 
    username, 
    email, 
    phone, 
    role, 
    is_active 
FROM users 
WHERE phone = '94771234567' 
AND is_active = TRUE 
AND role IS NOT NULL;
```

---

## 5. Testing Queries

### Test Phone Number Format Normalization
```sql
-- Test with different phone formats
SELECT 
    id, 
    username, 
    phone,
    REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', '') as normalized_phone
FROM users 
WHERE phone IS NOT NULL 
LIMIT 10;
```

### Count Users with Phone Numbers by Role
```sql
SELECT 
    role, 
    COUNT(*) as total_users,
    COUNT(phone) as users_with_phone,
    COUNT(*) - COUNT(phone) as users_without_phone
FROM users 
GROUP BY role;
```

### Find Active Users Ready for Password Reset
```sql
SELECT 
    id, 
    username, 
    email, 
    phone, 
    role, 
    is_active 
FROM users 
WHERE phone IS NOT NULL 
AND phone != '' 
AND is_active = TRUE 
AND role IS NOT NULL;
```

---

## 6. Error Handling Queries

### Check for Missing Phone Column (PostgreSQL)
```sql
-- This query will fail if phone column doesn't exist
SELECT phone FROM users LIMIT 1;
```

**Error Code:** `42703` (PostgreSQL) or `42S22` (MySQL) - column does not exist

### Fallback Query (if phone column missing)
```sql
SELECT 
    id, 
    username, 
    email, 
    full_name 
FROM users 
WHERE username = ? 
OR email = ? 
AND is_active = TRUE;
```

---

## 7. Security Queries

### Verify Account Before Password Reset
```sql
SELECT 
    id, 
    username, 
    is_active, 
    role 
FROM users 
WHERE id = ? 
AND is_active = TRUE 
AND role IS NOT NULL;
```

### Check if Multiple Users Have Same Phone
```sql
SELECT 
    phone, 
    COUNT(*) as user_count,
    GROUP_CONCAT(username) as usernames
FROM users 
WHERE phone IS NOT NULL 
AND phone != '' 
GROUP BY phone 
HAVING COUNT(*) > 1;
```

---

## Notes

1. **Phone Number Normalization:** The application normalizes phone numbers by removing spaces, dashes, and parentheses before querying.

2. **OTP Storage:** OTPs are stored in memory (not database) using a Map with phone number as key.

3. **Security:** 
   - Only active users (`is_active = TRUE`) can reset passwords
   - Users must have a role assigned
   - Phone numbers are validated before querying

4. **Indexes:** Consider adding an index on `phone` column for better query performance:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
   ```

5. **Phone Format:** The system accepts phone numbers in various formats but stores/compares normalized versions (digits only, with country code).

---

## Complete Flow Example

```sql
-- Step 1: Request OTP - Find user
SELECT id, username, email, full_name, phone, role, is_active 
FROM users 
WHERE phone = '94771234567' 
AND is_active = TRUE;

-- Step 2: Reset Password - Verify user still exists
SELECT id, username, is_active 
FROM users 
WHERE id = 1 
AND is_active = TRUE;

-- Step 3: Update password
UPDATE users 
SET password_hash = '$2a$10$...', 
    updated_at = NOW() 
WHERE id = 1;
```
