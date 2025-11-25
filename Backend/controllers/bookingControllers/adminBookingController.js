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
      status: BOOKING_STATUS.BOREWELL_UPLOADED,
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
    // When admin approves borewell result:
    // - User status: ADMIN_APPROVED (user waiting for final settlement/refund)
    // - Vendor status: APPROVED (vendor waiting for pay_second/second installment)
    // - Main status: ADMIN_APPROVED
    booking.status = BOOKING_STATUS.ADMIN_APPROVED;
    booking.userStatus = BOOKING_STATUS.ADMIN_APPROVED;
    booking.vendorStatus = BOOKING_STATUS.APPROVED; // Ready for pay_second (second installment)

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
    // When admin processes vendor settlement:
    // - If vendorStatus is APPROVED, update to FINAL_SETTLEMENT_COMPLETE (final settlement after borewell approval)
    // - Otherwise, set vendorStatus to PAID_FIRST (vendor received 50% + travel payment from admin, before borewell)
    // - User status: remains as is (PAYMENT_SUCCESS or BOREWELL_UPLOADED or ADMIN_APPROVED)
    if (booking.vendorStatus === BOOKING_STATUS.APPROVED) {
      // Final settlement after borewell approval
      booking.vendorStatus = BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE;
    } else if (booking.vendorStatus !== BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE) {
      // First payment (50% + travel) before borewell
      booking.vendorStatus = BOOKING_STATUS.PAID_FIRST;
    }
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

/**
 * Get all travel charges requests
 */
const getTravelChargesRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {
      'travelChargesRequest.status': status || { $ne: null }
    };

    if (status) {
      query['travelChargesRequest.status'] = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('vendor', 'name email phone')
        .populate('service', 'name price')
        .populate('travelChargesRequest.requestedBy', 'name email')
        .populate('travelChargesRequest.reviewedBy', 'name email')
        .sort({ 'travelChargesRequest.requestedAt': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Travel charges requests retrieved successfully',
      data: {
        requests: bookings.map(booking => ({
          bookingId: booking._id,
          bookingStatus: booking.status,
          user: booking.user,
          vendor: booking.vendor,
          service: booking.service,
          travelChargesRequest: booking.travelChargesRequest,
          createdAt: booking.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get travel charges requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve travel charges requests',
      error: error.message
    });
  }
};

/**
 * Approve travel charges request
 */
const approveTravelCharges = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;

    const booking = await Booking.findById(bookingId)
      .populate('vendor', 'name email')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!booking.travelChargesRequest || booking.travelChargesRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'No pending travel charges request found for this booking'
      });
    }

    // Update travel charges request
    booking.travelChargesRequest.status = 'APPROVED';
    booking.travelChargesRequest.reviewedAt = new Date();
    booking.travelChargesRequest.reviewedBy = adminId;

    // Update vendor settlement travel charges
    if (!booking.payment.vendorSettlement) {
      booking.payment.vendorSettlement = {};
    }
    booking.payment.vendorSettlement.travelCharges = booking.travelChargesRequest.amount;

    // When admin approves travel charges, vendor status remains as is (REPORT_UPLOADED)
    // The status will change when admin processes the 50% payment

    await booking.save();

    res.json({
      success: true,
      message: 'Travel charges request approved successfully',
      data: {
        booking: {
          id: booking._id,
          travelChargesRequest: booking.travelChargesRequest
        }
      }
    });
  } catch (error) {
    console.error('Approve travel charges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve travel charges request',
      error: error.message
    });
  }
};

/**
 * Pay travel charges to vendor
 */
