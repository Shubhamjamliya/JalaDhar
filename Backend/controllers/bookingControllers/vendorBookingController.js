const Booking = require('../../models/Booking');
const { validationResult } = require('express-validator');
const { BOOKING_STATUS } = require('../../utils/constants');
const { uploadToCloudinary } = require('../../services/cloudinaryService');
const { Readable } = require('stream');
const { sendBookingStatusUpdateEmail } = require('../../services/emailService');
const { sendNotification } = require('../../services/notificationService');
const { dispatchSurveyOTP } = require('../../services/multiChannelNotificationService');
const { autoReassignBooking } = require('../../services/bookingReassignmentService');
const { creditToVendorWallet, retryFailedCredit } = require('../../services/walletService');

/**
 * Get vendor bookings
 */
const getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.userId;
    const { status, excludeStatus, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = { vendor: vendorId };
    if (status) {
      const statusArray = status.split(',');
      query.$or = [
        { vendorStatus: { $in: statusArray } },
        { status: { $in: statusArray } }
      ];
    }

    // Exclude bookings where the global booking.status is in excludeStatus list
    // This handles the case where vendorStatus is still e.g. "APPROVED" but booking.status
    // has already moved to "COMPLETED" via processVendorSettlement
    if (excludeStatus) {
      const excludeArray = excludeStatus.split(',');
      query.status = { $nin: excludeArray };
    }


    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObj = {};
    if (sortBy === 'completedAt') {
      sortObj.completedAt = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone alternatePhone address profilePicture documents.profilePicture')
        .populate('service', 'name price machineType')
        .sort(sortObj)
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
    console.error('Get vendor bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
      error: error.message
    });
  }
};

/**
 * Accept booking
 */
const acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;

    console.log(`[acceptBooking] Attempting to accept booking ${bookingId} for vendor ${vendorId}`);

    // First check if booking exists and belongs to vendor
    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId
    })
      .populate('user', 'name email')
      .populate('vendor', 'name designation companyName');

    if (!booking) {
      console.log(`[acceptBooking] Booking ${bookingId} not found or doesn't belong to vendor ${vendorId}`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to accept this booking'
      });
    }

    // Check if booking is in correct status (use vendorStatus for vendor)
    if (booking.vendorStatus !== BOOKING_STATUS.ASSIGNED && booking.status !== BOOKING_STATUS.ASSIGNED) {
      console.log(`[acceptBooking] Booking ${bookingId} status is ${booking.vendorStatus || booking.status}, expected ${BOOKING_STATUS.ASSIGNED}`);
      return res.status(400).json({
        success: false,
        message: `Booking cannot be accepted. Current status: ${booking.vendorStatus || booking.status}. Only ${BOOKING_STATUS.ASSIGNED} bookings can be accepted.`
      });
    }

    const { visitDate, scheduledTime } = req.body || {};

    booking.status = BOOKING_STATUS.ACCEPTED;
    booking.vendorStatus = BOOKING_STATUS.ACCEPTED;
    booking.userStatus = BOOKING_STATUS.ACCEPTED;
    booking.acceptedAt = new Date();
    if (visitDate) booking.scheduleDate = new Date(visitDate);
    if (scheduledTime) booking.scheduledTime = scheduledTime;
    await booking.save();

    // Format visit date & time details for user notification
    const visitDateObj = booking.scheduleDate || booking.scheduledDate;
    const formattedDate = visitDateObj 
      ? new Date(visitDateObj).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      : null;
    const timeDetail = booking.scheduledTime && booking.scheduledTime !== 'TBD'
      ? (formattedDate ? `on ${formattedDate} (${booking.scheduledTime})` : `at ${booking.scheduledTime}`)
      : (formattedDate ? `on ${formattedDate}` : '');

    // 1. Create In-App Notification (Database & Real-time Socket) — Independent of Email
    try {
      let io = null;
      try {
        const { getIO } = require('../../sockets');
        io = getIO();
      } catch (e) {
        console.log('[acceptBooking] Socket.io not initialized yet');
      }

      const expertCategory = booking.vendor?.designation || 'Groundwater Professional';
      const vendorName = booking.vendor?.name ? `${booking.vendor.name} (${expertCategory})` : `a specialized ${expertCategory.toLowerCase()}`;

      await sendNotification({
        recipient: booking.user._id,
        recipientModel: 'User',
        type: 'BOOKING_ACCEPTED',
        title: 'Booking Accepted & Visit Scheduled',
        message: `Your booking has been accepted by ${vendorName}.${timeDetail ? ` Visit scheduled ${timeDetail}.` : ''}`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        },
        metadata: {
          vendorName: booking.vendor?.name,
          expertCategory: expertCategory,
          bookingId: booking._id.toString(),
          scheduledTime: booking.scheduledTime,
          scheduleDate: booking.scheduleDate || booking.scheduledDate
        }
      }, io);
      console.log(`[acceptBooking] Notification successfully saved & sent for user ${booking.user._id}`);

      // Direct real-time socket broadcasts for instant UI updates across User and Vendor apps
      if (io) {
        try {
          const vendorIdStr = booking.vendor._id?.toString() || booking.vendor.toString();
          const userIdStr = booking.user._id?.toString() || booking.user.toString();
          const bookingPayload = {
            bookingId: booking._id.toString(),
            status: booking.status,
            userStatus: booking.userStatus,
            vendorStatus: booking.vendorStatus,
            scheduledDate: booking.scheduleDate || booking.scheduledDate,
            scheduledTime: booking.scheduledTime,
            booking
          };

          // Broadcast to user rooms
          io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('booking_status_updated', bookingPayload);
          io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('booking_updated', bookingPayload);

          // Broadcast to vendor rooms
          io.to(`vendor:${vendorIdStr}`).to(`Vendor_${vendorIdStr}`).to(vendorIdStr).emit('booking_status_updated', bookingPayload);
          io.to(`vendor:${vendorIdStr}`).to(`Vendor_${vendorIdStr}`).to(vendorIdStr).emit('booking_updated', bookingPayload);
        } catch (sockEmitErr) {
          console.error('[acceptBooking] Socket broadcast error:', sockEmitErr);
        }
      }
    } catch (notifErr) {
      console.error('[acceptBooking] Error creating notification:', notifErr);
    }

    // 2. Send Email Notification (Isolated try/catch)
    try {
      if (booking.user?.email) {
        await sendBookingStatusUpdateEmail({
          email: booking.user.email,
          name: booking.user.name,
          bookingId: booking._id.toString(),
          status: 'ACCEPTED',
          message: `Vendor has accepted your booking request.${timeDetail ? ` Visit scheduled ${timeDetail}.` : ''}`
        });
      }
    } catch (emailError) {
      console.error('[acceptBooking] Email notification error:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking accepted successfully',
      data: {
        booking: {
          id: booking._id,
          status: booking.status
        }
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
 * Reject booking
 */
const rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rejectionReason } = req.body;
    const vendorId = req.userId;

    console.log(`[rejectBooking] Attempting to reject booking ${bookingId} for vendor ${vendorId}`);

    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason must be at least 10 characters'
      });
    }

    // First check if booking exists and belongs to vendor
    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId
    }).populate('user', 'name email');

    if (!booking) {
      console.log(`[rejectBooking] Booking ${bookingId} not found or doesn't belong to vendor ${vendorId}`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to reject this booking'
      });
    }

    // Check if booking is in correct status (use vendorStatus for vendor)
    if (booking.vendorStatus !== BOOKING_STATUS.ASSIGNED && booking.status !== BOOKING_STATUS.ASSIGNED) {
      console.log(`[rejectBooking] Booking ${bookingId} status is ${booking.vendorStatus || booking.status}, expected ${BOOKING_STATUS.ASSIGNED}`);
      return res.status(400).json({
        success: false,
        message: `Booking cannot be rejected. Current status: ${booking.vendorStatus || booking.status}. Only ${BOOKING_STATUS.ASSIGNED} bookings can be rejected.`
      });
    }

    booking.status = BOOKING_STATUS.REJECTED;
    booking.vendorStatus = BOOKING_STATUS.REJECTED;
    booking.userStatus = BOOKING_STATUS.REJECTED;
    booking.rejectionReason = rejectionReason.trim();
    await booking.save();

    // Process user refund if advance payment was made
    try {
      const Payment = require('../../models/Payment');
      const { creditToUserWallet } = require('../../services/userWalletService');
      
      const isAdvancePaidOnBooking = booking.payment?.advancePaid && (booking.payment?.advanceAmount > 0);
      const completedAdvancePayment = await Payment.findOne({
        booking: booking._id,
        paymentType: 'ADVANCE',
        status: 'COMPLETED'
      });

      const refundAmount = isAdvancePaidOnBooking 
        ? booking.payment.advanceAmount 
        : (completedAdvancePayment ? completedAdvancePayment.amount : 0);

      if (refundAmount > 0) {
        await creditToUserWallet(
          booking.user._id,
          refundAmount,
          booking._id,
          `Refund for rejected booking #${booking._id.toString().slice(-6).toUpperCase()}`
        );

        await Payment.create({
          booking: booking._id,
          user: booking.user._id,
          vendor: vendorId,
          paymentType: 'REFUND',
          amount: refundAmount,
          status: 'COMPLETED',
          description: `Refund credited to user wallet for rejected booking #${booking._id.toString().slice(-6).toUpperCase()}`,
          completedAt: new Date()
        });
      }
    } catch (refundErr) {
      console.error('Error auto-refunding to user wallet on rejectBooking:', refundErr);
    }

    // Notify User
    await sendNotification({
      recipient: booking.user._id,
      recipientModel: 'User',
      type: 'BOOKING_REJECTED',
      title: 'Booking Rejected',
      message: `Your booking was rejected by the expert. Reason: ${rejectionReason.trim()}`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id
      }
    });

    // Notify Admins
    try {
      const Admin = require('../../models/Admin');
      const admins = await Admin.find({ isActive: true });
      for (const admin of admins) {
        await sendNotification({
          recipient: admin._id,
          recipientModel: 'Admin',
          type: 'BOOKING_REJECTED',
          title: 'Booking Rejected',
          message: `Booking #${booking._id.toString().slice(-6)} was rejected by vendor. Reason: ${rejectionReason.trim()}`,
          relatedEntity: {
            entityType: 'Booking',
            entityId: booking._id
          }
        });
      }
    } catch (adminErr) {
      console.error('Error sending admin notification:', adminErr);
    }

    res.json({
      success: true,
      message: 'Booking rejected successfully and customer refunded if applicable.',
      data: {
        bookingId: booking._id,
        reassigned: false
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
 * Mark booking as En Route (Vendor is traveling to site)
 */
const markAsEnRoute = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      vendorStatus: BOOKING_STATUS.ACCEPTED
    })
      .populate('user', 'name email phone')
      .populate('vendor', 'name designation companyName');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in accepted status'
      });
    }

    // Update booking status
    booking.status = BOOKING_STATUS.EN_ROUTE;
    booking.vendorStatus = BOOKING_STATUS.EN_ROUTE;
    booking.userStatus = BOOKING_STATUS.EN_ROUTE;
    booking.enRouteAt = new Date();

    // Generate OTPs
    if (!booking.otp || !booking.otp.startSurvey || !booking.otp.startSurvey.code) {
      booking.otp = {
        startSurvey: { 
          code: Math.floor(100000 + Math.random() * 900000).toString(), 
          generatedAt: new Date(), 
          verified: false 
        },
        endSurvey: { 
          code: Math.floor(100000 + Math.random() * 900000).toString(), 
          generatedAt: new Date(), 
          verified: false 
        }
      };
    }

    await booking.save();

    // Send Notification to User
    try {
      let io = null;
      try {
        const { getIO } = require('../../sockets');
        io = getIO();
      } catch (e) {}

      const expertCategory = booking.vendor?.designation || 'Groundwater Professional';
      const vendorName = booking.vendor?.name ? `${booking.vendor.name} (${expertCategory})` : `Your assigned expert`;

      await sendNotification({
        recipient: booking.user._id,
        recipientModel: 'User',
        type: 'BOOKING_EN_ROUTE',
        title: 'Expert En Route! 🚗',
        message: `${vendorName} is now traveling to your property. Please check your booking details for the Start Survey OTP to share upon arrival.`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        },
        metadata: {
          vendorName: booking.vendor?.name,
          expertCategory: expertCategory,
          bookingId: booking._id.toString()
        }
      }, io);

      // Dispatch Start Survey OTP via SMS & Multi-channel
      if (booking.user?.phone || booking.user?.email) {
        dispatchSurveyOTP({
          phone: booking.user.phone,
          email: booking.user.email,
          name: booking.user.name,
          otp: booking.otp.startSurvey.code,
          stage: 'Start',
          bookingId: booking._id,
          vendorName: booking.vendor?.name || 'your expert'
        }).catch(err => console.error('[markAsEnRoute] Error dispatching Start Survey OTP:', err));
      }

      // Broadcast Real-Time Socket Updates to all relevant rooms
      if (io) {
        const userIdStr = booking.user?._id?.toString() || booking.user?.toString();
        const vendorIdStr = booking.vendor?._id?.toString() || booking.vendor?.toString();
        const bookingPayload = {
          bookingId: booking._id,
          status: booking.status,
          userStatus: booking.userStatus,
          vendorStatus: booking.vendorStatus,
          enRouteAt: booking.enRouteAt,
          booking: booking
        };

        // Broadcast to booking tracking room
        io.to(`booking_${booking._id}`).emit('booking_updated', bookingPayload);
        io.to(`booking_${booking._id}`).emit('booking_status_updated', bookingPayload);

        // Broadcast to user rooms
        if (userIdStr) {
          io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('booking_status_updated', bookingPayload);
          io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('booking_updated', bookingPayload);
        }

        // Broadcast to vendor rooms
        if (vendorIdStr) {
          io.to(`vendor:${vendorIdStr}`).to(`Vendor_${vendorIdStr}`).to(vendorIdStr).emit('booking_status_updated', bookingPayload);
          io.to(`vendor:${vendorIdStr}`).to(`Vendor_${vendorIdStr}`).to(vendorIdStr).emit('booking_updated', bookingPayload);
        }

        // Global fallback broadcast
        io.emit('booking_status_updated', { bookingId: booking._id, status: booking.status });
      }
    } catch (notifErr) {
      console.error('[markAsEnRoute] Error creating notification:', notifErr);
    }

    res.json({
      success: true,
      message: 'Status updated to En Route',
      data: { booking }
    });
  } catch (error) {
    console.error('Mark as En Route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status to En Route',
      error: error.message
    });
  }
};

