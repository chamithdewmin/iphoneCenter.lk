const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const perOrderController = require('../controllers/perOrderController');
const { authenticate } = require('../middleware/auth');
const { branchGuard } = require('../middleware/branchGuard');

const createValidation = [
    body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
    body('customer_phone').trim().notEmpty().withMessage('Customer phone is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be 0 or positive')
];

router.get('/', authenticate, branchGuard, perOrderController.listPerOrders);
router.get('/:id', authenticate, branchGuard, perOrderController.getPerOrder);
router.post('/', authenticate, branchGuard, createValidation, perOrderController.createPerOrder);
router.patch('/:id', authenticate, branchGuard, perOrderController.updatePerOrder);
router.delete('/:id', authenticate, branchGuard, perOrderController.deletePerOrder);

module.exports = router;
