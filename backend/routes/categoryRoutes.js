const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { requireManager } = require('../middleware/roleGuard');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected routes (Admin/Manager only)
router.post('/', authenticate, requireManager, categoryController.createCategory);
router.put('/:id', authenticate, requireManager, categoryController.updateCategory);
router.delete('/:id', authenticate, requireManager, categoryController.deleteCategory);

module.exports = router;