const payTravelCharges = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;

    const booking = await Booking.findById(bookingId)
      .populate('vendor', 'name email bankDetails paymentCollection');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!booking.travelChargesRequest || booking.travelChargesRequest.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Travel charges request is not approved or does not exist'
      });
    }

    if (booking.travelChargesRequest.paid) {
      return res.status(400).json({
        success: false,
        message: 'Travel charges have already been paid'
      });
    }

    // Mark travel charges as paid
    booking.travelChargesRequest.paid = true;
    booking.travelChargesRequest.paidAt = new Date();
    booking.travelChargesRequest.paidBy = adminId;
    await booking.save();

    // Update vendor payment collection
    const vendor = await Vendor.findById(booking.vendor._id || booking.vendor);
    if (!vendor.paymentCollection) {
      vendor.paymentCollection = {
        totalEarnings: 0,
        collectedAmount: 0,
        pendingAmount: 0
      };
    }
    vendor.paymentCollection.totalEarnings += booking.travelChargesRequest.amount;
    vendor.paymentCollection.collectedAmount += booking.travelChargesRequest.amount;
    vendor.paymentCollection.lastPaymentDate = new Date();
    await vendor.save();

    // Create payment record
    await Payment.create({
      booking: booking._id,
      user: booking.user?._id || booking.user,
      vendor: booking.vendor._id || booking.vendor,
      paymentType: 'TRAVEL_CHARGES',
      amount: booking.travelChargesRequest.amount,
      status: PAYMENT_STATUS.SUCCESS,
      razorpayOrderId: `travel_${booking._id}_${Date.now()}`,
      paidAt: new Date(),
      description: `Travel charges payment for booking ${booking._id}`
    });

    res.json({
      success: true,
      message: 'Travel charges paid successfully',
      data: {
        booking: {
          id: booking._id,
          travelChargesRequest: booking.travelChargesRequest
        }
      }
    });
  } catch (error) {
    console.error('Pay travel charges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pay travel charges',
      error: error.message
    });
  }
};

/**
 * Approve report (without payment)
 */
const approveReport = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;

    const booking = await Booking.findById(bookingId)
      .populate('vendor', 'name email')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if report is uploaded
    if (!booking.report || !booking.reportUploadedAt) {
      return res.status(400).json({
        success: false,
        message: 'Report must be uploaded before approval'
      });
    }

    // Check if already approved
    if (booking.report.approvedAt) {
      return res.status(400).json({
        success: false,
        message: 'Report already approved'
      });
    }

    // Check if vendor status is correct
    if (booking.vendorStatus !== BOOKING_STATUS.REPORT_UPLOADED && 
        booking.vendorStatus !== BOOKING_STATUS.AWAITING_PAYMENT) {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in correct status for report approval'
      });
    }

    // Approve the report
    booking.report.approvedAt = new Date();
    booking.report.approvedBy = adminId;
    
    // Update vendor status to AWAITING_PAYMENT (ready for payment from payments page)
    booking.vendorStatus = BOOKING_STATUS.AWAITING_PAYMENT;
    
    await booking.save();

    res.json({
      success: true,
      message: 'Report approved successfully. Payment can now be processed from payments page.',
      data: {
        booking: {
          id: booking._id,
          vendorStatus: booking.vendorStatus,
          report: {
            approvedAt: booking.report.approvedAt,
            approvedBy: booking.report.approvedBy
          }
        }
      }
    });
  } catch (error) {
    console.error('Approve report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve report',
      error: error.message
    });
  }
};

/**
 * Reject report
 */
const rejectReport = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required and must be at least 10 characters'
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate('vendor', 'name email')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if report is uploaded
    if (!booking.report || !booking.reportUploadedAt) {
      return res.status(400).json({
        success: false,
        message: 'Report must be uploaded before rejection'
      });
    }

    // Check if already approved or rejected
    if (booking.report.approvedAt) {
      return res.status(400).json({
        success: false,
        message: 'Report already approved. Cannot reject an approved report.'
      });
    }

    // Check if vendor status is correct
    if (booking.vendorStatus !== BOOKING_STATUS.REPORT_UPLOADED && 
        booking.vendorStatus !== BOOKING_STATUS.AWAITING_PAYMENT) {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in correct status for report rejection'
      });
    }

    // Add rejection fields to report (we can add rejectedAt, rejectedBy if needed)
    // For now, we'll just update the booking status and add rejection reason
    booking.report.rejectedAt = new Date();
    booking.report.rejectedBy = adminId;
    booking.report.rejectionReason = rejectionReason.trim();
    
    // Revert vendor status back to REPORT_UPLOADED so vendor can re-upload
    booking.vendorStatus = BOOKING_STATUS.REPORT_UPLOADED;
    
    await booking.save();

    res.json({
      success: true,
      message: 'Report rejected successfully. Vendor can re-upload the report.',
      data: {
        booking: {
          id: booking._id,
          vendorStatus: booking.vendorStatus,
          report: {
            rejectedAt: booking.report.rejectedAt,
            rejectedBy: booking.report.rejectedBy,
            rejectionReason: booking.report.rejectionReason
          }
        }
      }
    });
  } catch (error) {
    console.error('Reject report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject report',
      error: error.message
    });
  }
};

