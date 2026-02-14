const { executeQuery, getConnection } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all customers
 */
const getAllCustomers = async (req, res, next) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM customers WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY name ASC';

        const [customers] = await executeQuery(query, params);

        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        logger.error('Get customers error:', error);
        next(error);
    }
};

/**
 * Get customer by ID
 */
const getCustomerById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [customers] = await executeQuery(
            'SELECT * FROM customers WHERE id = ?',
            [id]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            data: customers[0]
        });
    } catch (error) {
        logger.error('Get customer error:', error);
        next(error);
    }
};

/**
 * Create customer
 */
const createCustomer = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { name, phone, email, address } = req.body;

        if (!name) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Customer name is required'
            });
        }

        const [result] = await connection.execute(
            `INSERT INTO customers (name, phone, email, address) 
             VALUES (?, ?, ?, ?) RETURNING id`,
            [name, phone || null, email || null, address || null]
        );

        await connection.commit();

        logger.info(`Customer created: ${name} (ID: ${result.insertId})`);

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: {
                id: result.insertId,
                name
            }
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Create customer error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Update customer
 */
const updateCustomer = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { name, phone, email, address } = req.body;

        // Check if customer exists
        const [customers] = await connection.execute(
            'SELECT id FROM customers WHERE id = ?',
            [id]
        );

        if (customers.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Build update query
        const updates = [];
        const params = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }
        if (address !== undefined) {
            updates.push('address = ?');
            params.push(address);
        }

        if (updates.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(id);

        await connection.execute(
            `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        await connection.commit();

        logger.info(`Customer updated: ID ${id}`);

        res.json({
            success: true,
            message: 'Customer updated successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Update customer error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer
};
