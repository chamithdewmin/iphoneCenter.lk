-- ============================================
-- Verify PostgreSQL database has required tables (iphone center backend)
-- Run: psql "postgresql://USER:PASS@HOST:5432/DB" -f verify_tables.sql
-- Or from backend container: psql "$DATABASE_URL" -f database/verify_tables.sql
-- ============================================

\echo '=== 1. Connection test ==='
SELECT 1 AS ok;

\echo ''
\echo '=== 2. Required tables (must all exist) ==='
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'branches',
    'users',
    'refresh_tokens',
    'products',
    'branch_stock',
    'barcodes',
    'product_imeis',
    'stock_transfers',
    'customers',
    'sales',
    'sale_items',
    'payments',
    'refunds',
    'audit_logs'
  )
ORDER BY table_name;

\echo ''
\echo '=== 3. Missing tables (should be empty) ==='
SELECT unnest(ARRAY['branches','users','refresh_tokens','products','branch_stock','barcodes','product_imeis','stock_transfers','customers','sales','sale_items','payments','refunds','audit_logs']) AS required
EXCEPT
SELECT table_name::text
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  AND table_name IN ('branches','users','refresh_tokens','products','branch_stock','barcodes','product_imeis','stock_transfers','customers','sales','sale_items','payments','refunds','audit_logs');

\echo ''
\echo '=== 4. Row counts (need at least 1 branch and 1 user to add products) ==='
SELECT 'branches' AS tbl, COUNT(*) AS cnt FROM branches
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'barcodes', COUNT(*) FROM barcodes
UNION ALL SELECT 'branch_stock', COUNT(*) FROM branch_stock;

\echo ''
\echo '=== 5. Branches (id, name, is_active) ==='
SELECT id, name, code, is_active FROM branches ORDER BY id;

\echo ''
\echo '=== 6. Users (id, username, role, branch_id) ==='
SELECT id, username, role, branch_id FROM users WHERE is_active = TRUE ORDER BY id LIMIT 10;

\echo ''
\echo 'Done. If any required table is missing, run: psql ... -f init.pg.sql'
