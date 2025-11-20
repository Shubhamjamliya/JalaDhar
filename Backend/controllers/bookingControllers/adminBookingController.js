const Booking = require('../../models/Booking');
const Vendor = require('../../models/Vendor');
const Payment = require('../../models/Payment');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../utils/constants');
const { sendSettlementNotificationEmail } = require('../../services/emailService');

/**
 * Get all bookings with filters
 */
const getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'vendor.name': { $regex: search, $options: 'i' } },
        { 'service.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('vendor', 'name email phone')
        .populate('service', 'name price')
        .sort(sort)
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
          totalBookings: total
        }
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
      error: error.message
    });
  }
};

/**
 * Approve borewell result (success or failure)
 */
const approveBorewellResult = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;
    const { approved } = req.body; // true for success, false for failure

    const booking = await Booking.findOne({
      _id: bookingId,
      status: { $in: [BOOKING_STATUS.SUCCESS, BOOKING_STATUS.FAILED] },
      'borewellResult.status': { $in: ['SUCCESS', 'FAILED'] }
    })
      .populate('vendor', 'name email')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or result not uploaded'
      });
    }

    if (booking.borewellResult.approvedAt) {
      return res.status(400).json({
        success: false,
        message: 'Borewell result already approved'
      });
    }

    // Update booking
    booking.borewellResult.approvedAt = new Date();
    booking.borewellResult.approvedBy = adminId;
    booking.status = approved ? BOOKING_STATUS.SUCCESS : BOOKING_STATUS.FAILED;

    // Calculate vendor settlement
    const settlementAmount = booking.payment.totalAmount * 0.5; // 50% of total
    const incentive = approved ? booking.payment.totalAmount * 0.1 : 0; // 10% incentive for success
    const penalty = !approved ? booking.payment.totalAmount * 0.05 : 0; // 5% penalty for failure
    const travelCharges = 500; // Fixed travel charges (can be made configurable)

    const finalSettlement = settlementAmount + incentive - penalty + travelCharges;

    booking.payment.vendorSettlement = {
      amount: finalSettlement,
      status: 'PENDING',
      settlementType: approved ? 'SUCCESS' : 'FAILED',
      incentive,
      penalty,
      travelCharges,
      settledBy: adminId
    };

    await booking.save();

    // Update vendor success/failure count
    const vendor = await Vendor.findById(booking.vendor._id);
    if (approved) {
      vendor.rating.successCount = (vendor.rating.successCount || 0) + 1;
    } else {
      vendor.rating.failureCount = (vendor.rating.failureCount || 0) + 1;
    }
    
    // Recalculate success ratio
    const total = vendor.rating.successCount + vendor.rating.failureCount;
    vendor.rating.successRatio = total > 0 ? Math.round((vendor.rating.successCount / total) * 100) : 0;
    await vendor.save();

    // Create settlement payment record
    await Payment.create({
      booking: booking._id,
      user: booking.user._id,
      vendor: booking.vendor._id,
      paymentType: 'SETTLEMENT',
      amount: finalSettlement,
      status: PAYMENT_STATUS.PENDING,
      razorpayOrderId: `settlement_${booking._id}_${Date.now()}`,
      description: `Vendor settlement for ${approved ? 'successful' : 'failed'} borewell`
    });

    // Send notification
    try {
      await sendSettlementNotificationEmail({
        email: booking.vendor.email,
        name: booking.vendor.name,
        bookingId: booking._id.toString(),
        settlementAmount: finalSettlement,
        settlementType: approved ? 'SUCCESS' : 'FAILED',
        incentive,
        penalty
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    res.json({
      success: true,
      message: `Borewell result approved as ${approved ? 'SUCCESS' : 'FAILED'}. Vendor settlement initiated.`,
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          settlement: booking.payment.vendorSettlement
        }
      }
    });
  } catch (error) {
    console.error('Approve borewell result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve borewell result',
      error: error.message
    });
  }
};

/**
 * Process vendor settlement payment
 */
const processVendorSettlement = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      'payment.vendorSettlement.status': 'PENDING'
    }).populate('vendor', 'name email bankDetails');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or settlement already processed'
      });
    }

    // Update settlement status
    booking.payment.vendorSettlement.status = 'PROCESSING';
    booking.payment.vendorSettlement.settledAt = new Date();
    await booking.save();

    // Here you would integrate with payment gateway to transfer money to vendor
    // For now, we'll mark it as completed
    // In production, integrate with Razorpay Payouts or bank transfer API

    booking.payment.vendorSettlement.status = 'COMPLETED';
    await booking.save();

    // Update vendor payment collection
    const vendor = await Vendor.findById(booking.vendor._id);
    vendor.paymentCollection.totalEarnings += booking.payment.vendorSettlement.amount;
    vendor.paymentCollection.collectedAmount += booking.payment.vendorSettlement.amount;
    vendor.paymentCollection.lastPaymentDate = new Date();
    await vendor.save();

    // Update payment record
    const payment = await Payment.findOne({
      booking: bookingId,
      paymentType: 'SETTLEMENT'
    });

    if (payment) {
      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.paidAt = new Date();
      await payment.save();
    }

    res.json({
      success: true,
      message: 'Vendor settlement processed successfully',
      data: {
        booking: {
          id: booking._id,
          settlement: booking.payment.vendorSettlement
        }
      }
    });
  } catch (error) {
    console.error('Process vendor settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process vendor settlement',
      error: error.message
    });
  }
};

/**
 * Get booking statistics
 */
const getBookingStatistics = async (req, res) => {
  try {
    const [
      totalBookings,
      pendingBookings,
      completedBookings,
      successBookings,
      failedBookings,
      totalRevenue,
      pendingSettlements
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ASSIGNED] } }),
      Booking.countDocuments({ status: BOOKING_STATUS.COMPLETED }),
      Booking.countDocuments({ status: BOOKING_STATUS.SUCCESS }),
      Booking.countDocuments({ status: BOOKING_STATUS.FAILED }),
      Booking.aggregate([
        { $match: { 'payment.status': PAYMENT_STATUS.SUCCESS } },
        { $group: { _id: null, total: { $sum: '$payment.totalAmount' } } }
      ]),
      Booking.countDocuments({ 'payment.vendorSettlement.status': 'PENDING' })
    ]);

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        statistics: {
          totalBookings,
          pendingBookings,
          completedBookings,
          successBookings,
          failedBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          pendingSettlements
        }
      }
    });
  } catch (error) {
    console.error('Get booking statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllBookings,
  approveBorewellResult,
  processVendorSettlement,
  getBookingStatistics
};

