-- Remove test/demo user from the database.
-- Related rows in refresh_tokens, user_login_logs, password_resets are removed automatically (ON DELETE CASCADE).

DELETE FROM users
WHERE email = 'test@demo.local'
   OR (full_name ILIKE '%Test User%' AND email ILIKE '%@demo.local%');
