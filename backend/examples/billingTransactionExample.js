/**
 * Example: Transaction-Safe Billing Implementation
 * 
 * This file demonstrates how the billing system handles transactions
 * with proper error handling, stock management, and data integrity.
 */

const { getConnection } = require('../config/database');
const { generateInvoiceNumber } = require('../utils/helpers');
const { PAYMENT_STATUS, IMEI_STATUS } = require('../config/constants');

/**
 * Example: Create a complete sale transaction
 * 
 * This function demonstrates the transaction-safe billing process:
 * 1. Begin transaction
 * 2. Validate stock availability
 * 3. Calculate totals
 * 4. Create sale record
 * 5. Create sale items
 * 6. Update stock quantities
 * 7. Update IMEI status (if applicable)
 * 8. Create payment record
 * 9. Commit or rollback on error
 */
async function createSaleTransactionExample(branchId, userId, saleData) {
    const connection = await getConnection();
    
    try {
        // Start transaction
        await connection.beginTransaction();

        const { customerId, items, discountAmount, taxRate, paidAmount, notes } = saleData;

        // Step 1: Validate items and check stock availability
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
            const { productId, quantity, unitPrice, discount, imei } = item;

            // Check stock availability
            const [stock] = await connection.execute(
                'SELECT quantity, reserved_quantity FROM branch_stock WHERE branch_id = ? AND product_id = ?',
                [branchId, productId]
            );

            if (stock.length === 0 || stock[0].quantity - stock[0].reserved_quantity < quantity) {
                throw new Error(`Insufficient stock for product ID ${productId}`);
            }

            // Validate IMEI if provided
            if (imei) {
                const [imeiRecord] = await connection.execute(
                    'SELECT id, status FROM product_imeis WHERE imei = ? AND branch_id = ?',
                    [imei, branchId]
                );

                if (imeiRecord.length === 0 || imeiRecord[0].status !== 'available') {
                    throw new Error(`IMEI ${imei} is not available`);
                }
            }

            const itemDiscount = parseFloat(discount) || 0;
            const itemSubtotal = (parseFloat(unitPrice) * parseInt(quantity)) - itemDiscount;
            subtotal += itemSubtotal;

            validatedItems.push({
                productId,
                quantity,
                unitPrice: parseFloat(unitPrice),
                discount: itemDiscount,
                subtotal: itemSubtotal,
                imei: imei || null
            });
        }

        // Step 2: Calculate totals
        const discount = parseFloat(discountAmount) || 0;
        const tax = (subtotal - discount) * ((parseFloat(taxRate) || 0) / 100);
        const totalAmount = subtotal - discount + tax;
        const paid = parseFloat(paidAmount) || 0;
        const due = totalAmount - paid;

        // Step 3: Determine payment status
        let paymentStatus;
        if (due <= 0) {
            paymentStatus = PAYMENT_STATUS.PAID;
        } else if (paid > 0) {
            paymentStatus = PAYMENT_STATUS.PARTIAL;
        } else {
            paymentStatus = PAYMENT_STATUS.DUE;
        }

        // Step 4: Get branch code for invoice number
        const [branches] = await connection.execute(
            'SELECT code FROM branches WHERE id = ?',
            [branchId]
        );
        const branchCode = branches[0].code;
        const invoiceNumber = generateInvoiceNumber(branchCode);

        // Step 5: Create sale record
        const [saleResult] = await connection.execute(
            `INSERT INTO sales (invoice_number, branch_id, customer_id, user_id, total_amount, 
                               discount_amount, tax_amount, paid_amount, due_amount, payment_status, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [invoiceNumber, branchId, customerId || null, userId, totalAmount, 
             discount, tax, paid, due, paymentStatus, notes || null]
        );

        const saleId = saleResult.insertId;

        // Step 6: Create sale items and update stock
        for (const item of validatedItems) {
            // Insert sale item
            await connection.execute(
                `INSERT INTO sale_items (sale_id, product_id, imei, quantity, unit_price, cost_price, discount_amount, subtotal) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [saleId, item.productId, item.imei, item.quantity, item.unitPrice, item.costPrice || 0, item.discount, item.subtotal]
            );

            // Update stock (decrease quantity)
            await connection.execute(
                'UPDATE branch_stock SET quantity = quantity - ? WHERE branch_id = ? AND product_id = ?',
                [item.quantity, branchId, item.productId]
            );

            // Update IMEI status if provided
            if (item.imei) {
                await connection.execute(
                    'UPDATE product_imeis SET status = ?, sale_id = ? WHERE imei = ? AND branch_id = ?',
                    [IMEI_STATUS.SOLD, saleId, item.imei, branchId]
                );
            }
        }

        // Step 7: Create payment record if paid
        if (paid > 0) {
            await connection.execute(
                `INSERT INTO payments (sale_id, amount, payment_method, created_by) 
                 VALUES (?, ?, 'cash', ?)`,
                [saleId, paid, userId]
            );
        }

        // Step 8: Commit transaction
        await connection.commit();

        return {
            success: true,
            saleId,
            invoiceNumber,
            totalAmount,
            paid,
            due
        };

    } catch (error) {
        // Rollback on any error
        await connection.rollback();
        console.error('Transaction failed:', error);
        throw error;
    } finally {
        // Always release connection
        connection.release();
    }
}

