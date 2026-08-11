const express = require('express');
const router = express.Router();
const {
  getExpertAgreementStatus,
  acceptExpertAgreement,
  downloadExpertAgreementPdf,
  getAdminExpertAgreementLogs,
  updateAdminExpertAgreement
} = require('../../controllers/vendorControllers/expertAgreementController');
const { authenticate } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');

// Expert endpoints
router.get('/status', authenticate, getExpertAgreementStatus);
router.post('/accept', authenticate, acceptExpertAgreement);
router.get('/download-pdf', authenticate, downloadExpertAgreementPdf);

// Admin audit & edit endpoints
router.get('/admin/logs', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'SUPPORT_ADMIN', 'OPERATIONS_ADMIN'), getAdminExpertAgreementLogs);
router.put('/admin/update', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateAdminExpertAgreement);

module.exports = router;
