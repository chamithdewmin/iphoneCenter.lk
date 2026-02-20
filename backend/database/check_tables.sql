-- ============================================
-- Check all database tables (PostgreSQL)
-- Run: psql "postgresql://USER:PASS@HOST:5432/DB" -f check_tables.sql
-- Or with env: psql "$DATABASE_URL" -f check_tables.sql
-- ============================================

\echo '========== 1. List all tables in public schema =========='
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_type = 'BASE TABLE'
 ORDER BY table_name;

\echo ''
\echo '========== 2. Expected tables (should all exist) =========='
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

\echo ''
\echo '========== 3. Row count per table =========='
SELECT relname AS table_name,
       n_live_tup AS row_count
  FROM pg_stat_user_tables
 WHERE schemaname = 'public'
 ORDER BY relname;

\echo ''
\echo '========== 4. Columns per table (summary) =========='
SELECT table_name,
       string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) AS columns
  FROM information_schema.columns
 WHERE table_schema = 'public'
 GROUP BY table_name
 ORDER BY table_name;
