const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
const logger = require('../utils/logger');

const MAX_CONNECT_RETRIES = 15;
const CONNECT_RETRY_DELAY_MS = 2000;

function getConnectionString() {
    return process.env.DATABASE_URL || (process.env.DB_HOST ? (
        `postgresql://${encodeURIComponent(process.env.DB_USER || 'postgres')}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'pos_system'}`
    ) : null) || 'postgresql://localhost:5432/pos_system';
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
 * Auto-run schema on start: first deploy → create all tables; future deploy → skip (IF NOT EXISTS).
 * Uses a dedicated Client, then closes it. Run this before starting the server.
 */
async function applySchema() {
    const connectionString = getConnectionString();
    let client = new Client({ connectionString });

    // Wait for DB to be reachable (e.g. first deploy when Postgres starts after backend)
    for (let i = 0; i < MAX_CONNECT_RETRIES; i++) {
        try {
            await client.connect();
            break;
        } catch (err) {
            if (i === 0) {
                console.log('Waiting for database...');
                logger.warn('Database not ready, retrying...', { message: err.message });
            }
            await client.end().catch(() => {});
            if (i === MAX_CONNECT_RETRIES - 1) throw err;
            await new Promise((r) => setTimeout(r, CONNECT_RETRY_DELAY_MS));
            client = new Client({ connectionString });
        }
    }

    const sqlPath = path.join(__dirname, '../database/init.pg.sql');
    if (!fs.existsSync(sqlPath)) {
        const msg = 'init.pg.sql not found at ' + sqlPath + ' – cannot auto-create tables';
        logger.error(msg);
        console.error('❌ ' + msg);
        await client.end();
        throw new Error(msg);
    }

    console.log('Running database init: first deploy → create tables, future deploy → skip (IF NOT EXISTS)');
    logger.info('Applying schema (auto-run on start)');

    const schema = fs.readFileSync(sqlPath, 'utf8');
    const statements = splitSqlStatements(schema);

    try {
        for (const statement of statements) {
            if (!statement.trim()) continue;
            await client.query(statement);
        }
    } catch (err) {
        logger.error('Database init error:', { message: err.message, code: err.code });
        console.error('❌ Database init error:', err.message);
        await client.end();
        throw err;
    }

    const { rows } = await client.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users' LIMIT 1"
    );
    await client.end();

    if (!rows || rows.length === 0) {
        const msg = 'Schema ran but "users" table is missing – check init.pg.sql';
        logger.error(msg);
        console.error('❌ ' + msg);
        throw new Error(msg);
    }

    logger.info('Database init completed (tables/triggers ready)');
    console.log('✅ Database init completed (tables ready)');
}

module.exports = { applySchema, initDatabase: applySchema };
