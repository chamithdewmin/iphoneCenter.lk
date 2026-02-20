const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL (e.g. postgresql://user:pass@host:5432/dbname) or separate env vars
// dotenv is loaded in server.js before this; ensure env is loaded
require('dotenv').config();
const connectionString = process.env.DATABASE_URL || (process.env.DB_HOST ? (
    `postgresql://${encodeURIComponent(process.env.DB_USER || 'postgres')}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'pos_system'}`
) : null);

if (!connectionString) {
    console.warn('⚠️ DATABASE_URL or DB_* env vars not set. Set DATABASE_URL so the database is not undefined.');
}

const pool = new Pool({
    connectionString: connectionString || 'postgresql://localhost:5432/pos_system',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Convert MySQL-style ? placeholders to PostgreSQL $1, $2, ...
function toPgPlaceholders(query) {
    let i = 0;
    return query.replace(/\?/g, () => `$${++i}`);
}

// Test connection
pool.query('SELECT 1')
    .then(() => console.log('✅ Database connected successfully'))
    .catch((err) => console.error('❌ Database connection error:', err.message));

/**
 * Execute a query. Returns [rows] so that const [rows] = await executeQuery(...) gives the rows array.
 * Query can use ? placeholders (converted to $1, $2, ...).
 */
const executeQuery = async (query, params = []) => {
    try {
        const pgQuery = toPgPlaceholders(query);
        const result = await pool.query(pgQuery, params);
        return [result.rows];
    } catch (error) {
        console.error('Query execution error:', error);
        throw error;
    }
};

/**
 * Get a connection wrapper for transactions. API compatible with mysql2-style usage:
 * beginTransaction(), execute(query, params), commit(), rollback(), release()
 */
const getConnection = async () => {
    const client = await pool.connect();

    const execute = async (query, params = []) => {
        const pgQuery = toPgPlaceholders(query);
        const result = await client.query(pgQuery, params);
        // Return [data] compatible with mysql2: SELECT -> [rows array], INSERT/UPDATE/DELETE -> [{ insertId?, affectedRows, rows? }]
        if (result.command === 'SELECT') {
            return [result.rows];
        }
        const out = { 
            affectedRows: result.rowCount ?? 0,
            rows: result.rows // Include rows for RETURNING clause support
        };
        if (result.rows && result.rows[0] && typeof result.rows[0].id !== 'undefined') {
            out.insertId = result.rows[0].id;
        }
        return [out];
    };

    return {
        beginTransaction: () => client.query('BEGIN'),
        execute,
        commit: () => client.query('COMMIT'),
        rollback: () => client.query('ROLLBACK'),
        // Return a Promise so callers can use release().catch(...); pg's client.release() is void
        release: () => Promise.resolve(client.release()),
    };
};

module.exports = {
    pool,
    executeQuery,
    getConnection,
};
