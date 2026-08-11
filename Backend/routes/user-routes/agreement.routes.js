const express = require('express');
const router = express.Router();
const {
  getAgreementStatus,
  acceptAgreement,
  getAdminAcceptanceLogs,
  updateAdminAgreement
} = require('../../controllers/userControllers/agreementController');
const { authenticate, optionalAuth } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');

// Public / optional auth endpoint to check agreement status & current text
router.get('/status', optionalAuth, getAgreementStatus);

// Authenticated user accepts agreement
router.post('/accept', authenticate, acceptAgreement);

// Admin endpoints for viewing acceptance logs & updating agreement text
router.get('/admin/logs', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'SUPPORT_ADMIN', 'OPERATIONS_ADMIN'), getAdminAcceptanceLogs);
router.put('/admin/update', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateAdminAgreement);

module.exports = router;
