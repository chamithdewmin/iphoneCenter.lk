-- Run this file inside PostgreSQL to create user_login_logs table.
-- From host: psql "postgresql://USER:PASS@HOST:5432/IphoneCenterDB" -f add_user_login_logs.sql
-- Or inside container: copy file in then: psql -U Iphone_Center -d IphoneCenterDB -f add_user_login_logs.sql

-- User login/logout logs table
CREATE TABLE IF NOT EXISTS user_login_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_duration_seconds INTEGER NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_login_time ON user_login_logs(login_time);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_logout_time ON user_login_logs(logout_time);
