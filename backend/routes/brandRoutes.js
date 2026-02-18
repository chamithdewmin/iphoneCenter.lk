const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', brandController.getAllBrands);
router.get('/:id', brandController.getBrandById);

// Protected routes (Admin/Manager only)
router.post('/', authenticate, authorize(['admin', 'manager']), brandController.createBrand);
router.put('/:id', authenticate, authorize(['admin', 'manager']), brandController.updateBrand);
router.delete('/:id', authenticate, authorize(['admin', 'manager']), brandController.deleteBrand);

module.exports = router;
