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
        logger.error('Get customers error:', { message: error.message, code: error.code });
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

        const customerId = result.insertId || (result.rows && result.rows[0] && result.rows[0].id);
        if (!customerId) {
            await connection.rollback();
            logger.error('Create customer: INSERT did not return id', { result });
            return res.status(500).json({
                success: false,
                message: 'Could not create customer record. Check backend logs.'
            });
        }

        await connection.commit();

        logger.info(`Customer created: ${name} (ID: ${customerId})`);

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: {
                id: customerId,
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

/**
 * Delete customer
 */
const deleteCustomer = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if customer exists
        const [customers] = await connection.execute(
            'SELECT id, name FROM customers WHERE id = ?',
            [id]
        );

        if (customers.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check if customer has any sales (optional - you may want to prevent deletion if customer has sales)
        const [sales] = await connection.execute(
            'SELECT id FROM sales WHERE customer_id = ? LIMIT 1',
            [id]
        );

        if (sales.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot delete customer with existing sales. Consider deactivating instead.'
            });
        }

        // Delete customer
        await connection.execute(
            'DELETE FROM customers WHERE id = ?',
            [id]
        );

        await connection.commit();

        logger.info(`Customer deleted: ID ${id} (${customers[0].name})`);

        res.json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Delete customer error:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail,
            hint: error.hint
        });
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
