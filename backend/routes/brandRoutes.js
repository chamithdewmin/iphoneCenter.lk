const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticate } = require('../middleware/auth');
const { requireManager } = require('../middleware/roleGuard');

// Public routes
router.get('/', brandController.getAllBrands);
router.get('/:id', brandController.getBrandById);

// Protected routes (Admin/Manager only)
router.post('/', authenticate, requireManager, brandController.createBrand);
router.put('/:id', authenticate, requireManager, brandController.updateBrand);
router.delete('/:id', authenticate, requireManager, brandController.deleteBrand);

module.exports = router;
