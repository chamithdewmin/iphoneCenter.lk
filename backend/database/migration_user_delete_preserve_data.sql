-- Migration: When a user is deleted, keep related data (login logs, sales, stock transfers, payments, audit).
-- Only the user row and their refresh_tokens are removed. Other tables get user_id set to NULL.
-- Run this once on your existing database (e.g. IphoneCenterDB).

-- 1. user_login_logs: keep history, set user_id to NULL when user is deleted
ALTER TABLE user_login_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE user_login_logs DROP CONSTRAINT IF EXISTS user_login_logs_user_id_fkey;
ALTER TABLE user_login_logs ADD CONSTRAINT user_login_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 2. sales: keep sales data, set user_id to NULL when user is deleted
ALTER TABLE sales ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_user_id_fkey;
ALTER TABLE sales ADD CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3. stock_transfers: keep transfer records, set requested_by to NULL when user is deleted
ALTER TABLE stock_transfers ALTER COLUMN requested_by DROP NOT NULL;
ALTER TABLE stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_requested_by_fkey;
ALTER TABLE stock_transfers ADD CONSTRAINT stock_transfers_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL;

-- 4. payments: keep payment records, set created_by to NULL when user is deleted
ALTER TABLE payments ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_created_by_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