/**
 * Pay first installment (50%) to vendor after report upload
 */
const payFirstInstallment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;

    const booking = await Booking.findById(bookingId)
      .populate('vendor', 'name email bankDetails paymentCollection')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if report is uploaded
    if (!booking.report || !booking.reportUploadedAt) {
      return res.status(400).json({
        success: false,
        message: 'Report must be uploaded before paying first installment'
      });
    }

    // Check if report is approved
    if (!booking.report.approvedAt) {
      return res.status(400).json({
        success: false,
        message: 'Report must be approved before paying first installment. Please approve the report from the approvals page first.'
      });
    }

    // Check if vendor status is correct
    if (booking.vendorStatus !== BOOKING_STATUS.REPORT_UPLOADED && 
        booking.vendorStatus !== BOOKING_STATUS.AWAITING_PAYMENT) {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in correct status for first installment payment'
      });
    }

    // Check if already paid
    if (booking.firstInstallment?.paid) {
      return res.status(400).json({
        success: false,
        message: 'First installment has already been paid'
      });
    }

    // Calculate first installment amount (50% of total)
    const firstInstallmentAmount = booking.payment.totalAmount * 0.5;

    // Mark first installment as paid
    booking.firstInstallment = {
      amount: firstInstallmentAmount,
      paid: true,
      paidAt: new Date(),
      paidBy: adminId
    };

    // Update vendor status from REPORT_UPLOADED/AWAITING_PAYMENT to PAID_FIRST
    booking.vendorStatus = BOOKING_STATUS.PAID_FIRST;
    await booking.save();

    // Update vendor payment collection
    const vendor = await Vendor.findById(booking.vendor._id || booking.vendor);
    if (!vendor.paymentCollection) {
      vendor.paymentCollection = {
        totalEarnings: 0,
        collectedAmount: 0,
        pendingAmount: 0
      };
    }
    vendor.paymentCollection.totalEarnings += firstInstallmentAmount;
    vendor.paymentCollection.collectedAmount += firstInstallmentAmount;
    vendor.paymentCollection.lastPaymentDate = new Date();
    await vendor.save();

    // Create payment record
    await Payment.create({
      booking: booking._id,
      user: booking.user?._id || booking.user,
      vendor: booking.vendor._id || booking.vendor,
      paymentType: 'SETTLEMENT',
      amount: firstInstallmentAmount,
      status: PAYMENT_STATUS.SUCCESS,
      razorpayOrderId: `first_installment_${booking._id}_${Date.now()}`,
      paidAt: new Date(),
      description: `First installment (50%) payment for booking ${booking._id}`
    });

    res.json({
      success: true,
      message: 'First installment (50%) paid successfully. Vendor status updated to COMPLETED.',
      data: {
        booking: {
          id: booking._id,
          vendorStatus: booking.vendorStatus,
          firstInstallment: booking.firstInstallment
        }
      }
    });
  } catch (error) {
    console.error('Pay first installment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pay first installment',
      error: error.message
    });
  }
};

/**
 * Pay second installment (Final Settlement - 50% Remaining) with manual incentive/penalty
 */