/**
 * Mark booking as visited (simple - without report upload)
 */
const markAsVisited = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      vendorStatus: { $in: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.EN_ROUTE] }
    }).populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in accepted status'
      });
    }

    // Update booking status
    booking.status = BOOKING_STATUS.VISITED;
    booking.vendorStatus = BOOKING_STATUS.VISITED;
    booking.userStatus = BOOKING_STATUS.VISITED;
    booking.visitedAt = new Date();

    // Credit first payment (50% of total vendor payment) to vendor wallet
    if (booking.payment?.vendorWalletPayments?.siteVisitPayment &&
      !booking.payment.vendorWalletPayments.siteVisitPayment.credited) {
      const paymentAmount = booking.payment.vendorWalletPayments.siteVisitPayment.amount;

      if (paymentAmount > 0) {
        const creditResult = await creditToVendorWallet(
          vendorId,
          paymentAmount,
          'SITE_VISIT',
          bookingId,
          { bookingId: bookingId.toString() }
        );

        if (creditResult.success) {
          booking.payment.vendorWalletPayments.siteVisitPayment.credited = true;
          booking.payment.vendorWalletPayments.siteVisitPayment.creditedAt = new Date();
          booking.payment.vendorWalletPayments.siteVisitPayment.transactionId = creditResult.transaction._id;
          booking.payment.vendorWalletPayments.totalCredited =
            (booking.payment.vendorWalletPayments.totalCredited || 0) + paymentAmount;
        } else {
          // Mark as failed but don't block status change
          booking.payment.vendorWalletPayments.siteVisitPayment.failed = true;
          booking.payment.vendorWalletPayments.siteVisitPayment.errorMessage = creditResult.error || 'Credit failed';
          console.error('Failed to credit site visit payment:', creditResult.error);

          // Schedule retry (async, don't wait)
          setTimeout(async () => {
            try {
              const failedTx = await require('../../models/WalletTransaction').findOne({
                vendor: vendorId,
                booking: bookingId,
                type: 'SITE_VISIT',
                status: 'FAILED'
              }).sort({ createdAt: -1 });

              if (failedTx) {
                await retryFailedCredit(failedTx._id);
              }
            } catch (retryError) {
              console.error('Retry failed:', retryError);
            }
          }, 5000); // Retry after 5 seconds
        }
      }
    }

    await booking.save();

    // Send notification to user
    try {
      await sendBookingStatusUpdateEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        status: 'VISITED',
        message: 'Expert has visited your location'
      });

      // Send real-time notification
      try {
        const { getIO } = require('../../sockets');
        const io = getIO();
        await sendNotification({
          recipient: booking.user._id,
          recipientModel: 'User',
          type: 'BOOKING_VISITED',
          title: 'Expert Visited',
          message: `Expert has visited your location`,
          relatedEntity: {
            entityType: 'Booking',
            entityId: booking._id
          },
          metadata: {
            bookingId: booking._id.toString()
          }
        }, io);
      } catch (socketError) {
        console.error('Socket notification error:', socketError);
        // Continue even if Socket.io fails
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking marked as visited successfully',
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          visitedAt: booking.visitedAt
        }
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
 * Verify Start Survey OTP
 */
