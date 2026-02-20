#!/usr/bin/env node
/**
 * Check all database tables exist and show summary.
 * Uses same DATABASE_URL / DB_* env as the backend.
 *
 * Run from backend folder: node database/check_tables.js
 * Or: npm run db:check  (if script is added to package.json)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/database');

const EXPECTED_TABLES = [
  'audit_logs', 'barcodes', 'branch_stock', 'branches', 'brands', 'categories',
  'customers', 'password_resets', 'payments', 'product_imeis', 'products',
  'refunds', 'refresh_tokens', 'sale_items', 'sales', 'stock_transfers',
  'user_login_logs', 'users'
];

async function main() {
  const client = await pool.connect();
  try {
    console.log('========== 1. Tables in public schema ==========\n');
    const { rows: tables } = await client.query(`
      SELECT table_name
        FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name
    `);
    tables.forEach((r) => console.log('  ', r.table_name));
    console.log('  Total:', tables.length, 'tables\n');

    console.log('========== 2. Expected tables status ==========\n');
    const existing = new Set(tables.map((r) => r.table_name));
    let allOk = true;
    for (const tab of EXPECTED_TABLES) {
      const status = existing.has(tab) ? 'OK' : 'MISSING';
      if (status === 'MISSING') allOk = false;
      console.log('  ', tab.padEnd(22), status);
    }
    console.log('\n  Result:', allOk ? 'All expected tables present.' : 'Some tables are MISSING.\n');

    console.log('========== 3. Row counts ==========\n');
    const { rows: counts } = await client.query(`
      SELECT relname AS table_name, n_live_tup AS row_count
        FROM pg_stat_user_tables
       WHERE schemaname = 'public'
       ORDER BY relname
    `);
    counts.forEach((r) => console.log('  ', r.table_name.padEnd(22), r.row_count));
    console.log('');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
