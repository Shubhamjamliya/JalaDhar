const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

const {
  getDashboardStats,
  getRevenueAnalytics,
  getBookingTrends,
  getUserGrowthMetrics,
  getPaymentAnalytics,
  getGeographicAnalysis
} = require('../../controllers/adminControllers/adminDashboardController');

// All routes require admin authentication
router.use(authenticate, isAdmin);

router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueAnalytics);
router.get('/bookings/trends', getBookingTrends);
router.get('/users/growth', getUserGrowthMetrics);
router.get('/payments/analytics', getPaymentAnalytics);
router.get('/geographic-analysis', getGeographicAnalysis);

module.exports = router;
