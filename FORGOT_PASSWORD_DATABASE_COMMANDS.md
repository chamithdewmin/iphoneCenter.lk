# Forgot Password - Database Commands

## Users Table Structure

The `users` table has the following structure:

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),                    -- Phone number field (can be NULL)
    role user_role NOT NULL DEFAULT 'cashier',
    branch_id INT NULL REFERENCES branches(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## SQL Commands to Find Phone Numbers

### 1. View All Users with Phone Numbers

```sql
SELECT id, username, email, full_name, phone, role, is_active
FROM users
ORDER BY id;
```

### 2. Find Users Who Have Phone Numbers

```sql
SELECT id, username, email, full_name, phone, role
FROM users
WHERE phone IS NOT NULL AND phone != ''
ORDER BY full_name;
```

### 3. Find Users Without Phone Numbers

```sql
SELECT id, username, email, full_name, role
FROM users
WHERE phone IS NULL OR phone = ''
ORDER BY full_name;
```

### 4. Find User by Username/Email and Get Phone

```sql
-- By username
SELECT id, username, email, full_name, phone, role
FROM users
WHERE username = 'your_username_here';

-- By email
SELECT id, username, email, full_name, phone, role
FROM users
WHERE email = 'user@example.com';

-- By username OR email (for forgot password lookup)
SELECT id, username, email, full_name, phone, role
FROM users
WHERE (username = 'your_username' OR email = 'your_email@example.com')
  AND is_active = TRUE;
```

### 5. Search Users by Phone Number

```sql
SELECT id, username, email, full_name, phone, role
FROM users
WHERE phone LIKE '%0771234567%'
ORDER BY full_name;
```

### 6. Count Users with/without Phone Numbers

```sql
-- Total users
SELECT COUNT(*) as total_users FROM users;

-- Users with phone numbers
SELECT COUNT(*) as users_with_phone
FROM users
WHERE phone IS NOT NULL AND phone != '';

-- Users without phone numbers
SELECT COUNT(*) as users_without_phone
FROM users
WHERE phone IS NULL OR phone = '';
```

## SQL Commands to Update Phone Numbers

### 1. Add/Update Phone Number for a User

```sql
-- Update by user ID
UPDATE users
SET phone = '947712345678', updated_at = NOW()
WHERE id = 1;

-- Update by username
UPDATE users
SET phone = '947712345678', updated_at = NOW()
WHERE username = 'john_doe';

-- Update by email
UPDATE users
SET phone = '947712345678', updated_at = NOW()
WHERE email = 'john@example.com';
```

### 2. Update Multiple Users' Phone Numbers

```sql
-- Example: Update phone for multiple users
UPDATE users
SET phone = '947712345678', updated_at = NOW()
WHERE id IN (1, 2, 3);
```

### 3. Remove Phone Number (Set to NULL)

```sql
UPDATE users
SET phone = NULL, updated_at = NOW()
WHERE id = 1;
```

## Phone Number Format

The phone number should be stored in one of these formats:
- `947712345678` (with country code, no + sign)
- `07712345678` (local format starting with 0)
- `+947712345678` (with + sign)

The SMS service will automatically format it to `+947712345678` when sending SMS.

## Example: Complete User Lookup for Forgot Password

```sql
-- This is what the backend does when user requests password reset
SELECT id, username, email, full_name, phone
FROM users
WHERE (username = 'test_user' OR email = 'test@example.com')
  AND is_active = TRUE;

-- If phone exists, OTP will be sent
-- If phone is NULL or empty, error will be returned
```

## PostgreSQL Specific Commands

If using PostgreSQL, you can also use:

```sql
-- Check if phone column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'phone';

-- Add phone column if it doesn't exist (for existing databases)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
```

## Testing Commands

### Test User Lookup (Simulating Forgot Password)

```sql
-- Replace 'test' with actual username/email
SELECT 
    id,
    username,
    email,
    full_name,
    phone,
    CASE 
        WHEN phone IS NULL OR phone = '' THEN 'NO_PHONE'
        ELSE 'HAS_PHONE'
    END as phone_status
FROM users
WHERE (username = 'test' OR email = 'test')
  AND is_active = TRUE;
```

### Verify Phone Numbers Format

```sql
-- Check phone number formats
SELECT 
    id,
    username,
    phone,
    LENGTH(phone) as phone_length,
    CASE 
        WHEN phone LIKE '94%' THEN 'Has country code'
        WHEN phone LIKE '0%' THEN 'Local format'
        WHEN phone LIKE '+%' THEN 'Has + sign'
        ELSE 'Other format'
    END as format_type
FROM users
WHERE phone IS NOT NULL AND phone != ''
ORDER BY id;
```
