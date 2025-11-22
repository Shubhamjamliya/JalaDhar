const Booking = require('../../models/Booking');
const { BOOKING_STATUS } = require('../../utils/constants');
const { uploadToCloudinary } = require('../../services/cloudinaryService');
const { Readable } = require('stream');
const { sendBookingStatusUpdateEmail } = require('../../services/emailService');

/**
 * Get vendor bookings
 */
const getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { vendor: vendorId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone address')
        .populate('service', 'name price machineType')
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
    }).populate('user', 'name email');

    if (!booking) {
      console.log(`[acceptBooking] Booking ${bookingId} not found or doesn't belong to vendor ${vendorId}`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to accept this booking'
      });
    }

    // Check if booking is in correct status
    if (booking.status !== BOOKING_STATUS.ASSIGNED) {
      console.log(`[acceptBooking] Booking ${bookingId} status is ${booking.status}, expected ${BOOKING_STATUS.ASSIGNED}`);
      return res.status(400).json({
        success: false,
        message: `Booking cannot be accepted. Current status: ${booking.status}. Only ${BOOKING_STATUS.ASSIGNED} bookings can be accepted.`
      });
    }

    booking.status = BOOKING_STATUS.ACCEPTED;
    booking.acceptedAt = new Date();
    await booking.save();

    // Send notification to user
    try {
      await sendBookingStatusUpdateEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        status: 'ACCEPTED',
        message: 'Vendor has accepted your booking request'
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
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

    // Check if booking is in correct status
    if (booking.status !== BOOKING_STATUS.ASSIGNED) {
      console.log(`[rejectBooking] Booking ${bookingId} status is ${booking.status}, expected ${BOOKING_STATUS.ASSIGNED}`);
      return res.status(400).json({
        success: false,
        message: `Booking cannot be rejected. Current status: ${booking.status}. Only ${BOOKING_STATUS.ASSIGNED} bookings can be rejected.`
      });
    }

    booking.status = BOOKING_STATUS.REJECTED;
    booking.rejectionReason = rejectionReason.trim();
    await booking.save();

    // Send notification to user
    try {
      await sendBookingStatusUpdateEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        status: 'REJECTED',
        message: `Vendor has rejected your booking. Reason: ${rejectionReason}`
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking rejected successfully',
      data: {
        booking: {
          id: booking._id,
          status: booking.status
        }
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
 * Mark booking as visited (simple - without report upload)
 */
const markAsVisited = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      status: BOOKING_STATUS.ACCEPTED
    }).populate('user', 'name email');

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

    // Send notification to user
    try {
      await sendBookingStatusUpdateEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        status: 'VISITED',
        message: 'Vendor has visited your location'
      });
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
 * Mark booking as visited and upload report
 */
const markVisitedAndUploadReport = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;
    const { waterFound, machineReadings, notes } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      status: BOOKING_STATUS.VISITED
    }).populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not eligible for report upload. Please mark as visited first.'
      });
    }

    // Handle file uploads (images and report file)
    const reportImages = [];
    let reportFile = null;

    if (req.files) {
      // Upload images
      if (req.files.images && req.files.images.length > 0) {
        for (const file of req.files.images) {
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
        }
      }

      // Upload report file (PDF)
      if (req.files.reportFile && req.files.reportFile[0]) {
        const result = await uploadToCloudinary(req.files.reportFile[0].buffer, 'booking-reports/files', {
          resource_type: 'raw',
          format: 'pdf'
        });
        reportFile = {
          url: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date()
        };
      }
    }

    // Update booking with report (status is already VISITED)
    booking.report = {
      waterFound: waterFound === 'true' || waterFound === true,
      machineReadings: machineReadings ? JSON.parse(machineReadings) : {},
      images: reportImages,
      reportFile: reportFile,
      uploadedAt: new Date(),
      uploadedBy: vendorId
    };
    booking.reportUploadedAt = new Date();
    booking.status = BOOKING_STATUS.REPORT_UPLOADED;

    // Update to AWAITING_PAYMENT status
    booking.status = BOOKING_STATUS.AWAITING_PAYMENT;
    await booking.save();

    // Send notification to user
    try {
      await sendBookingStatusUpdateEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        status: 'REPORT_UPLOADED',
        message: 'Your water detection report is ready. Please pay the remaining amount to view it.'
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
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
      status: { $in: [BOOKING_STATUS.VISITED, BOOKING_STATUS.AWAITING_PAYMENT, BOOKING_STATUS.REPORT_UPLOADED] }
    }).populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not eligible for completion. Booking must be in VISITED, REPORT_UPLOADED, or AWAITING_PAYMENT status.'
      });
    }

    // Update booking status
    booking.status = BOOKING_STATUS.COMPLETED;
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
      .populate('user', 'name email phone address')
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

module.exports = {
  getVendorBookings,
  acceptBooking,
  rejectBooking,
  markAsVisited,
  markVisitedAndUploadReport,
  markAsCompleted,
  getBookingDetails,
  requestTravelCharges
};

