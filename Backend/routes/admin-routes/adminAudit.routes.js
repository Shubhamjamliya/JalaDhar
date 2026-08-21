const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { requirePermission, isSuperAdmin } = require('../../middleware/roleMiddleware');
const {
  getAdminActivityLogs,
  getAuditLogStats,
  getAuditLogDetails
} = require('../../controllers/adminControllers/adminAuditController');

// All audit routes require authentication and agreement-logs permission (or Super Admin)
router.use(authenticate);
router.use(requirePermission('agreement-logs'));

router.get('/', getAdminActivityLogs);
router.get('/stats', getAuditLogStats);
router.get('/:logId', getAuditLogDetails);

module.exports = router;
