const { executeQuery } = require('../config/database');
const { isAdmin } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get branch-wise sales report
 */
const getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        const userBranchId = req.user.branch_id;

        let query = `SELECT 
                        s.branch_id,
                        b.name as branch_name,
                        b.code as branch_code,
                        COUNT(s.id) as total_sales,
                        SUM(s.total_amount) as total_revenue,
                        SUM(s.paid_amount) as total_paid,
                        SUM(s.due_amount) as total_due,
                        SUM(s.discount_amount) as total_discount,
                        SUM(s.tax_amount) as total_tax
                     FROM sales s
                     INNER JOIN branches b ON s.branch_id = b.id
                     WHERE s.sale_status = 'completed'`;

        const params = [];

        if (!isAdmin(req)) {
            query += ' AND s.branch_id = ?';
            params.push(userBranchId);
        } else if (branchId) {
            query += ' AND s.branch_id = ?';
            params.push(branchId);
        }

        if (startDate) {
            query += ' AND DATE(s.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND DATE(s.created_at) <= ?';
            params.push(endDate);
        }

        query += ' GROUP BY s.branch_id, b.name, b.code ORDER BY total_revenue DESC';

        const [results] = await executeQuery(query, params);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        logger.error('Sales report error:', error);
        next(error);
    }
};

/**
 * Get profit report
 */
const getProfitReport = async (req, res, next) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        const userBranchId = req.user.branch_id;

        let query = `SELECT 
                        s.branch_id,
                        b.name as branch_name,
                        DATE(s.created_at) as sale_date,
                        COUNT(s.id) as total_sales,
                        SUM(s.total_amount) as total_revenue,
                        SUM(si.quantity * si.unit_price) as total_cost,
                        SUM(s.total_amount) - SUM(si.quantity * si.unit_price) as gross_profit,
                        SUM(s.discount_amount) as total_discount,
                        SUM(s.tax_amount) as total_tax
                     FROM sales s
                     INNER JOIN branches b ON s.branch_id = b.id
                     INNER JOIN sale_items si ON s.id = si.sale_id
                     WHERE s.sale_status = 'completed'`;

        const params = [];

        if (!isAdmin(req)) {
            query += ' AND s.branch_id = ?';
            params.push(userBranchId);
        } else if (branchId) {
            query += ' AND s.branch_id = ?';
            params.push(branchId);
        }

        if (startDate) {
            query += ' AND DATE(s.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND DATE(s.created_at) <= ?';
            params.push(endDate);
        }

        query += ' GROUP BY s.branch_id, b.name, DATE(s.created_at) ORDER BY sale_date DESC';

        const [results] = await executeQuery(query, params);

        // Calculate profit margin
        const data = results.map(row => ({
            ...row,
            profit_margin: row.total_revenue > 0 
                ? ((row.gross_profit / row.total_revenue) * 100).toFixed(2) 
                : 0
        }));

        res.json({
            success: true,
            data
        });
    } catch (error) {
        logger.error('Profit report error:', error);
        next(error);
    }
};

/**
 * Get stock report
 */
const getStockReport = async (req, res, next) => {
    try {
        const { branchId, lowStock } = req.query;
        const userBranchId = req.user.branch_id;

        let query = `SELECT 
                        bs.branch_id,
                        b.name as branch_name,
                        b.code as branch_code,
                        bs.product_id,
                        p.name as product_name,
                        p.sku,
                        p.category,
                        p.brand,
                        p.base_price,
                        bs.quantity,
                        bs.reserved_quantity,
                        bs.min_stock_level,
                        (bs.quantity - bs.reserved_quantity) as available_quantity,
                        CASE 
                            WHEN (bs.quantity - bs.reserved_quantity) <= bs.min_stock_level THEN 'low'
                            WHEN (bs.quantity - bs.reserved_quantity) <= (bs.min_stock_level * 1.5) THEN 'medium'
                            ELSE 'good'
                        END as stock_status
                     FROM branch_stock bs
                     INNER JOIN branches b ON bs.branch_id = b.id
                     INNER JOIN products p ON bs.product_id = p.id
                     WHERE 1=1`;

        const params = [];

        // Branch filter
        if (!isAdmin(req)) {
            query += ' AND bs.branch_id = ?';
            params.push(userBranchId);
        } else if (branchId) {
            query += ' AND bs.branch_id = ?';
            params.push(branchId);
        }

        // Low stock filter
        if (lowStock === 'true') {
            query += ' AND (bs.quantity - bs.reserved_quantity) <= bs.min_stock_level';
        }

        query += ' ORDER BY b.name, p.name';

        const [results] = await executeQuery(query, params);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        logger.error('Stock report error:', error);
        next(error);
    }
};

/**
 * Get due payments report
 */
