#!/usr/bin/env node
/**
 * One-off database schema initializer / migration runner.
 *
 * This uses the same DATABASE_URL / DB_* env vars as the backend and
 * executes database/init.pg.sql via config/initDatabase.applySchema().
 *
 * Usage (from backend folder):
 *   node database/applySchema.js
 *
 * Recommended:
 *   Add an npm script in package.json:
 *     "db:init": "node database/applySchema.js"
 *
 * IMPORTANT: This is now decoupled from server startup.
 * Your server no longer auto-runs schema on boot; run this script
 * manually or from CI/CD when deploying schema changes.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function main() {
  const { applySchema } = require('../config/initDatabase');
  console.log('Running database schema init/migration from database/init.pg.sql ...');
  await applySchema();
  console.log('✅ Schema init/migration completed successfully.');
}

main().catch((err) => {
  console.error('❌ Schema init/migration failed:', err.message);
  console.error(err.stack || '');
  process.exit(1);
});

