const path = require('path');
const fs = require('fs');
const { pool } = require('./database');
const logger = require('../utils/logger');

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
 * Safe to run on every startup.
 */
async function initDatabase() {
    const sqlPath = path.join(__dirname, '../database/init.pg.sql');
    if (!fs.existsSync(sqlPath)) {
        logger.warn('init.pg.sql not found, skipping auto-init');
        return;
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = splitSqlStatements(sql);
    try {
        for (const statement of statements) {
            if (!statement.trim()) continue;
            await pool.query(statement);
        }
        logger.info('Database init completed (tables/triggers ready)');
        console.log('✅ Database init completed (tables ready)');
    } catch (err) {
        logger.error('Database init error:', { message: err.message, code: err.code });
        console.error('❌ Database init error:', err.message);
        throw err;
    }
}

module.exports = { initDatabase };
