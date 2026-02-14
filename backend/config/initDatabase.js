const path = require('path');
const fs = require('fs');
const { pool } = require('./database');
const logger = require('../utils/logger');

const MAX_CONNECT_RETRIES = 15;
const CONNECT_RETRY_DELAY_MS = 2000;

/**
 * Wait for database to be reachable (e.g. PostgreSQL container may start after backend).
 */
async function waitForDb() {
    for (let i = 0; i < MAX_CONNECT_RETRIES; i++) {
        try {
            await pool.query('SELECT 1');
            return;
        } catch (err) {
            if (i === 0) {
                console.log('Waiting for database...');
                logger.warn('Database not ready, retrying...', { message: err.message });
            }
            if (i === MAX_CONNECT_RETRIES - 1) throw err;
            await new Promise((r) => setTimeout(r, CONNECT_RETRY_DELAY_MS));
        }
    }
}

/**
 * Split SQL into single statements (pg runs one statement per query).
 * Handles $$ ... $$ blocks so we don't split on semicolons inside them.
 */
function splitSqlStatements(sql) {
    const statements = [];
    let current = '';
    let i = 0;
    let inDollar = false;
    while (i < sql.length) {
        if (sql.substr(i, 2) === '$$') {
            current += '$$';
            inDollar = !inDollar;
            i += 2;
            continue;
        }
        if (!inDollar && sql[i] === ';') {
            const st = current.trim();
            if (st && !st.startsWith('--')) {
                statements.push(st + ';');
            }
            current = '';
            i++;
            continue;
        }
        current += sql[i];
        i++;
    }
    const last = current.trim();
    if (last && !last.startsWith('--')) {
        statements.push(last + (last.endsWith(';') ? '' : ';'));
    }
    return statements;
}

/**
 * Run idempotent schema (init.pg.sql) to create all tables if they don't exist.
 * Safe to run on every startup. Throws if init file missing or init fails.
 */
async function initDatabase() {
    await waitForDb();

    const sqlPath = path.join(__dirname, '../database/init.pg.sql');
    if (!fs.existsSync(sqlPath)) {
        const msg = 'init.pg.sql not found at ' + sqlPath + ' – cannot auto-create tables';
        logger.error(msg);
        console.error('❌ ' + msg);
        throw new Error(msg);
    }

    console.log('Running database init (creating tables if missing)...');
    logger.info('Running database init');

    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = splitSqlStatements(sql);
    try {
        for (const statement of statements) {
            if (!statement.trim()) continue;
            await pool.query(statement);
        }
    } catch (err) {
        logger.error('Database init error:', { message: err.message, code: err.code });
        console.error('❌ Database init error:', err.message);
        throw err;
    }

    // Verify key table exists
    const { rows } = await pool.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users' LIMIT 1"
    );
    if (!rows || rows.length === 0) {
        const msg = 'Database init ran but "users" table is missing – check init.pg.sql and logs';
        logger.error(msg);
        console.error('❌ ' + msg);
        throw new Error(msg);
    }

    logger.info('Database init completed (tables/triggers ready)');
    console.log('✅ Database init completed (tables ready)');
}

module.exports = { initDatabase };