const getDuePaymentsReport = async (req, res, next) => {
    try {
        const { branchId, customerId } = req.query;
        const userBranchId = req.user.branch_id;

        let query = `SELECT 
                        s.id,
                        s.invoice_number,
                        s.branch_id,
                        b.name as branch_name,
                        s.customer_id,
                        c.name as customer_name,
                        c.phone as customer_phone,
                        s.total_amount,
                        s.paid_amount,
                        s.due_amount,
                        s.payment_status,
                        s.created_at,
                        DATEDIFF(NOW(), s.created_at) as days_overdue
                     FROM sales s
                     INNER JOIN branches b ON s.branch_id = b.id
                     LEFT JOIN customers c ON s.customer_id = c.id
                     WHERE s.sale_status = 'completed' 
                     AND s.payment_status IN ('partial', 'due')
                     AND s.due_amount > 0`;

        const params = [];

        // Branch filter
        if (!isAdmin(req)) {
            query += ' AND s.branch_id = ?';
            params.push(userBranchId);
        } else if (branchId) {
            query += ' AND s.branch_id = ?';
            params.push(branchId);
        }

        if (customerId) {
            query += ' AND s.customer_id = ?';
            params.push(customerId);
        }

        query += ' ORDER BY s.due_amount DESC, s.created_at ASC';

        const [results] = await executeQuery(query, params);

        // Calculate totals
        const totals = results.reduce((acc, row) => {
            acc.total_due += parseFloat(row.due_amount);
            acc.total_sales += 1;
            return acc;
        }, { total_due: 0, total_sales: 0 });

        res.json({
            success: true,
            data: results,
            summary: totals
        });
    } catch (error) {
        logger.error('Due payments report error:', error);
        next(error);
    }
};

/**
 * Get daily sales summary
 */
const getDailySalesSummary = async (req, res, next) => {
    try {
        const { date, branchId } = req.query;
        const userBranchId = req.user && req.user.branch_id != null ? req.user.branch_id : null;
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Non-admin must have branch_id
        if (!isAdmin(req) && (userBranchId == null || userBranchId === '')) {
            return res.status(403).json({
                success: false,
                message: 'User must be assigned to a branch to view reports.'
            });
        }

        let query = `SELECT 
                        DATE(s.created_at) as sale_date,
                        COUNT(DISTINCT s.id) as total_transactions,
                        COUNT(DISTINCT s.customer_id) as total_customers,
                        SUM(s.total_amount) as total_revenue,
                        SUM(s.paid_amount) as total_paid,
                        SUM(s.due_amount) as total_due,
                        SUM(s.discount_amount) as total_discount,
                        SUM(s.tax_amount) as total_tax,
                        AVG(s.total_amount) as average_transaction_value
                     FROM sales s
                     WHERE s.sale_status = 'completed'
                     AND DATE(s.created_at) = ?`;

        const params = [targetDate];

        // Branch filter
        if (!isAdmin(req)) {
            query += ' AND s.branch_id = ?';
            params.push(userBranchId);
        } else if (branchId) {
            query += ' AND s.branch_id = ?';
            params.push(branchId);
        }

        query += ' GROUP BY DATE(s.created_at)';

        const [rawResults] = await executeQuery(query, params);
        const results = Array.isArray(rawResults) ? rawResults : [];

        res.json({
            success: true,
            data: results.length > 0 ? results[0] : null
        });
    } catch (error) {
        logger.error('Daily sales summary error:', error);
        next(error);
    }
};

/**
 * Get top selling products
 */
const getTopSellingProducts = async (req, res, next) => {
    try {
        const { startDate, endDate, branchId, limit = 10 } = req.query;
        const userBranchId = req.user.branch_id;

        let query = `SELECT 
                        si.product_id,
                        p.name as product_name,
                        p.sku,
                        p.category,
                        p.brand,
                        SUM(si.quantity) as total_quantity_sold,
                        SUM(si.subtotal) as total_revenue,
                        COUNT(DISTINCT si.sale_id) as times_sold
                     FROM sale_items si
                     INNER JOIN products p ON si.product_id = p.id
                     INNER JOIN sales s ON si.sale_id = s.id
                     WHERE s.sale_status = 'completed'`;

        const params = [];

        // Branch filter
        if (!isAdmin(req)) {
            query += ' AND s.branch_id = ?';
            params.push(userBranchId);
        } else if (branchId) {
            query += ' AND s.branch_id = ?';
            params.push(branchId);
        }

        if (startDate) {
            query += ' AND DATE(s.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND DATE(s.created_at) <= ?';
            params.push(endDate);
        }

        query += ' GROUP BY si.product_id, p.name, p.sku, p.category, p.brand';
        query += ' ORDER BY total_quantity_sold DESC LIMIT ?';
        params.push(parseInt(limit));

        const [results] = await executeQuery(query, params);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        logger.error('Top selling products error:', error);
        next(error);
    }
};

module.exports = {
    getSalesReport,
    getProfitReport,
    getStockReport,
    getDuePaymentsReport,
    getDailySalesSummary,
    getTopSellingProducts
};
