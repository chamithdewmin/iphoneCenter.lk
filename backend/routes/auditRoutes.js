const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleGuard');

router.use(authenticate);
router.use(requireAdmin);

router.get('/', auditController.getAuditLogs);
router.get('/actions', auditController.getAuditActions);

module.exports = router;
