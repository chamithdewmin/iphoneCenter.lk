const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleGuard');

router.get('/', authenticate, requireAdmin, userController.getAllUsers);

module.exports = router;
