const mongoose = require('mongoose');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const Booking = require('../../models/Booking');
const { BOOKING_STATUS } = require('../../utils/constants');

/**
 * Get Dashboard Stats
 * @route GET /api/admin/dashboard/stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Users
    const totalUsers = await User.countDocuments({ role: 'USER' });

    // 2. Total Vendors
    const totalVendors = await Vendor.countDocuments();

    // 3. Pending/Active Bookings
    // Consider everything not completed/cancelled/rejected as active
    const activeBookings = await Booking.countDocuments({
      status: {
        $nin: [
          BOOKING_STATUS.COMPLETED,
          BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE,
          BOOKING_STATUS.CANCELLED,
          BOOKING_STATUS.REJECTED
        ]
      }
    });

    // 4. Completed Bookings
    const completedBookings = await Booking.countDocuments({
      status: {
        $in: [
          BOOKING_STATUS.COMPLETED,
          BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE
        ]
      }
    });

    // 5. Total Revenue
    // Sum of payment.totalAmount for all non-cancelled bookings
    const revenueAggregation = await Booking.aggregate([
      {
        $match: {
          status: {
            $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$payment.totalAmount" }
        }
      }
    ]);

    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    // 6. Recent Bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email mobile')
      .populate('vendor', 'name businessName')
      .populate('service', 'name')
      .select('status payment.totalAmount createdAt user vendor service');

    // Return Data
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalVendors,
          pendingBookings: activeBookings,
          completedBookings,
          totalRevenue
        },
        recentBookings
      }
    });

  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get Revenue Analytics
 * @route GET /api/admin/dashboard/revenue
 */
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Ensure start is set to beginning of day and end to end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    let dateFormat;
    if (period === 'monthly') {
      dateFormat = '%Y-%m-01'; // Group by YYYY-MM
    } else if (period === 'yearly') {
      dateFormat = '%Y-01-01'; // Group by YYYY
    } else {
      dateFormat = '%Y-%m-%d'; // Group by YYYY-MM-DD
    }

    const revenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          revenue: { $sum: "$payment.totalAmount" },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        revenueData
      }
    });

  } catch (error) {
    console.error('Error in getRevenueAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message
    });
  }
};

/**
 * Get Booking Trends
 * @route GET /api/admin/dashboard/bookings/trends
 */
exports.getBookingTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    start.setHours(0, 0, 0, 0);

    const trends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE]
                  ]
                },
                1,
                0
              ]
            }
          },
          cancelled: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED]
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: { trends }
    });
  } catch (error) {
    console.error('Error in getBookingTrends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking trends',
      error: error.message
    });
  }
};

/**
 * Get User Growth Metrics
 * @route GET /api/admin/dashboard/users/growth
 */
exports.getUserGrowthMetrics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    start.setHours(0, 0, 0, 0);

    const [userGrowth, vendorGrowth] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: start }, role: 'USER' } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Vendor.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        userGrowth,
        vendorGrowth
      }
    });
  } catch (error) {
    console.error('Error in getUserGrowthMetrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch growth metrics',
      error: error.message
    });
  }
};

/**
 * Get Payment Analytics
 * @route GET /api/admin/dashboard/payments/analytics
 */
exports.getPaymentAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    start.setHours(0, 0, 0, 0);

    const [statusDistribution, transactionTrend] = await Promise.all([
      Booking.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: "$payment.status",
            count: { $sum: 1 },
            amount: { $sum: "$payment.totalAmount" }
          }
        }
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalAmount: { $sum: "$payment.totalAmount" },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusDistribution,
        transactionTrend
      }
    });
  } catch (error) {
    console.error('Error in getPaymentAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment analytics',
      error: error.message
    });
  }
};
