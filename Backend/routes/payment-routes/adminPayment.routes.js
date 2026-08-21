const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getPaymentStatistics,
  getPaymentDetails,
  getAdminPaymentOverview,
  getVendorPaymentOverview,
  getPaymentReports,
  getGstReports,
  getTdsReports,
  getCodReports
} = require('../../controllers/paymentControllers/adminPaymentController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isFinanceAdmin } = require('../../middleware/roleMiddleware');

// Routes (Protected by Finance Permission & Super Admin)
router.get('/payments', authenticate, isFinanceAdmin, getAllPayments);
router.get('/payments/statistics', authenticate, isFinanceAdmin, getPaymentStatistics);
router.get('/payments/overview', authenticate, isFinanceAdmin, getAdminPaymentOverview);
router.get('/payments/vendor-overview', authenticate, isFinanceAdmin, getVendorPaymentOverview);
router.get('/payments/reports', authenticate, isFinanceAdmin, getPaymentReports);
router.get('/payments/reports/gst', authenticate, isFinanceAdmin, getGstReports);
router.get('/payments/reports/tds', authenticate, isFinanceAdmin, getTdsReports);
router.get('/payments/reports/cod', authenticate, isFinanceAdmin, getCodReports);
router.get('/payments/:paymentId', authenticate, isFinanceAdmin, getPaymentDetails);

module.exports = router;

