const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');
const { branchGuard } = require('../middleware/branchGuard');
const { requireAnalyticsAccess } = require('../middleware/analyticsAccess');

// All reports require authentication, branch selection, and analytics OTP access
router.use(authenticate);
router.use(branchGuard);
router.use(requireAnalyticsAccess);

// Routes
router.get('/sales', reportsController.getSalesReport);
router.get('/profit', reportsController.getProfitReport);
router.get('/stock', reportsController.getStockReport);
router.get('/due-payments', reportsController.getDuePaymentsReport);
router.get('/daily-summary', reportsController.getDailySalesSummary);
router.get('/top-products', reportsController.getTopSellingProducts);

module.exports = router;
