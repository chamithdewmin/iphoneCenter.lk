-- ============================================
-- Check all database tables (PostgreSQL)
-- Run in any client: psql "$DATABASE_URL" -f check_tables_plain.sql
-- No \echo commands - works in pgAdmin, DBeaver, etc.
-- ============================================

-- 1. List all tables in public schema
SELECT '========== 1. List all tables ==========' AS info;
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_type = 'BASE TABLE'
 ORDER BY table_name;

-- 2. Expected tables status (OK or MISSING)
SELECT '========== 2. Expected tables status ==========' AS info;
WITH expected(tab) AS (
  VALUES
    ('audit_logs'),
    ('barcodes'),
    ('branch_stock'),
    ('branches'),
    ('brands'),
    ('categories'),
    ('customers'),
    ('password_resets'),
    ('payments'),
    ('product_imeis'),
    ('products'),
    ('refunds'),
    ('refresh_tokens'),
    ('sale_items'),
    ('sales'),
    ('stock_transfers'),
    ('user_login_logs'),
    ('users')
),
actual AS (
  SELECT table_name AS tab
    FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
)
SELECT e.tab AS table_name,
       CASE WHEN a.tab IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status
  FROM expected e
  LEFT JOIN actual a ON a.tab = e.tab
 ORDER BY e.tab;

-- 3. Row count per table
SELECT '========== 3. Row count per table ==========' AS info;
SELECT relname AS table_name,
       n_live_tup AS row_count
  FROM pg_stat_user_tables
 WHERE schemaname = 'public'
 ORDER BY relname;

-- 4. Columns per table (summary)
SELECT '========== 4. Columns per table ==========' AS info;
SELECT table_name,
       string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) AS columns
  FROM information_schema.columns
 WHERE table_schema = 'public'
 GROUP BY table_name
 ORDER BY table_name;
