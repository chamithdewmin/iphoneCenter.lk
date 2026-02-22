const { getConnection } = require('../config/database');
const logger = require('../utils/logger');
const { logAudit, getRequestMeta } = require('../services/auditService');

/**
 * Reset branch data - Delete all data for a specific branch (Admin only)
 * When branchId = 'all', this will delete:
 * - stock_transfers
 * - sales (and cascade delete sale_items, payments, refunds)
 * - product_imeis
 * - branch_stock
 * - barcodes
 * - products
 * - customers
 * - categories
 * - brands
 * - branches
 * - audit_logs
 * 
 * When branchId is a specific branch, this will delete:
 * - branch_stock (for that branch)
 * - product_imeis (for that branch)
 * - sales (for that branch, and cascade delete sale_items, payments, refunds)
 * - stock_transfers (where branch is from_branch_id or to_branch_id)
 * - audit_logs (for that branch)
 * 
 * This will NOT delete:
 * - users table (user accounts remain)
 */
const resetBranchData = async (req, res, next) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const { branchId } = req.body;

        if (!branchId) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Branch ID is required'
            });
        }

        const isAllBranches = branchId === 'all';

        if (isAllBranches) {
            // Delete all data for all branches
            // Order matters due to foreign key constraints
            
            // Delete all stock transfers first
            await connection.execute('DELETE FROM stock_transfers');

            // Delete all sales (will cascade delete sale_items, payments, refunds)
            await connection.execute('DELETE FROM sales');

            // Delete all product IMEIs
            await connection.execute('DELETE FROM product_imeis');

            // Delete all branch stock
            await connection.execute('DELETE FROM branch_stock');

            // Delete all barcodes
            await connection.execute('DELETE FROM barcodes');

            // Delete all products
            await connection.execute('DELETE FROM products');

            // Delete all customers
            await connection.execute('DELETE FROM customers');

            // Delete all categories
            await connection.execute('DELETE FROM categories');

            // Delete all brands
            await connection.execute('DELETE FROM brands');

            // Delete all branches (except keep the structure)
            await connection.execute('DELETE FROM branches');

            // Delete all audit logs
            await connection.execute('DELETE FROM audit_logs');

            await connection.commit();

            await logAudit({
                action: 'settings_reset',
                userId: req.user.id,
                branchId: null,
                entityType: 'branch',
                entityId: null,
                newValues: { scope: 'all' },
                ...getRequestMeta(req),
            });

            logger.info(`All branches data reset by user ${req.user.id}`);

            res.json({
                success: true,
                message: 'All data has been deleted successfully. Only users table remains intact.'
            });
        } else {
            // Verify branch exists
            const [branchCheck] = await connection.execute(
                'SELECT id, name FROM branches WHERE id = ?',
                [branchId]
            );

            if (branchCheck.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Branch not found'
                });
            }

            const branchName = branchCheck[0].name;

            // Delete stock transfers where branch is involved (from or to)
            await connection.execute(
                'DELETE FROM stock_transfers WHERE from_branch_id = ? OR to_branch_id = ?',
                [branchId, branchId]
            );

            // Delete sales for this branch (will cascade delete sale_items, payments, refunds)
            await connection.execute(
                'DELETE FROM sales WHERE branch_id = ?',
                [branchId]
            );

            // Delete product IMEIs for this branch
            await connection.execute(
                'DELETE FROM product_imeis WHERE branch_id = ?',
                [branchId]
            );

            // Delete branch stock
            await connection.execute(
                'DELETE FROM branch_stock WHERE branch_id = ?',
                [branchId]
            );

            // Delete audit logs for this branch
            await connection.execute(
                'DELETE FROM audit_logs WHERE branch_id = ?',
                [branchId]
            );

            await connection.commit();

            await logAudit({
                action: 'settings_reset',
                userId: req.user.id,
                branchId: parseInt(branchId, 10) || null,
                entityType: 'branch',
                entityId: parseInt(branchId, 10) || null,
                newValues: { scope: 'branch', branchName },
                ...getRequestMeta(req),
            });

            logger.info(`Branch data reset: Branch ID ${branchId} (${branchName}) by user ${req.user.id}`);

            res.json({
                success: true,
                message: `All data for branch "${branchName}" has been deleted successfully`
            });
        }
    } catch (error) {
        await connection.rollback();
        logger.error('Reset branch data error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    resetBranchData
};
