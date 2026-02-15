const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');
const { requireManager } = require('../middleware/roleGuard');
const { branchGuard, setBranchContext } = require('../middleware/branchGuard');

// Validation rules
const createProductValidation = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number')
];

// Routes
// Products
router.get('/products', authenticate, inventoryController.getAllProducts);
router.get('/products/:id', authenticate, inventoryController.getProductById);
router.post('/products', authenticate, requireManager, createProductValidation, inventoryController.createProduct);

// Stock
router.get('/stock', authenticate, branchGuard, setBranchContext, inventoryController.getBranchStock);
router.put('/stock', authenticate, branchGuard, setBranchContext, requireManager, inventoryController.updateStock);
// Update stock without branch (admin: uses first branch) – for main Inventory page
router.put('/stock-quantity', authenticate, requireManager, inventoryController.updateStock);

// IMEI
router.post('/imei', authenticate, branchGuard, setBranchContext, requireManager, inventoryController.addIMEI);
router.get('/imei', authenticate, branchGuard, setBranchContext, inventoryController.getIMEIs);

// Stock Transfers
router.post('/transfers', authenticate, branchGuard, requireManager, inventoryController.transferStock);
router.put('/transfers/:id/complete', authenticate, requireManager, inventoryController.completeTransfer);

// Barcode
router.get('/barcode/generate/:productId', authenticate, requireManager, inventoryController.generateBarcodeForProduct);
router.get('/barcode/validate/:barcode', authenticate, inventoryController.validateBarcode);

module.exports = router;