const verifyStartSurveyOTP = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;
    const { otp } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId
    })
      .populate('user', 'name email phone')
      .populate('vendor', 'name designation companyName');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== BOOKING_STATUS.EN_ROUTE) {
      return res.status(400).json({ success: false, message: 'Booking must be En Route to start survey' });
    }

    if (!booking.otp || !booking.otp.startSurvey || !booking.otp.startSurvey.code) {
      return res.status(400).json({ success: false, message: 'OTP not generated for this booking' });
    }

    if (booking.otp.startSurvey.verified) {
      return res.status(400).json({ success: false, message: 'Start Survey OTP already verified' });
    }

    if (booking.otp.startSurvey.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    booking.otp.startSurvey.verified = true;
    booking.otp.startSurvey.verifiedAt = new Date();
    booking.startSurveyVerifiedAt = new Date();
    
    // Transition to VISITED
    booking.status = BOOKING_STATUS.VISITED;
    booking.vendorStatus = BOOKING_STATUS.VISITED;
    booking.userStatus = BOOKING_STATUS.VISITED;
    booking.visitedAt = new Date();

    await booking.save();

    // Populate full booking for client response
    await booking.populate([
      { path: 'user', select: 'name email phone alternatePhone address profilePicture' },
      { path: 'vendor', select: 'name designation companyName phone' },
      { path: 'service', select: 'name price machineType' }
    ]);

    // Dispatch End Survey OTP via SMS & Multi-channel when survey starts
    if (booking.otp?.endSurvey?.code && (booking.user?.phone || booking.user?.email)) {
      dispatchSurveyOTP({
        phone: booking.user?.phone,
        email: booking.user?.email,
        name: booking.user?.name,
        otp: booking.otp.endSurvey.code,
        stage: 'End',
        bookingId: booking._id,
        vendorName: booking.vendor?.name || 'your expert'
      }).catch(err => console.error('[verifyStartSurveyOTP] Error dispatching End Survey OTP:', err));
    }

    // Emit Real-Time Socket.io Notification & Status Update Event
    let io = null;
    try {
      const { getIO } = require('../../sockets');
      io = getIO();
    } catch (e) {
      console.log('[verifyStartSurveyOTP] Socket.io not initialized yet');
    }

    if (booking.user?._id || booking.user) {
      await sendNotification({
        recipient: booking.user._id || booking.user,
        recipientModel: 'User',
        title: 'Survey Started 📍',
        message: `Expert ${booking.vendor?.name || ''} has verified Start OTP and started your groundwater survey.`,
        type: 'BOOKING_UPDATE',
        bookingId: booking._id,
        data: { bookingId: booking._id, status: booking.status, userStatus: booking.userStatus, vendorStatus: booking.vendorStatus }
      }, io).catch(err => console.error('[verifyStartSurveyOTP] Notification error:', err));
    }

    if (io) {
      const userIdStr = booking.user?._id?.toString() || booking.user?.toString();
      const vendorIdStr = booking.vendor?._id?.toString() || booking.vendor?.toString();
      const bookingPayload = {
        bookingId: booking._id,
        status: booking.status,
        userStatus: booking.userStatus,
        vendorStatus: booking.vendorStatus,
        booking: booking
      };

      io.to(`booking_${booking._id}`).emit('booking_updated', bookingPayload);
      io.to(`booking_${booking._id}`).emit('booking_status_updated', bookingPayload);

      if (userIdStr) {
        io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('booking_status_updated', bookingPayload);
        io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('booking_updated', bookingPayload);
      }
      if (vendorIdStr) {
        io.to(`vendor:${vendorIdStr}`).to(`Vendor_${vendorIdStr}`).to(vendorIdStr).emit('booking_status_updated', bookingPayload);
        io.to(`vendor:${vendorIdStr}`).to(`Vendor_${vendorIdStr}`).to(vendorIdStr).emit('booking_updated', bookingPayload);
      }
      io.emit('booking_status_updated', { bookingId: booking._id, status: booking.status });
    }

    res.json({
      success: true,
      message: 'Start Survey OTP verified successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Verify Start Survey OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
};

/**
 * Verify End Survey OTP
 */
const verifyEndSurveyOTP = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;
    const { otp } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId
    })
      .populate('user', 'name email phone')
      .populate('vendor', 'name designation companyName');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== BOOKING_STATUS.VISITED) {
      return res.status(400).json({ success: false, message: 'Survey must be started before it can be ended' });
    }

    if (!booking.otp?.startSurvey?.verified) {
      return res.status(400).json({ success: false, message: 'Start Survey OTP must be verified first' });
    }

    if (!booking.otp || !booking.otp.endSurvey || !booking.otp.endSurvey.code) {
      return res.status(400).json({ success: false, message: 'OTP not generated for this booking' });
    }

    if (booking.otp.endSurvey.verified) {
      return res.status(400).json({ success: false, message: 'End Survey OTP already verified' });
    }

    if (booking.otp.endSurvey.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    booking.otp.endSurvey.verified = true;
    booking.otp.endSurvey.verifiedAt = new Date();
    booking.endSurveyVerifiedAt = new Date();
    
    await booking.save();

    // Populate full booking for client response
    await booking.populate([
      { path: 'user', select: 'name email phone alternatePhone address profilePicture' },
      { path: 'vendor', select: 'name designation companyName phone' },
      { path: 'service', select: 'name price machineType' }
    ]);

    // Emit Real-Time Socket.io Notification & Status Update Event
    let io = null;
    try {
      const { getIO } = require('../../sockets');
      io = getIO();
    } catch (e) {
      console.log('[verifyEndSurveyOTP] Socket.io not initialized yet');
    }

    if (booking.user?._id || booking.user) {
      await sendNotification({
        recipient: booking.user._id || booking.user,
        recipientModel: 'User',
        title: 'Survey Completed 🚀',
        message: `Expert ${booking.vendor?.name || ''} has verified End OTP. Site survey is completed! You can now view status.`,
        type: 'BOOKING_UPDATE',
        bookingId: booking._id,
        data: { bookingId: booking._id, status: booking.status, userStatus: booking.userStatus, vendorStatus: booking.vendorStatus }
      }, io).catch(err => console.error('[verifyEndSurveyOTP] Notification error:', err));
    }

    if (io) {
      const userIdStr = booking.user?._id?.toString() || booking.user?.toString();
      const vendorIdStr = booking.vendor?._id?.toString() || booking.vendor?.toString();
      const bookingPayload = {
        bookingId: booking._id,
        status: booking.status,
        userStatus: booking.userStatus,
        vendorStatus: booking.vendorStatus,
        booking: booking
      };

      io.to(`booking_${booking._id}`).emit('booking_updated', bookingPayload);
      io.to(`booking_${booking._id}`).emit('booking_status_updated', bookingPayload);

      if (userIdStr) {
        io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('booking_status_updated', bookingPayload);
        io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('booking_updated', bookingPayload);
      }
      if (vendorIdStr) {
        io.to(`vendor:${vendorIdStr}`).to(`Vendor_${vendorIdStr}`).to(vendorIdStr).emit('booking_status_updated', bookingPayload);
        io.to(`vendor:${vendorIdStr}`).to(`Vendor_${vendorIdStr}`).to(vendorIdStr).emit('booking_updated', bookingPayload);
      }
      io.emit('booking_status_updated', { bookingId: booking._id, status: booking.status });
    }

    res.json({
      success: true,
      message: 'End Survey OTP verified successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Verify End Survey OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
};

/**
 * Resend Survey OTP (Start or End) via SMS & WhatsApp
 */
const resendSurveyOTP = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { type = 'end' } = req.body; // 'start' or 'end'

    const booking = await Booking.findById(bookingId).populate('user', 'name phone email');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.otp) {
      booking.otp = {};
    }

    let otpCode = '';
    const isStart = type === 'start';

    if (isStart) {
      if (!booking.otp.startSurvey) booking.otp.startSurvey = {};
      if (!booking.otp.startSurvey.code) {
        booking.otp.startSurvey.code = Math.floor(100000 + Math.random() * 900000).toString();
      }
      otpCode = booking.otp.startSurvey.code;
    } else {
      if (!booking.otp.endSurvey) booking.otp.endSurvey = {};
      if (!booking.otp.endSurvey.code) {
        booking.otp.endSurvey.code = Math.floor(100000 + Math.random() * 900000).toString();
      }
      otpCode = booking.otp.endSurvey.code;
    }

    await booking.save();

    // Dispatch via SMS & Multi-channel
    const userPhone = booking.user?.phone || booking.phone;
    const userEmail = booking.user?.email || booking.email;
    const userName = booking.user?.name || booking.userName || 'Customer';

    if (userPhone || userEmail) {
      dispatchSurveyOTP({
        userPhone,
        userEmail,
        userName,
        otp: otpCode,
        type: isStart ? 'start' : 'end',
      }).catch(err => console.error('[resendSurveyOTP] Error dispatching survey OTP:', err));
    }

    res.status(200).json({
      success: true,
      message: `${isStart ? 'Start' : 'End'} Survey OTP resent to customer successfully via SMS & WhatsApp.`
    });
  } catch (error) {
    console.error('Resend Survey OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP', error: error.message });
  }
};

