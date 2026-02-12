const Booking = require('../../models/Booking');
const Vendor = require('../../models/Vendor');
const Service = require('../../models/Service');
const { BOOKING_STATUS } = require('../../utils/constants');
const { validationResult } = require('express-validator');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const vendorId = req.userId;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get booking counts by status
    const [
      pendingBookings,
      assignedBookings,
      acceptedBookings,
      visitedBookings,
      completedBookings,
      todayBookings,
      totalBookings,
      totalEarnings,
      pendingEarnings,
      servicesCount
    ] = await Promise.all([
      Booking.countDocuments({ vendor: vendorId, status: BOOKING_STATUS.PENDING }),
      Booking.countDocuments({ vendor: vendorId, status: BOOKING_STATUS.ASSIGNED }),
      Booking.countDocuments({ vendor: vendorId, status: BOOKING_STATUS.ACCEPTED }),
      Booking.countDocuments({ vendor: vendorId, status: BOOKING_STATUS.VISITED }),
      Booking.countDocuments({ vendor: vendorId, status: BOOKING_STATUS.COMPLETED }),
      Booking.countDocuments({
        vendor: vendorId,
        scheduledDate: { $gte: today, $lt: tomorrow },
        status: {
          $nin: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED]
        }
      }),
      Booking.countDocuments({ vendor: vendorId }), // Total bookings (all time)
      Booking.aggregate([
        {
          $match: {
            vendor: vendorId,
            status: BOOKING_STATUS.COMPLETED,
            'payment.status': 'SUCCESS'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$payment.amount' }
          }
        }
      ]),
      Booking.aggregate([
        {
          $match: {
            vendor: vendorId,
            status: { $in: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.VISITED, BOOKING_STATUS.COMPLETED] },
            'payment.status': 'PENDING'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$payment.amount' }
          }
        }
      ]),
      Service.countDocuments({ vendor: vendorId })
    ]);

    // Get vendor payment collection data
    const vendor = await Vendor.findById(vendorId).select('paymentCollection');

    // Get recent completed bookings (last 5)
    const recentBookings = await Booking.find({
      vendor: vendorId,
      status: BOOKING_STATUS.COMPLETED
    })
      .populate('user', 'name email phone profilePicture')
      .populate('service', 'name machineType price')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status scheduledDate scheduledTime payment address user service');

    // Get active bookings (all bookings that haven't reached terminal status)
    const upcomingBookings = await Booking.find({
      vendor: vendorId,
      status: {
        $nin: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED]
      }
    })
      .populate('user', 'name email phone profilePicture')
      .populate('service', 'name machineType price')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('status scheduledDate scheduledTime address user service');

    res.json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        stats: {
          pendingBookings,
          assignedBookings,
          acceptedBookings,
          visitedBookings,
          completedBookings,
          todayBookings,
          totalBookings,
          servicesCount,
          totalEarnings: totalEarnings[0]?.total || 0,
          pendingEarnings: pendingEarnings[0]?.total || 0,
          paymentCollection: vendor?.paymentCollection || {
            totalEarnings: 0,
            pendingAmount: 0,
            collectedAmount: 0
          }
        },
        recentBookings,
        upcomingBookings
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard stats',
      error: error.message
    });
  }
};

/**
 * Get new booking requests (pending bookings)
 */
const getNewBookings = async (req, res) => {
  try {
    const vendorId = req.userId;
    const { page = 1, limit = 10, status } = req.query;

    const query = { vendor: vendorId };

    // Filter by status if provided, otherwise get pending bookings
    if (status) {
      query.status = status;
    } else {
      query.status = BOOKING_STATUS.PENDING;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('service', 'name machineType price duration')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBookings: total,
          hasNext: skip + bookings.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get new bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
      error: error.message
    });
  }
};

/**
 * Get booking history with filters
 */
const getBookingHistory = async (req, res) => {
  try {
    const vendorId = req.userId;
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { vendor: vendorId };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('service', 'name machineType price duration')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Booking history retrieved successfully',
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBookings: total,
          hasNext: skip + bookings.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking history',
      error: error.message
    });
  }
};

/**
 * Accept a booking
 */
const acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      status: BOOKING_STATUS.PENDING
    }).populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already processed'
      });
    }

    // Update booking status
    booking.status = BOOKING_STATUS.ACCEPTED;
    await booking.save();

    // TODO: Send notification to user about booking acceptance
    // await sendNotification({
    //   userId: booking.user._id,
    //   type: 'BOOKING_ACCEPTED',
    //   message: `Your booking has been accepted by ${req.user.name}`
    // });

    res.json({
      success: true,
      message: 'Booking accepted successfully',
      data: {
        booking
      }
    });
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept booking',
      error: error.message
    });
  }
};

/**
 * Reject a booking
 */
const rejectBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { bookingId } = req.params;
    const { rejectionReason } = req.body;
    const vendorId = req.userId;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      status: BOOKING_STATUS.PENDING
    }).populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already processed'
      });
    }

    // Update booking status
    booking.status = BOOKING_STATUS.REJECTED;
    booking.rejectionReason = rejectionReason.trim();
    await booking.save();

    // TODO: Send notification to user about booking rejection
    // await sendNotification({
    //   userId: booking.user._id,
    //   type: 'BOOKING_REJECTED',
    //   message: `Your booking has been rejected. Reason: ${rejectionReason}`
    // });

    res.json({
      success: true,
      message: 'Booking rejected successfully',
      data: {
        booking
      }
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject booking',
      error: error.message
    });
  }
};

/**
 * Mark booking as visited
 */
const markAsVisited = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      status: BOOKING_STATUS.ACCEPTED
    }).populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in accepted status'
      });
    }

    // Update booking status
    booking.status = BOOKING_STATUS.VISITED;
    booking.visitedAt = new Date();
    await booking.save();

    // TODO: Send notification to user
    // await sendNotification({
    //   userId: booking.user._id,
    //   type: 'BOOKING_VISITED',
    //   message: `Vendor has visited your location`
    // });

    res.json({
      success: true,
      message: 'Booking marked as visited successfully',
      data: {
        booking
      }
    });
  } catch (error) {
    console.error('Mark as visited error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark booking as visited',
      error: error.message
    });
  }
};

/**
 * Mark booking as completed
 */
const markAsCompleted = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      status: BOOKING_STATUS.VISITED
    }).populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in visited status'
      });
    }

    // Update booking status
    booking.status = BOOKING_STATUS.COMPLETED;
    booking.completedAt = new Date();

    // Update vendor payment collection
    const vendor = await Vendor.findById(vendorId);
    if (vendor) {
      vendor.paymentCollection.totalEarnings += booking.payment.amount;
      if (booking.payment.status === 'SUCCESS') {
        vendor.paymentCollection.collectedAmount += booking.payment.amount;
      } else {
        vendor.paymentCollection.pendingAmount += booking.payment.amount;
      }
      vendor.paymentCollection.lastPaymentDate = new Date();
      await vendor.save();
    }

    await booking.save();

    // TODO: Send notification to user
    // await sendNotification({
    //   userId: booking.user._id,
    //   type: 'BOOKING_COMPLETED',
    //   message: `Service has been completed`
    // });

    res.json({
      success: true,
      message: 'Booking marked as completed successfully',
      data: {
        booking,
        paymentCollection: vendor?.paymentCollection
      }
    });
  } catch (error) {
    console.error('Mark as completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark booking as completed',
      error: error.message
    });
  }
};

/**
 * Schedule/Update visit time
 */
const scheduleVisit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { bookingId } = req.params;
    const { scheduledDate, scheduledTime } = req.body;
    const vendorId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED] }
    }).populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be rescheduled'
      });
    }

    // Update scheduled date and time
    booking.scheduledDate = new Date(scheduledDate);
    booking.scheduledTime = scheduledTime;

    // If status is PENDING, change to ACCEPTED
    if (booking.status === BOOKING_STATUS.PENDING) {
      booking.status = BOOKING_STATUS.ACCEPTED;
    }

    await booking.save();

    // TODO: Send notification to user about schedule update
    // await sendNotification({
    //   userId: booking.user._id,
    //   type: 'BOOKING_SCHEDULED',
    //   message: `Visit scheduled for ${scheduledDate} at ${scheduledTime}`
    // });

    res.json({
      success: true,
      message: 'Visit scheduled successfully',
      data: {
        booking
      }
    });
  } catch (error) {
    console.error('Schedule visit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule visit',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getNewBookings,
  getBookingHistory,
  acceptBooking,
  rejectBooking,
  markAsVisited,
  markAsCompleted,
  scheduleVisit
};

