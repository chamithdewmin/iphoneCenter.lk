-- Run against production DB to ensure products table has expected columns (e.g. base_price).
-- If columns are missing, run init.pg.sql or apply migrations.
-- Usage: psql "$DATABASE_URL" -f verify_products_columns.sql

SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'products'
 ORDER BY ordinal_position;
