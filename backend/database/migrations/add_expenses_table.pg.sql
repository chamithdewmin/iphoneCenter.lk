-- ============================================
-- Add expenses table with branch_id (PostgreSQL)
-- ============================================
-- Run when you want to store expenses in the database instead of localStorage.
-- Example: psql "postgresql://USER:PASS@HOST:5432/DB" -f backend/database/migrations/add_expenses_table.pg.sql

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    branch_id INT NULL REFERENCES branches(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

COMMENT ON TABLE expenses IS 'Business expenses; branch_id optional (NULL = no branch). When a branch is deleted, branch_id is set to NULL.';