const paySecondInstallment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;
    const { incentive = 0, penalty = 0 } = req.body; // Admin provides incentive (for success) or penalty (for failure)

    const booking = await Booking.findById(bookingId)
      .populate('vendor', 'name email bankDetails paymentCollection')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if borewell result is uploaded and approved
    if (!booking.borewellResult || !booking.borewellResult.uploadedAt) {
      return res.status(400).json({
        success: false,
        message: 'Borewell result not yet uploaded by user'
      });
    }

    if (!booking.borewellResult.approvedAt) {
      return res.status(400).json({
        success: false,
        message: 'Borewell result not yet approved by admin'
      });
    }

    // Check if second installment already paid
    if (booking.payment?.vendorSettlement?.status === 'COMPLETED' && booking.vendorStatus === BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE) {
      return res.status(400).json({
        success: false,
        message: 'Second installment already paid'
      });
    }

    // Get borewell result status
    const isSuccess = booking.borewellResult.status === 'SUCCESS';
    const baseAmount = booking.payment.totalAmount * 0.5; // 50% of total

    // Calculate final settlement amount
    let finalAmount;
    let settlementIncentive = 0;
    let settlementPenalty = 0;

    if (isSuccess) {
      // Success: 50% + incentive
      settlementIncentive = incentive || 0;
      finalAmount = baseAmount + settlementIncentive;
    } else {
      // Failure: 50% - penalty
      settlementPenalty = penalty || 0;
      finalAmount = Math.max(0, baseAmount - settlementPenalty); // Ensure non-negative
    }

    // Update vendor settlement
    if (!booking.payment.vendorSettlement) {
      booking.payment.vendorSettlement = {};
    }
    booking.payment.vendorSettlement.amount = finalAmount;
    booking.payment.vendorSettlement.status = 'COMPLETED';
    booking.payment.vendorSettlement.settlementType = isSuccess ? 'SUCCESS' : 'FAILED';
    booking.payment.vendorSettlement.incentive = settlementIncentive;
    booking.payment.vendorSettlement.penalty = settlementPenalty;
    booking.payment.vendorSettlement.settledAt = new Date();
    booking.payment.vendorSettlement.settledBy = adminId;

    // Update statuses
    // First set to FINAL_SETTLEMENT (processing)
    booking.userStatus = BOOKING_STATUS.FINAL_SETTLEMENT;
    booking.vendorStatus = BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE;
    booking.status = BOOKING_STATUS.FINAL_SETTLEMENT;
    await booking.save();
    
    // After processing settlement, set both user and vendor status to COMPLETED
    booking.userStatus = BOOKING_STATUS.COMPLETED;
    booking.vendorStatus = BOOKING_STATUS.COMPLETED;
    booking.status = BOOKING_STATUS.COMPLETED;
    booking.completedAt = new Date();
    await booking.save();

    // Update vendor payment collection
    const vendor = await Vendor.findById(booking.vendor._id);
    if (!vendor.paymentCollection) {
      vendor.paymentCollection = {
        totalEarnings: 0,
        collectedAmount: 0,
        pendingAmount: 0
      };
    }
    vendor.paymentCollection.totalEarnings += finalAmount;
    vendor.paymentCollection.collectedAmount += finalAmount;
    vendor.paymentCollection.lastPaymentDate = new Date();
    await vendor.save();

    // Create or update payment record
    const existingPayment = await Payment.findOne({
      booking: booking._id,
      paymentType: 'SETTLEMENT',
      description: { $regex: /Second installment|Final settlement/i }
    });

    if (existingPayment) {
      existingPayment.amount = finalAmount;
      existingPayment.status = PAYMENT_STATUS.SUCCESS;
      existingPayment.paidAt = new Date();
      existingPayment.description = `Second installment (Final Settlement) for booking ${booking._id} - ${isSuccess ? 'SUCCESS' : 'FAILED'}${settlementIncentive > 0 ? ` + Incentive: ${settlementIncentive}` : ''}${settlementPenalty > 0 ? ` - Penalty: ${settlementPenalty}` : ''}`;
      await existingPayment.save();
    } else {
      await Payment.create({
        booking: booking._id,
        user: booking.user?._id || booking.user,
        vendor: booking.vendor._id || booking.vendor,
        paymentType: 'SETTLEMENT',
        amount: finalAmount,
        status: PAYMENT_STATUS.SUCCESS,
        razorpayOrderId: `second_installment_${booking._id}_${Date.now()}`,
        paidAt: new Date(),
        description: `Second installment (Final Settlement) for booking ${booking._id} - ${isSuccess ? 'SUCCESS' : 'FAILED'}${settlementIncentive > 0 ? ` + Incentive: ${settlementIncentive}` : ''}${settlementPenalty > 0 ? ` - Penalty: ${settlementPenalty}` : ''}`
      });
    }

    res.json({
      success: true,
      message: `Second installment (Final Settlement) paid successfully. ${isSuccess ? `Incentive: ₹${settlementIncentive.toLocaleString('en-IN')}` : `Penalty: ₹${settlementPenalty.toLocaleString('en-IN')}`}`,
      data: {
        booking: {
          id: booking._id,
          vendorStatus: booking.vendorStatus,
          settlement: booking.payment.vendorSettlement,
          finalAmount
        }
      }
    });
  } catch (error) {
    console.error('Pay second installment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pay second installment',
      error: error.message
    });
  }
};


