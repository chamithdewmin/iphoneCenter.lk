const { getConnection } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Reset branch data - Delete all data for a specific branch (Admin only)
 * This will delete:
 * - branch_stock
 * - product_imeis (for that branch)
 * - sales (and cascade delete sale_items, payments, refunds)
 * - stock_transfers (where branch is from_branch_id or to_branch_id)
 * 
 * This will NOT delete:
 * - users table
 * - branches table
 * - products table
 * - brands, categories tables
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
            // Delete all stock transfers
            await connection.execute('DELETE FROM stock_transfers');

            // Delete all sales (will cascade delete sale_items, payments, refunds)
            await connection.execute('DELETE FROM sales');

            // Delete all product IMEIs
            await connection.execute('DELETE FROM product_imeis');

            // Delete all branch stock
            await connection.execute('DELETE FROM branch_stock');

            // Delete all audit logs
            await connection.execute('DELETE FROM audit_logs');

            await connection.commit();

            logger.info(`All branches data reset by user ${req.user.id}`);

            res.json({
                success: true,
                message: 'All data for all branches has been deleted successfully'
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
