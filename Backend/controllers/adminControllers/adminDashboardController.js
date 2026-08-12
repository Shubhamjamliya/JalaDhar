const mongoose = require('mongoose');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const Booking = require('../../models/Booking');
const Dispute = require('../../models/Dispute');
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

    // 5. Total Revenue (Realized Collected Cash = Advance + Paid Balance)
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
          totalRevenue: {
            $sum: {
              $add: [
                { $ifNull: ["$payment.advanceAmount", { $multiply: ["$payment.totalAmount", 0.4] }] },
                {
                  $cond: [
                    { $eq: ["$payment.remainingPaymentStatus", "PAID"] },
                    { $ifNull: ["$payment.remainingAmount", { $multiply: ["$payment.totalAmount", 0.6] }] },
                    0
                  ]
                }
              ]
            }
          }
        }
      }
    ]);

    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    // 6. Today's Activity Stats
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todaysNewBookings, todaysCompletedBookings, todaysNewUsers, todaysNewVendors, todaysRevenueAgg] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: startOfToday } }),
      Booking.countDocuments({
        createdAt: { $gte: startOfToday },
        status: { $in: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE] }
      }),
      User.countDocuments({ createdAt: { $gte: startOfToday }, role: 'USER' }),
      Vendor.countDocuments({ createdAt: { $gte: startOfToday } }),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfToday },
            status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED] }
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [
                  { $ifNull: ["$payment.advanceAmount", { $multiply: ["$payment.totalAmount", 0.4] }] },
                  {
                    $cond: [
                      { $eq: ["$payment.remainingPaymentStatus", "PAID"] },
                      { $ifNull: ["$payment.remainingAmount", { $multiply: ["$payment.totalAmount", 0.6] }] },
                      0
                    ]
                  }
                ]
              }
            }
          }
        }
      ])
    ]);

    const todaysRevenue = todaysRevenueAgg.length > 0 ? todaysRevenueAgg[0].total : 0;

    // 7. Pending Actions Counts
    const [pendingVendorsCount, openDisputesCount, pendingSettlementsCount, unassignedBookingsCount] = await Promise.all([
      Vendor.countDocuments({ isApproved: false }),
      Dispute.countDocuments({ status: { $in: ['PENDING', 'IN_PROGRESS'] } }),
      Booking.countDocuments({
        'borewellResult.status': { $in: ['SUCCESS', 'FAILED'] },
        vendorStatus: { $ne: BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE }
      }),
      Booking.countDocuments({ status: BOOKING_STATUS.PENDING })
    ]);

    // 8. Platform Fees breakdown (10% platform fee standard)
    const platformFeeEarnings = Math.round(totalRevenue * 0.10);
    const vendorNetPayouts = totalRevenue - platformFeeEarnings;

    // 9. Recent Bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email mobile')
      .populate('vendor', 'name businessName phone')
      .populate('service', 'name')
      .select('status payment.totalAmount createdAt user vendor service');

    // 10. Top Expert Performance Aggregation
    const topExpertsAgg = await Booking.aggregate([
      {
        $match: {
          vendor: { $ne: null },
          status: { $in: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE] }
        }
      },
      {
        $group: {
          _id: "$vendor",
          completedJobs: { $sum: 1 },
          totalRevenue: { $sum: "$payment.totalAmount" }
        }
      },
      { $sort: { completedJobs: -1, totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    const topVendorIds = topExpertsAgg.map(item => item._id);
    const vendorDocs = await Vendor.find({ _id: { $in: topVendorIds } }).select('name businessName phone designation rating avatar experience');

    const expertPerformance = topExpertsAgg.map(item => {
      const v = vendorDocs.find(doc => doc._id.toString() === item._id.toString());
      const numRating = v && v.rating ? (typeof v.rating === 'object' ? (v.rating.averageRating || 4.9) : v.rating) : 4.9;
      return {
        vendorId: item._id,
        name: v ? (v.name || v.businessName || 'Expert Partner') : 'Expert Partner',
        phone: v ? v.phone : '',
        designation: v ? (v.designation || 'Hydrogeologist') : 'Hydrogeologist',
        completedJobs: item.completedJobs,
        totalRevenue: item.totalRevenue,
        rating: Number(numRating || 4.9)
      };
    });

    // 11. Urgent Alerts
    const alerts = [];
    if (pendingVendorsCount > 0) {
      alerts.push({
        id: 'pending_vendors',
        title: 'Pending Expert Approvals',
        message: `${pendingVendorsCount} expert applications are waiting for KYC document verification`,
        type: 'warning',
        link: '/admin/approvals',
        count: pendingVendorsCount
      });
    }
    if (openDisputesCount > 0) {
      alerts.push({
        id: 'open_disputes',
        title: 'Unresolved Client Disputes',
        message: `${openDisputesCount} customer disputes require immediate administrative review`,
        type: 'critical',
        link: '/admin/disputes',
        count: openDisputesCount
      });
    }
    if (unassignedBookingsCount > 0) {
      alerts.push({
        id: 'unassigned_bookings',
        title: 'Unassigned Booking Requests',
        message: `${unassignedBookingsCount} booking requests are pending vendor assignment`,
        type: 'info',
        link: '/admin/bookings',
        count: unassignedBookingsCount
      });
    }
    if (pendingSettlementsCount > 0) {
      alerts.push({
        id: 'pending_payouts',
        title: 'Borewell Payout Settlements',
        message: `${pendingSettlementsCount} completed jobs require final payout processing`,
        type: 'warning',
        link: '/admin/payments',
        count: pendingSettlementsCount
      });
    }

    // Return Data
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalVendors,
          pendingBookings: activeBookings,
          completedBookings,
          totalRevenue,
          todayRevenue: todaysRevenue,
          todaysNewBookings,
          todaysCompletedBookings,
          todaysNewUsers,
          todaysNewVendors,
          platformFeeEarnings,
          vendorNetPayouts
        },
        todaysActivity: {
          revenue: todaysRevenue,
          newBookings: todaysNewBookings,
          completedBookings: todaysCompletedBookings,
          newUsers: todaysNewUsers,
          newVendors: todaysNewVendors
        },
        pendingActions: {
          pendingVendors: pendingVendorsCount,
          openDisputes: openDisputesCount,
          pendingSettlements: pendingSettlementsCount,
          unassignedBookings: unassignedBookingsCount
        },
        platformFees: {
          totalGrossVolume: totalRevenue,
          platformFeeEarnings,
          vendorNetPayouts,
          feePercentage: 10
        },
        expertPerformance,
        alerts,
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
          revenue: {
            $sum: {
              $add: [
                { $ifNull: ["$payment.advanceAmount", { $multiply: ["$payment.totalAmount", 0.4] }] },
                {
                  $cond: [
                    { $eq: ["$payment.remainingPaymentStatus", "PAID"] },
                    { $ifNull: ["$payment.remainingAmount", { $multiply: ["$payment.totalAmount", 0.6] }] },
                    0
                  ]
                }
              ]
            }
          },
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
/**
 * Get Geographic Analysis for Users, Vendors and Bookings
 * @route GET /api/admin/dashboard/geographic-analysis
 */
exports.getGeographicAnalysis = async (req, res) => {
  try {
    const { type = 'district' } = req.query; // type can be village, mandal, district, state

    // 1. Aggregate Bookings by Location
    const bookingLocationStats = await Booking.aggregate([
      {
        $group: {
          _id: `$${type}`, // Dynamic grouping based on type
          count: { $sum: 1 },
          totalRevenue: { $sum: "$payment.totalAmount" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 2. Aggregate Users by Location
    // Since User model doesn't have explicit village/mandal/district fields in address object
    // We'll use city as district/mandal for now or state
    let userGroupField = "address.city";
    if (type === 'state') userGroupField = "address.state";

    const userLocationStats = await User.aggregate([
      { $match: { role: 'USER' } },
      {
        $group: {
          _id: `$${userGroupField}`,
          count: { $sum: 1 }
        }
      }
    ]);

    // 3. Aggregate Vendors by Location
    const vendorLocationStats = await Vendor.aggregate([
      {
        $group: {
          _id: `$${userGroupField}`,
          count: { $sum: 1 }
        }
      }
    ]);

    // 4. Merge results for comprehensive view
    // Create a set of all unique locations across all data sets
    const allLocations = new Set([
      ...bookingLocationStats.map(s => s._id),
      ...userLocationStats.map(s => s._id),
      ...vendorLocationStats.map(s => s._id)
    ]);

    const analysis = Array.from(allLocations).map(location => {
      const bookingStat = bookingLocationStats.find(b => b._id === location);
      const userStat = userLocationStats.find(u => u._id === location);
      const vendorStat = vendorLocationStats.find(v => v._id === location);

      const bookingsCount = bookingStat ? bookingStat.count : 0;
      const vendorsCount = vendorStat ? vendorStat.count : 0;

      return {
        location: location || 'Unknown',
        bookings: bookingsCount,
        revenue: bookingStat ? bookingStat.totalRevenue : 0,
        users: userStat ? userStat.count : 0,
        vendors: vendorsCount,
        // Calculate supply-demand ratio
        supplyDemandRatio: bookingsCount > 0 ? vendorsCount / bookingsCount : (vendorsCount > 0 ? 999 : 0)
      };
    }).sort((a, b) => b.bookings - a.bookings);

    res.status(200).json({
      success: true,
      data: {
        type,
        analysis
      }
    });

  } catch (error) {
    console.error('Error in getGeographicAnalysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geographic analysis',
      error: error.message
    });
  }
};

/**
 * Get dynamic notification badge counts for Admin Sidebar menu items
 * @route GET /api/admin/dashboard/sidebar-counts
 */
exports.getSidebarCounts = async (req, res) => {
  try {
    const [
      pendingVendors,
      pendingDisputes,
      pendingSettlements,
      activeBookings
    ] = await Promise.all([
      Vendor.countDocuments({ isApproved: false }),
      Dispute.countDocuments({ status: { $in: ['PENDING', 'IN_PROGRESS'] } }),
      Booking.countDocuments({
        'borewellResult.status': { $in: ['SUCCESS', 'FAILED'] },
        'borewellResult.uploadedAt': { $exists: true },
        vendorStatus: { $ne: BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE },
        $or: [
          { finalSettlement: { $exists: false } },
          { 'finalSettlement.status': { $ne: 'PROCESSED' } }
        ]
      }),
      Booking.countDocuments({
        status: {
          $in: [
            BOOKING_STATUS.PENDING,
            BOOKING_STATUS.ASSIGNED,
            BOOKING_STATUS.ACCEPTED,
            BOOKING_STATUS.VISITED,
            BOOKING_STATUS.REPORT_UPLOADED,
            BOOKING_STATUS.PAYMENT_SUCCESS,
            BOOKING_STATUS.ADMIN_APPROVED,
            BOOKING_STATUS.BOREWELL_UPLOADED
          ]
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          approvals: pendingVendors,
          disputes: pendingDisputes,
          payments: pendingSettlements,
          bookings: activeBookings
        }
      }
    });
  } catch (error) {
    console.error('Error in getSidebarCounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sidebar counts',
      error: error.message
    });
  }
};
