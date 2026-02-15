/**
 * Resolve effective user id for DB foreign keys.
 * Test/demo login uses id 0, which does not exist in users table; use first active user instead.
 */
async function getEffectiveUserId(connection, userId) {
    if (userId != null && userId !== 0) return userId;
    const [rows] = await connection.execute(
        'SELECT id FROM users WHERE is_active = TRUE ORDER BY id LIMIT 1',
        []
    );
    if (!rows || rows.length === 0) return null;
    return rows[0].id;
}

module.exports = { getEffectiveUserId };