/**
 * Mark booking as visited and upload report
 */
const markVisitedAndUploadReport = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const reportData = JSON.parse(req.body.reportData || '{}');
    const parseNum = (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    };

    // 1. Flexible Booking Lookup (Support VISITED, ACCEPTED, ASSIGNED, or REPORT_UPLOADED)
    let booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      vendorStatus: { $in: [BOOKING_STATUS.VISITED, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.REPORT_UPLOADED] }
    }).populate('user', 'name email');

    if (!booking) {
      booking = await Booking.findOne({
        _id: bookingId,
        vendor: vendorId
      }).populate('user', 'name email');
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you are not the assigned expert.'
      });
    }

    // OTP Verification check
    if (booking.otp && booking.otp.endSurvey && !booking.otp.endSurvey.verified) {
      return res.status(403).json({
        success: false,
        message: 'You must verify the End Survey OTP with the customer before uploading the report.'
      });
    }

    // 3. Handle file uploads with Cloudinary Error Isolation
    const reportImages = [];
    let reportFile = null;

    if (req.files) {
      // Upload images safely
      if (req.files.images && req.files.images.length > 0) {
        for (const file of req.files.images) {
          try {
            const result = await uploadToCloudinary(file.buffer, 'booking-reports/images');
            reportImages.push({
              url: result.secure_url,
              publicId: result.public_id,
              geoTag: {
                lat: req.body[`image_${file.fieldname}_lat`] || null,
                lng: req.body[`image_${file.fieldname}_lng`] || null
              },
              uploadedAt: new Date()
            });
          } catch (cloudErr) {
            console.error('[markVisitedAndUploadReport] Image Cloudinary upload error:', cloudErr);
            const base64Str = `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
            reportImages.push({
              url: base64Str,
              publicId: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              uploadedAt: new Date()
            });
          }
        }
      }

      // Upload report file (PDF) safely
      if (req.files.reportFile && req.files.reportFile[0]) {
        const file = req.files.reportFile[0];
        try {
          const result = await uploadToCloudinary(file.buffer, 'booking-reports/files', {
            resource_type: 'raw',
            format: 'pdf'
          });
          reportFile = {
            url: result.secure_url,
            publicId: result.public_id,
            uploadedAt: new Date()
          };
        } catch (cloudErr) {
          console.error('[markVisitedAndUploadReport] PDF Cloudinary upload error:', cloudErr);
          const base64Str = `data:application/pdf;base64,${file.buffer.toString('base64')}`;
          reportFile = {
            url: base64Str,
            publicId: `local_pdf_${Date.now()}`,
            uploadedAt: new Date()
          };
        }
      }
    }

    // 4. Update booking with report data
    booking.report = {
      ...reportData,
      images: reportImages,
      reportFile: reportFile,
      uploadedAt: new Date(),
      uploadedBy: vendorId
    };
    booking.reportUploadedAt = new Date();
    booking.status = BOOKING_STATUS.REPORT_UPLOADED;
    booking.vendorStatus = BOOKING_STATUS.REPORT_UPLOADED;
    booking.userStatus = BOOKING_STATUS.AWAITING_PAYMENT;

    await booking.save();

    // Send notification to user and admin
    try {
      await sendBookingStatusUpdateEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        status: 'REPORT_UPLOADED',
        message: 'Your groundwater survey report is ready. Please pay the remaining amount to view it.'
      });

      // Send real-time notifications
      try {
        const { getIO } = require('../../sockets');
        const io = getIO();

        // Notify vendor - report uploaded confirmation
        await sendNotification({
          recipient: booking.vendor,
          recipientModel: 'Vendor',
          type: 'REPORT_UPLOADED',
          title: 'Report Uploaded',
          message: `You have successfully uploaded the groundwater survey report for booking #${booking._id.toString().slice(-6)}. User will be notified to pay remaining amount.`,
          relatedEntity: {
            entityType: 'Booking',
            entityId: booking._id
          },
          metadata: {
            bookingId: booking._id.toString(),
            waterFound: booking.report.waterFound
          }
        }, io);

        // Notify user - report uploaded by vendor
        await sendNotification({
          recipient: booking.user._id,
          recipientModel: 'User',
          type: 'REPORT_UPLOADED',
          title: 'Report Uploaded by Expert',
          message: `Expert has uploaded the groundwater survey report. Please pay remaining ₹${booking.payment.remainingAmount} to view it.`,
          relatedEntity: {
            entityType: 'Booking',
            entityId: booking._id
          },
          metadata: {
            remainingAmount: booking.payment.remainingAmount,
            bookingId: booking._id.toString()
          }
        }, io);

        // Notify admin (get all admins)
        const Admin = require('../../models/Admin');
        const admins = await Admin.find({ isActive: true });
        for (const admin of admins) {
          await sendNotification({
            recipient: admin._id,
            recipientModel: 'Admin',
            type: 'REPORT_UPLOADED',
            title: 'New Report Uploaded',
            message: `New groundwater survey report uploaded for booking #${booking._id.toString().slice(-6)}`,
            relatedEntity: {
              entityType: 'Booking',
              entityId: booking._id
            },
            metadata: {
              bookingId: booking._id.toString(),
              vendorId: booking.vendor.toString()
            }
          }, io);
        }
      } catch (socketError) {
        console.error('Socket notification error:', socketError);
        // Continue even if Socket.io fails
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    // Broadcast Real-Time Socket Updates to all relevant rooms
    try {
      let io = null;
      try {
        const { getIO } = require('../../sockets');
        io = getIO();
      } catch (e) {}

      if (io) {
        const userIdStr = booking.user?._id?.toString() || booking.user?.toString();
        const vendorIdStr = booking.vendor?._id?.toString() || booking.vendor?.toString();
        const bookingPayload = {
          bookingId: booking._id,
          status: booking.status,
          userStatus: booking.userStatus,
          vendorStatus: booking.vendorStatus,
          booking: booking
        };

        io.to(`booking_${booking._id}`).emit('booking_updated', bookingPayload);
        io.to(`booking_${booking._id}`).emit('booking_status_updated', bookingPayload);

        if (userIdStr) {
          io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('booking_status_updated', bookingPayload);
          io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('booking_updated', bookingPayload);
        }
        if (vendorIdStr) {
          io.to(`vendor:${vendorIdStr}`).to(`Vendor_${vendorIdStr}`).to(vendorIdStr).emit('booking_status_updated', bookingPayload);
          io.to(`vendor:${vendorIdStr}`).to(`Vendor_${vendorIdStr}`).to(vendorIdStr).emit('booking_updated', bookingPayload);
        }
        io.emit('booking_status_updated', { bookingId: booking._id, status: booking.status });
      }
    } catch (sockErr) {
      console.error('[uploadSurveyReport] Socket emit error:', sockErr);
    }

    res.json({
      success: true,
      message: 'Report uploaded successfully. User will be notified to pay remaining amount.',
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          report: {
            waterFound: booking.report.waterFound,
            uploadedAt: booking.report.uploadedAt
          }
        }
      }
    });
  } catch (error) {
    console.error('Mark visited and upload report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload report',
      error: error.message
    });
  }
};

