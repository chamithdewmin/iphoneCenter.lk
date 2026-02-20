const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');
const { requireManager, requireManagerOrStaff } = require('../middleware/roleGuard');
const { branchGuard, setBranchContext } = require('../middleware/branchGuard');
const { handleValidationErrors } = require('../middleware/validate');

// Validation rules (basePrice can be number or string from JSON; 0 is valid)
const createProductValidation = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('basePrice').custom((v) => {
        if (v === undefined || v === null || (typeof v === 'string' && v.trim() === ''))
            throw new Error('Base price is required');
        const n = parseFloat(v);
        if (Number.isNaN(n) || n < 0) throw new Error('Base price must be 0 or greater');
        return true;
    })
];

// Routes
// Products
router.get('/products', authenticate, inventoryController.getAllProducts);
router.get('/products/:id', authenticate, inventoryController.getProductById);
router.post('/products', authenticate, requireManagerOrStaff, createProductValidation, handleValidationErrors, inventoryController.createProduct);
router.put('/products/:id', authenticate, requireManagerOrStaff, inventoryController.updateProduct);
router.delete('/products/:id', authenticate, requireManagerOrStaff, inventoryController.deleteProduct);

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