/**
 * Reject travel charges request
 */
const rejectTravelCharges = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required and must be at least 10 characters'
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate('vendor', 'name email')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!booking.travelChargesRequest || booking.travelChargesRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'No pending travel charges request found for this booking'
      });
    }

    // Update travel charges request
    booking.travelChargesRequest.status = 'REJECTED';
    booking.travelChargesRequest.reviewedAt = new Date();
    booking.travelChargesRequest.reviewedBy = adminId;
    booking.travelChargesRequest.rejectionReason = rejectionReason.trim();

    await booking.save();

    res.json({
      success: true,
      message: 'Travel charges request rejected successfully',
      data: {
        booking: {
          id: booking._id,
          travelChargesRequest: booking.travelChargesRequest
        }
      }
    });
  } catch (error) {
    console.error('Reject travel charges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject travel charges request',
      error: error.message
    });
  }
};

/**
 * Get bookings with reports pending approval (for first installment payment)
 */
const getReportPendingApprovals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'REPORT_UPLOADED' // Default to pending approvals
    } = req.query;

    const query = {
      'report.uploadedAt': { $exists: true },
      'report.approvedAt': { $exists: false }, // Only unapproved reports
      'firstInstallment.paid': { $ne: true } // Not yet paid
    };

    // Filter by vendorStatus
    if (status === 'REPORT_UPLOADED') {
      query.vendorStatus = { $in: [BOOKING_STATUS.REPORT_UPLOADED, BOOKING_STATUS.AWAITING_PAYMENT] };
    } else if (status === 'PAID_FIRST') {
      query.vendorStatus = BOOKING_STATUS.PAID_FIRST;
      query['firstInstallment.paid'] = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('vendor', 'name email phone')
        .populate('service', 'name price')
        .sort({ 'report.uploadedAt': -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(), // Use lean() to get plain JavaScript objects for better performance
      Booking.countDocuments(query)
    ]);

    // Debug: Log report data to verify images are included
    if (bookings.length > 0) {
      console.log('Sample booking report data:', {
        bookingId: bookings[0]._id,
        hasReport: !!bookings[0].report,
        reportImages: bookings[0].report?.images,
        imagesCount: bookings[0].report?.images?.length || 0
      });
    }

    res.json({
      success: true,
      message: 'Report pending approvals retrieved successfully',
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
    console.error('Get report pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report pending approvals',
      error: error.message
    });
  }
};

/**
 * Get bookings with borewell results pending approval
 */
const getBorewellPendingApprovals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'BOREWELL_UPLOADED' // Default to pending approvals
    } = req.query;

    const query = {
      'borewellResult.uploadedAt': { $exists: true }
    };

    // Filter by userStatus for better accuracy
    if (status === 'BOREWELL_UPLOADED') {
      query.userStatus = BOOKING_STATUS.BOREWELL_UPLOADED;
      query['borewellResult.approvedAt'] = { $exists: false };
    } else if (status === 'ADMIN_APPROVED') {
      query.userStatus = BOOKING_STATUS.ADMIN_APPROVED;
      query['borewellResult.approvedAt'] = { $exists: true };
    } else if (status === 'COMPLETED') {
      query.userStatus = BOOKING_STATUS.COMPLETED;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('vendor', 'name email phone')
        .populate('service', 'name price')
        .sort({ 'borewellResult.uploadedAt': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Borewell pending approvals retrieved successfully',
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
    console.error('Get borewell pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve borewell pending approvals',
      error: error.message
    });
  }
};

/**
 * Process final settlement (includes refund if failed)
 */