/**
 * Mark booking as completed
 * Note: This is typically done automatically after user pays remaining amount,
 * but can be used manually if needed for AWAITING_PAYMENT bookings
 */
const markAsCompleted = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      vendorStatus: { $in: [BOOKING_STATUS.VISITED, BOOKING_STATUS.AWAITING_PAYMENT, BOOKING_STATUS.REPORT_UPLOADED] }
    }).populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not eligible for completion. Booking must be in VISITED, REPORT_UPLOADED, or AWAITING_PAYMENT status.'
      });
    }

    // Update booking status
    booking.status = BOOKING_STATUS.COMPLETED;
    booking.vendorStatus = BOOKING_STATUS.COMPLETED;
    booking.userStatus = BOOKING_STATUS.COMPLETED;
    booking.completedAt = new Date();
    await booking.save();

    // Send notification to user
    try {
      await sendBookingStatusUpdateEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        status: 'COMPLETED',
        message: 'Your booking has been marked as completed.'
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking marked as completed successfully',
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          completedAt: booking.completedAt
        }
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
 * Get booking details for vendor
 */
const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId
    })
      .populate('user', 'name email phone alternatePhone address profilePicture documents.profilePicture')
      .populate('vendor', 'name email phone vendorId address gstin pan bankDetails profilePicture')
      .populate('service', 'name price machineType description');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking details retrieved successfully',
      data: {
        booking
      }
    });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking details',
      error: error.message
    });
  }
};

