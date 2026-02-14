const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const billingController = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');
const { requireManager } = require('../middleware/roleGuard');
const { branchGuard } = require('../middleware/branchGuard');

// Validation rules
const createSaleValidation = [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
    body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be positive')
];

// Routes
router.post('/sales', authenticate, branchGuard, createSaleValidation, billingController.createSale);
router.get('/sales', authenticate, branchGuard, billingController.getAllSales);
router.get('/sales/:id', authenticate, branchGuard, billingController.getSale);
router.post('/sales/:saleId/payments', authenticate, branchGuard, billingController.addPayment);
router.put('/sales/:id/cancel', authenticate, branchGuard, requireManager, billingController.cancelSale);
router.post('/sales/:saleId/refunds', authenticate, branchGuard, requireManager, billingController.createRefund);
router.put('/refunds/:id/process', authenticate, requireManager, billingController.processRefund);

module.exports = router;