const processFinalSettlement = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;
    const { incentive = 0, penalty = 0, refundAmount = 0 } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('vendor', 'name email bankDetails paymentCollection')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if borewell result is approved
    if (!booking.borewellResult?.approvedAt) {
      return res.status(400).json({
        success: false,
        message: 'Borewell result must be approved before processing final settlement'
      });
    }

    // Check if already processed
    if (booking.userStatus === BOOKING_STATUS.COMPLETED && booking.vendorStatus === BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE) {
      return res.status(400).json({
        success: false,
        message: 'Final settlement already processed'
      });
    }

    const isSuccess = booking.borewellResult.status === 'SUCCESS';
    const baseAmount = booking.payment.totalAmount * 0.5; // 50% of total

    // Calculate vendor settlement
    let vendorSettlementAmount;
    let settlementIncentive = 0;
    let settlementPenalty = 0;

    if (isSuccess) {
      settlementIncentive = incentive || 0;
      vendorSettlementAmount = baseAmount + settlementIncentive;
    } else {
      settlementPenalty = penalty || 0;
      vendorSettlementAmount = Math.max(0, baseAmount - settlementPenalty);
    }

    // Calculate user refund (if failed)
    const userRefundAmount = !isSuccess ? (refundAmount || booking.payment.remainingAmount || 0) : 0;

    // Update vendor settlement
    if (!booking.payment.vendorSettlement) {
      booking.payment.vendorSettlement = {};
    }
    booking.payment.vendorSettlement.amount = vendorSettlementAmount;
    booking.payment.vendorSettlement.status = 'COMPLETED';
    booking.payment.vendorSettlement.settlementType = isSuccess ? 'SUCCESS' : 'FAILED';
    booking.payment.vendorSettlement.incentive = settlementIncentive;
    booking.payment.vendorSettlement.penalty = settlementPenalty;
    booking.payment.vendorSettlement.settledAt = new Date();
    booking.payment.vendorSettlement.settledBy = adminId;

    // Update statuses - first set to FINAL_SETTLEMENT (processing)
    booking.userStatus = BOOKING_STATUS.FINAL_SETTLEMENT;
    booking.vendorStatus = BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE;
    booking.status = BOOKING_STATUS.FINAL_SETTLEMENT;
    await booking.save();

    // Update vendor payment collection
    const vendor = await Vendor.findById(booking.vendor._id);
    if (!vendor.paymentCollection) {
      vendor.paymentCollection = {
        totalEarnings: 0,
        collectedAmount: 0,
        pendingAmount: 0
      };
    }
    vendor.paymentCollection.totalEarnings += vendorSettlementAmount;
    vendor.paymentCollection.collectedAmount += vendorSettlementAmount;
    vendor.paymentCollection.lastPaymentDate = new Date();
    await vendor.save();

    // Create vendor settlement payment record
    await Payment.create({
      booking: booking._id,
      user: booking.user?._id || booking.user,
      vendor: booking.vendor._id || booking.vendor,
      paymentType: 'SETTLEMENT',
      amount: vendorSettlementAmount,
      status: PAYMENT_STATUS.SUCCESS,
      razorpayOrderId: `final_settlement_${booking._id}_${Date.now()}`,
      paidAt: new Date(),
      description: `Final settlement for booking ${booking._id} - ${isSuccess ? 'SUCCESS' : 'FAILED'}${settlementIncentive > 0 ? ` + Incentive: ${settlementIncentive}` : ''}${settlementPenalty > 0 ? ` - Penalty: ${settlementPenalty}` : ''}`
    });

    // Create user refund payment record (if failed)
    if (!isSuccess && userRefundAmount > 0) {
      await Payment.create({
        booking: booking._id,
        user: booking.user?._id || booking.user,
        vendor: booking.vendor._id || booking.vendor,
        paymentType: 'REFUND',
        amount: userRefundAmount,
        status: PAYMENT_STATUS.SUCCESS,
        razorpayOrderId: `refund_${booking._id}_${Date.now()}`,
        paidAt: new Date(),
        description: `Refund for failed borewell - booking ${booking._id}`
      });
    }

    // After processing settlement, set both user and vendor status to COMPLETED
    booking.userStatus = BOOKING_STATUS.COMPLETED;
    booking.vendorStatus = BOOKING_STATUS.COMPLETED;
    booking.status = BOOKING_STATUS.COMPLETED;
    booking.completedAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: `Final settlement processed successfully. ${!isSuccess && userRefundAmount > 0 ? `Refund of ₹${userRefundAmount.toLocaleString('en-IN')} processed to user.` : ''}`,
      data: {
        booking: {
          id: booking._id,
          userStatus: booking.userStatus,
          vendorStatus: booking.vendorStatus,
          settlement: booking.payment.vendorSettlement,
          refundAmount: userRefundAmount
        }
      }
    });
  } catch (error) {
    console.error('Process final settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process final settlement',
      error: error.message
    });
  }
};