/**
 * Request travel charges for a booking
 */
const requestTravelCharges = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;
    const { amount, reason } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Travel charges amount is required and must be greater than 0'
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId
    }).populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if travel charges already requested
    if (booking.travelChargesRequest && booking.travelChargesRequest.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Travel charges request is already pending approval'
      });
    }

    // Check if already approved or rejected
    if (booking.travelChargesRequest && booking.travelChargesRequest.status) {
      return res.status(400).json({
        success: false,
        message: `Travel charges request has already been ${booking.travelChargesRequest.status.toLowerCase()}`
      });
    }

    // Update booking with travel charges request
    booking.travelChargesRequest = {
      amount,
      reason: reason || '',
      status: 'PENDING',
      requestedAt: new Date(),
      requestedBy: vendorId
    };
    await booking.save();

    res.json({
      success: true,
      message: 'Travel charges request submitted successfully. Awaiting admin approval.',
      data: {
        booking: {
          id: booking._id,
          travelChargesRequest: booking.travelChargesRequest
        }
      }
    });
  } catch (error) {
    console.error('Request travel charges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit travel charges request',
      error: error.message
    });
  }
};

/**
 * Download vendor invoice
 * Available when final settlement is done
 */
const downloadInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      status: { $in: [BOOKING_STATUS.FINAL_SETTLEMENT, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.SUCCESS] }
    })
      .populate('user', 'name email phone alternatePhone address')
      .populate('vendor', 'name email phone')
      .populate('service', 'name price machineType');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or invoice not available. Final settlement must be completed.'
      });
    }

    // Check if final settlement is done
    if (booking.status !== BOOKING_STATUS.FINAL_SETTLEMENT && booking.status !== BOOKING_STATUS.COMPLETED && booking.status !== BOOKING_STATUS.SUCCESS) {
      return res.status(400).json({
        success: false,
        message: 'Invoice is only available after final settlement is completed'
      });
    }

    if (!booking.invoice?.invoiceUrl) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not generated yet'
      });
    }

    res.json({
      success: true,
      message: 'Invoice retrieved successfully',
      data: {
        invoiceUrl: booking.invoice.invoiceUrl,
        invoiceNumber: booking.invoice.invoiceNumber,
        booking: {
          id: booking._id,
          serviceName: booking.service?.name,
          totalAmount: booking.payment?.totalAmount || booking.payment?.amount,
          baseServiceFee: booking.payment?.baseServiceFee,
          travelCharges: booking.payment?.travelCharges,
          finalSettlement: booking.finalSettlement,
          payment: booking.payment
        }
      }
    });
  } catch (error) {
    console.error('Download vendor invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice',
      error: error.message
    });
  }
};

