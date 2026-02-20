-- ============================================
-- Create New Admin User
-- ============================================
-- Run this SQL query in your PostgreSQL database to create a new admin user
-- 
-- Username: newadmin
-- Password: Admin@2024
-- Email: newadmin@pos.com
-- Role: admin

INSERT INTO users (username, email, password_hash, full_name, role, branch_id, phone, is_active)
VALUES (
    'newadmin',
    'newadmin@pos.com',
    '$2b$10$ysoDlbq52DXd99/5CK4D9.225yR3ufxpw.6W75wu9f.wWtm3Y36Kq',
    'New Administrator',
    'admin',
    NULL,
    NULL,
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Verify the user was created:
-- SELECT id, username, email, full_name, role, is_active FROM users WHERE username = 'newadmin';
