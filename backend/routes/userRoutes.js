const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleGuard');

router.get('/', authenticate, requireAdmin, userController.getAllUsers);
router.get('/login-logs/all', authenticate, requireAdmin, userController.getUserLoginLogs);
router.get('/:userId/login-logs', authenticate, requireAdmin, userController.getUserLoginLogs);
router.get('/:id', authenticate, requireAdmin, userController.getUserById);
router.put('/:id', authenticate, requireAdmin, userController.updateUser);
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser);

module.exports = router;