/**
 * Cancel booking by vendor (for unavoidable circumstances)
 * Reassigns the booking to another vendor
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { cancellationReason } = req.body;
    const vendorId = req.userId;

    if (!cancellationReason || cancellationReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason must be at least 10 characters'
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not assigned to you'
      });
    }

    // Check if status is cancellable (ONLY ACCEPTED, EN_ROUTE, VISITED - until he uploads the report)
    const cancellableStatuses = [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.EN_ROUTE, BOOKING_STATUS.VISITED];
    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled in status: ${booking.status}`
      });
    }

    // Update terminal status temporarily
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.vendorStatus = BOOKING_STATUS.CANCELLED;
    booking.userStatus = BOOKING_STATUS.CANCELLED;
    booking.rejectionReason = cancellationReason.trim(); // Reuse this field for audit
    booking.cancelledBy = 'VENDOR';
    booking.cancelledAt = new Date();
    await booking.save();

    // Process user refund if advance payment was made
    try {
      const Payment = require('../../models/Payment');
      const { creditToUserWallet } = require('../../services/userWalletService');
      
      const isAdvancePaidOnBooking = booking.payment?.advancePaid && (booking.payment?.advanceAmount > 0);
      const completedAdvancePayment = await Payment.findOne({
        booking: booking._id,
        paymentType: 'ADVANCE',
        status: 'COMPLETED'
      });

      const refundAmount = isAdvancePaidOnBooking 
        ? booking.payment.advanceAmount 
        : (completedAdvancePayment ? completedAdvancePayment.amount : 0);

      if (refundAmount > 0) {
        await creditToUserWallet(
          booking.user,
          refundAmount,
          booking._id,
          `Refund for cancelled booking #${booking._id.toString().slice(-6).toUpperCase()}`
        );

        await Payment.create({
          booking: booking._id,
          user: booking.user,
          vendor: vendorId,
          paymentType: 'REFUND',
          amount: refundAmount,
          status: 'COMPLETED',
          description: `Refund credited to user wallet for cancelled booking #${booking._id.toString().slice(-6).toUpperCase()}`,
          completedAt: new Date()
        });
      }
    } catch (refundErr) {
      console.error('Error auto-refunding to user wallet on cancelBooking:', refundErr);
    }

    // Notify User
    await sendNotification({
      recipient: booking.user,
      recipientModel: 'User',
      type: 'BOOKING_CANCELLED',
      title: 'Booking Cancelled',
      message: `Your booking was cancelled by the expert. Reason: ${cancellationReason.trim()}`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id
      }
    });

    // Notify Admins
    try {
      const Admin = require('../../models/Admin');
      const admins = await Admin.find({ isActive: true });
      for (const admin of admins) {
        await sendNotification({
          recipient: admin._id,
          recipientModel: 'Admin',
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          message: `Booking #${booking._id.toString().slice(-6)} was cancelled by vendor. Reason: ${cancellationReason.trim()}`,
          relatedEntity: {
            entityType: 'Booking',
            entityId: booking._id
          }
        });
      }
    } catch (adminErr) {
      console.error('Error sending admin notification:', adminErr);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully and customer refunded if applicable.',
      data: {
        bookingId: booking._id,
        reassigned: false
      }
    });

  } catch (error) {
    console.error('Vendor cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

module.exports = {
  getVendorBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  markAsEnRoute,
  verifyStartSurveyOTP,
  verifyEndSurveyOTP,
  resendSurveyOTP,
  markAsVisited,
  markVisitedAndUploadReport,
  markAsCompleted,
  getBookingDetails,
  requestTravelCharges,
  downloadInvoice
};