/**
 * Example: Cancel sale and restore stock
 */
async function cancelSaleTransactionExample(saleId, userId, reason) {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // Get sale details
        const [sales] = await connection.execute(
            'SELECT * FROM sales WHERE id = ?',
            [saleId]
        );

        if (sales.length === 0) {
            throw new Error('Sale not found');
        }

        const sale = sales[0];

        if (sale.sale_status !== 'completed') {
            throw new Error('Sale is already cancelled or refunded');
        }

        // Get sale items
        const [saleItems] = await connection.execute(
            'SELECT * FROM sale_items WHERE sale_id = ?',
            [saleId]
        );

        // Restore stock and IMEI
        for (const item of saleItems) {
            // Restore stock
            await connection.execute(
                'UPDATE branch_stock SET quantity = quantity + ? WHERE branch_id = ? AND product_id = ?',
                [item.quantity, sale.branch_id, item.product_id]
            );

            // Restore IMEI if exists
            if (item.imei) {
                await connection.execute(
                    'UPDATE product_imeis SET status = ?, sale_id = NULL WHERE imei = ?',
                    [IMEI_STATUS.AVAILABLE, item.imei]
                );
            }
        }

        // Update sale status
        await connection.execute(
            'UPDATE sales SET sale_status = ?, notes = CONCAT(COALESCE(notes, ""), ?) WHERE id = ?',
            ['cancelled', `\nCancelled: ${reason || 'No reason provided'}`, saleId]
        );

        await connection.commit();

        return {
            success: true,
            message: 'Sale cancelled successfully'
        };

    } catch (error) {
        await connection.rollback();
        console.error('Cancel transaction failed:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Example: Add partial payment
 */
async function addPaymentTransactionExample(saleId, amount, userId, paymentMethod = 'cash') {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // Get sale
        const [sales] = await connection.execute(
            'SELECT * FROM sales WHERE id = ?',
            [saleId]
        );

        if (sales.length === 0) {
            throw new Error('Sale not found');
        }

        const sale = sales[0];

        if (sale.sale_status !== 'completed') {
            throw new Error('Cannot add payment to cancelled or refunded sale');
        }

        const newPaidAmount = parseFloat(sale.paid_amount) + parseFloat(amount);
        const newDueAmount = parseFloat(sale.total_amount) - newPaidAmount;

        // Determine payment status
        let paymentStatus;
        if (newDueAmount <= 0) {
            paymentStatus = PAYMENT_STATUS.PAID;
        } else {
            paymentStatus = PAYMENT_STATUS.PARTIAL;
        }

        // Create payment record
        await connection.execute(
            `INSERT INTO payments (sale_id, amount, payment_method, created_by) 
             VALUES (?, ?, ?, ?)`,
            [saleId, amount, paymentMethod, userId]
        );

        // Update sale
        await connection.execute(
            'UPDATE sales SET paid_amount = ?, due_amount = ?, payment_status = ? WHERE id = ?',
            [newPaidAmount, newDueAmount, paymentStatus, saleId]
        );

        await connection.commit();

        return {
            success: true,
            newPaidAmount,
            newDueAmount,
            paymentStatus
        };

    } catch (error) {
        await connection.rollback();
        console.error('Payment transaction failed:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Export examples
module.exports = {
    createSaleTransactionExample,
    cancelSaleTransactionExample,
    addPaymentTransactionExample
};

/**
 * Usage Example:
 * 
 * const { createSaleTransactionExample } = require('./examples/billingTransactionExample');
 * 
 * const saleData = {
 *   customerId: 1,
 *   items: [
 *     {
 *       productId: 1,
 *       quantity: 2,
 *       unitPrice: 100.00,
 *       discount: 0,
 *       imei: '123456789012345' // Optional
 *     }
 *   ],
 *   discountAmount: 10.00,
 *   taxRate: 5,
 *   paidAmount: 200.00,
 *   notes: 'Customer notes'
 * };
 * 
 * try {
 *   const result = await createSaleTransactionExample(1, 1, saleData);
 *   console.log('Sale created:', result);
 * } catch (error) {
 *   console.error('Error:', error.message);
 * }
 */
