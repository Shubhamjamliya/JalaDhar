const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin, isFinanceAdmin, requirePermission } = require('../../middleware/roleMiddleware');
const { ROLES } = require('../../utils/constants');

const {
  getDashboardStats,
  getRevenueAnalytics,
  getBookingTrends,
  getUserGrowthMetrics,
  getPaymentAnalytics,
  getGeographicAnalysis,
  getSidebarCounts
} = require('../../controllers/adminControllers/adminDashboardController');

const isOperationsAdmin = requirePermission('bookings', ROLES.OPERATIONS_ADMIN);
const isUserAdmin = requirePermission('users', ROLES.OPERATIONS_ADMIN, ROLES.SUPPORT_ADMIN);
const isReportAdmin = requirePermission('reports', ROLES.OPERATIONS_ADMIN, ROLES.FINANCE_ADMIN, ROLES.QC_ADMIN);

// All routes require admin authentication
router.use(authenticate, isAdmin);

router.get('/stats', getDashboardStats);
router.get('/sidebar-counts', getSidebarCounts);
router.get('/revenue', isFinanceAdmin, getRevenueAnalytics);
router.get('/bookings/trends', isOperationsAdmin, getBookingTrends);
router.get('/users/growth', isUserAdmin, getUserGrowthMetrics);
router.get('/payments/analytics', isFinanceAdmin, getPaymentAnalytics);
router.get('/geographic-analysis', isReportAdmin, getGeographicAnalysis);

module.exports = router;
