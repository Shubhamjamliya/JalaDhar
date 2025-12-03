const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getPaymentStatistics,
  getPaymentDetails,
  getAdminPaymentOverview,
  getVendorPaymentOverview
} = require('../../controllers/paymentControllers/adminPaymentController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

// Routes
router.get('/payments', authenticate, isAdmin, getAllPayments);
router.get('/payments/statistics', authenticate, isAdmin, getPaymentStatistics);
router.get('/payments/overview', authenticate, isAdmin, getAdminPaymentOverview);
router.get('/payments/vendor-overview', authenticate, isAdmin, getVendorPaymentOverview);
router.get('/payments/:paymentId', authenticate, isAdmin, getPaymentDetails);

module.exports = router;

