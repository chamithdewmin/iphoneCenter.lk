-- ============================================
-- SQL Query to Add New User
-- ============================================
-- Replace the values below with your desired username, email, password_hash, full_name, role, and branch_id
-- 
-- To generate password_hash:
-- 1. Use Node.js: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YOUR_PASSWORD', 10));"
-- 2. Or use the bcrypt CLI: npx bcryptjs YOUR_PASSWORD
-- 3. Or run the generate_hash.js script in the backend folder
--
-- Roles: 'admin', 'manager', 'cashier', 'staff'
-- branch_id: NULL for admin, or use a valid branch ID from branches table

INSERT INTO users (username, email, password_hash, full_name, role, branch_id, phone, is_active)
VALUES (
    'newuser',                                    -- username (must be unique)
    'newuser@example.com',                        -- email (must be unique)
    '$2a$10$YOUR_PASSWORD_HASH_HERE',            -- password_hash (generate using bcrypt)
    'New User Full Name',                         -- full_name
    'cashier',                                    -- role: 'admin', 'manager', 'cashier', or 'staff'
    NULL,                                         -- branch_id (NULL for admin, or branch ID number)
    '+1234567890',                                -- phone (optional, can be NULL)
    TRUE                                          -- is_active (default: TRUE)
)
ON CONFLICT (username) DO NOTHING;               -- Prevents error if username already exists

-- Example: Add a manager user
-- INSERT INTO users (username, email, password_hash, full_name, role, branch_id, phone, is_active)
-- VALUES (
--     'manager1',
--     'manager1@pos.com',
--     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- Password: Admin@123
--     'Manager One',
--     'manager',
--     1,  -- Assuming branch ID 1 exists
--     '+1234567890',
--     TRUE
-- )
-- ON CONFLICT (username) DO NOTHING;

-- Example: Add a cashier user
-- INSERT INTO users (username, email, password_hash, full_name, role, branch_id, phone, is_active)
-- VALUES (
--     'cashier1',
--     'cashier1@pos.com',
--     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- Password: Admin@123
--     'Cashier One',
--     'cashier',
--     1,  -- Assuming branch ID 1 exists
--     NULL,
--     TRUE
-- )
-- ON CONFLICT (username) DO NOTHING;