/**
 * Get bookings with failed borewell results pending user refund
 */
const getPendingUserRefunds = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50
    } = req.query;

    // Find bookings where:
    // 1. Borewell result is approved
    // 2. Borewell result status is FAILED
    // 3. User status is ADMIN_APPROVED (waiting for refund)
    
    const query = {
      'borewellResult.approvedAt': { $exists: true },
      'borewellResult.status': 'FAILED',
      userStatus: BOOKING_STATUS.ADMIN_APPROVED
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const allBookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('vendor', 'name email phone')
      .populate('service', 'name price')
      .sort({ 'borewellResult.approvedAt': -1 });

    // Filter out bookings that already have a successful refund
    const bookingsWithPendingRefunds = [];
    for (const booking of allBookings) {
      const existingRefund = await Payment.findOne({
        booking: booking._id,
        paymentType: 'REFUND',
        status: PAYMENT_STATUS.SUCCESS
      });
      
      if (!existingRefund) {
        bookingsWithPendingRefunds.push(booking);
      }
    }

    const total = bookingsWithPendingRefunds.length;
    const paginatedBookings = bookingsWithPendingRefunds.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      message: 'Pending user refunds retrieved successfully',
      data: {
        bookings: paginatedBookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBookings: total
        }
      }
    });
  } catch (error) {
    console.error('Get pending user refunds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending user refunds',
      error: error.message
    });
  }
};

/**
 * Process user refund for failed borewell
 */
const processUserRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;
    const { refundAmount } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('vendor', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if borewell result is approved and failed
    if (!booking.borewellResult?.approvedAt || booking.borewellResult?.status !== 'FAILED') {
      return res.status(400).json({
        success: false,
        message: 'Booking does not have a failed borewell result approved'
      });
    }

    // Check if refund already processed
    const existingRefund = await Payment.findOne({
      booking: bookingId,
      paymentType: 'REFUND',
      status: PAYMENT_STATUS.SUCCESS
    });

    if (existingRefund) {
      return res.status(400).json({
        success: false,
        message: 'Refund already processed for this booking'
      });
    }

    // Calculate refund amount (default to remaining amount if not provided)
    const finalRefundAmount = refundAmount || booking.payment.remainingAmount || 0;

    if (finalRefundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount must be greater than 0'
      });
    }

    // Here you would integrate with Razorpay refund API
    // For now, we'll create the refund payment record
    // In production: const razorpayRefund = await createRefund(paymentId, finalRefundAmount, { reason: 'Failed borewell' });

    // Create refund payment record
    const refundPayment = await Payment.create({
      booking: booking._id,
      user: booking.user?._id || booking.user,
      vendor: booking.vendor?._id || booking.vendor,
      paymentType: 'REFUND',
      amount: finalRefundAmount,
      status: PAYMENT_STATUS.SUCCESS,
      razorpayOrderId: `refund_${booking._id}_${Date.now()}`,
      paidAt: new Date(),
      refundedAt: new Date(),
      description: `Refund for failed borewell - booking ${booking._id}`
    });

    // Update booking status - user gets refund, move to COMPLETED
    booking.userStatus = BOOKING_STATUS.COMPLETED;
    booking.status = BOOKING_STATUS.COMPLETED;
    booking.completedAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: `User refund of ₹${finalRefundAmount.toLocaleString('en-IN')} processed successfully`,
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          userStatus: booking.userStatus
        },
        refund: {
          id: refundPayment._id,
          amount: finalRefundAmount,
          status: refundPayment.status
        }
      }
    });
  } catch (error) {
    console.error('Process user refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process user refund',
      error: error.message
    });
  }
};

module.exports = {
  getAllBookings,
  approveBorewellResult,
  processVendorSettlement,
  getBookingStatistics,
  getTravelChargesRequests,
  approveTravelCharges,
  rejectTravelCharges,
  payTravelCharges,
  payFirstInstallment,
  paySecondInstallment,
  getReportPendingApprovals,
  getBorewellPendingApprovals,
  getPendingUserRefunds,
  processUserRefund,
  processFinalSettlement,
  approveReport,
  rejectReport
};

