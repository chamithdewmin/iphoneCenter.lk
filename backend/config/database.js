const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pos_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection error:', err.message);
    });

// Helper function to execute queries with transaction support
// Returns [rows] so that const [rows] = await executeQuery(...) gives the rows array
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return [results];
    } catch (error) {
        console.error('Query execution error:', error);
        throw error;
    }
};

// Helper function to get a connection for transactions
const getConnection = async () => {
    return await pool.getConnection();
};

module.exports = {
    pool,
    executeQuery,
    getConnection
};
