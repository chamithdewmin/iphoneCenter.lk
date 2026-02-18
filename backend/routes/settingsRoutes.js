const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleGuard');

// Reset branch data (Admin only)
router.post('/reset-branch-data', authenticate, requireAdmin, settingsController.resetBranchData);

module.exports = router;
