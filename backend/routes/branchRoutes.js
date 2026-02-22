const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const branchController = require('../controllers/branchController');
const { authenticate } = require('../middleware/auth');
const { requireManager, requireAdmin } = require('../middleware/roleGuard');
const { branchGuard } = require('../middleware/branchGuard');

// Validation rules
const createBranchValidation = [
    body('name').trim().notEmpty().withMessage('Branch name is required'),
    body('code').trim().notEmpty().withMessage('Branch code is required')
];

// Routes
router.get('/', authenticate, branchGuard, branchController.getAllBranches);
router.get('/:id', authenticate, branchGuard, branchController.getBranchById);
router.post('/', authenticate, requireManager, createBranchValidation, branchController.createBranch);
router.put('/:id', authenticate, requireManager, branchController.updateBranch);
router.delete('/:id', authenticate, requireAdmin, branchController.disableBranch);

module.exports = router;
