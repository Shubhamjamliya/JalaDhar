const Booking = require('../../models/Booking');
const { BOOKING_STATUS } = require('../../utils/constants');
const { uploadToCloudinary } = require('../../services/cloudinaryService');
const { Readable } = require('stream');
const { sendBookingStatusUpdateEmail } = require('../../services/emailService');
const { sendNotification } = require('../../services/notificationService');
const { autoReassignBooking } = require('../../services/bookingReassignmentService');
const { creditToVendorWallet, retryFailedCredit } = require('../../services/walletService');

/**
 * Get vendor bookings
 */
const getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.userId;
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = { vendor: vendorId };
    if (status) {
      // For COMPLETED status, check both status and vendorStatus
      // For other statuses, use vendorStatus
      if (status === 'COMPLETED') {
        query.$or = [
          { status: status },
          { vendorStatus: status }
        ];
      } else {
        query.vendorStatus = status;
      }
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
        .populate('user', 'name email phone address profilePicture documents.profilePicture')
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
    }).populate('user', 'name email');

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

    booking.status = BOOKING_STATUS.ACCEPTED;
    booking.vendorStatus = BOOKING_STATUS.ACCEPTED;
    booking.userStatus = BOOKING_STATUS.ACCEPTED;
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

      // Send real-time notification
      try {
        const { getIO } = require('../../sockets');
        const io = getIO();
        await sendNotification({
          recipient: booking.user._id,
          recipientModel: 'User',
          type: 'BOOKING_ACCEPTED',
          title: 'Booking Accepted',
          message: `Your booking has been accepted by ${booking.vendor?.name || 'vendor'}`,
          relatedEntity: {
            entityType: 'Booking',
            entityId: booking._id
          },
          metadata: {
            vendorName: booking.vendor?.name,
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

    // Automatically reassign to next best vendor
    const reassignmentResult = await autoReassignBooking(bookingId, rejectionReason, 'VENDOR');

    res.json({
      success: true,
      message: reassignmentResult.success
        ? `Booking rejected and reassigned successfully.`
        : `Booking rejected successfully. No other vendors available.`,
      data: {
        bookingId: booking._id,
        reassigned: reassignmentResult.success,
        newVendor: reassignmentResult.data?.vendorName
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
      vendorStatus: BOOKING_STATUS.ACCEPTED
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
        message: 'Vendor has visited your location'
      });

      // Send real-time notification
      try {
        const { getIO } = require('../../sockets');
        const io = getIO();
        await sendNotification({
          recipient: booking.user._id,
          recipientModel: 'User',
          type: 'BOOKING_VISITED',
          title: 'Vendor Visited',
          message: `Vendor has visited your location`,
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
 * Mark booking as visited and upload report
 */
const markVisitedAndUploadReport = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.userId;
    const {
      waterFound,
      machineReadings,
      notes,
      // New fields
      customerName,
      village,
      mandal,
      district,
      state,
      landLocation,
      surveyNumber,
      extent,
      commandArea,
      rockType,
      soilType,
      existingBorewellDetails,
      pointsLocated,
      recommendedPointNumber,
      recommendedDepth,
      recommendedCasingDepth,
      expectedFractureDepths,
      expectedYield
    } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: vendorId,
      vendorStatus: BOOKING_STATUS.VISITED
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
      uploadedBy: vendorId,
      // New fields
      customerName,
      village,
      mandal,
      district,
      state,
      landLocation,
      surveyNumber,
      extent,
      commandArea,
      rockType,
      soilType,
      existingBorewellDetails,
      pointsLocated: pointsLocated ? Number(pointsLocated) : undefined,
      recommendedPointNumber,
      recommendedDepth: recommendedDepth ? Number(recommendedDepth) : undefined,
      recommendedCasingDepth: recommendedCasingDepth ? Number(recommendedCasingDepth) : undefined,
      expectedFractureDepths,
      expectedYield: expectedYield ? Number(expectedYield) : undefined
    };
    booking.reportUploadedAt = new Date();
    // When vendor uploads report:
    // - Vendor status: REPORT_UPLOADED (waiting for admin to pay 50%)
    // - User status: AWAITING_PAYMENT (user needs to pay 60% to see report)
    booking.status = BOOKING_STATUS.REPORT_UPLOADED;
    booking.vendorStatus = BOOKING_STATUS.REPORT_UPLOADED;
    booking.userStatus = BOOKING_STATUS.AWAITING_PAYMENT;

    // Note: 2nd payment will be credited after admin approves the report (in approveReport function)

    await booking.save();

    // Send notification to user and admin
    try {
      await sendBookingStatusUpdateEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        status: 'REPORT_UPLOADED',
        message: 'Your water detection report is ready. Please pay the remaining amount to view it.'
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
          message: `You have successfully uploaded the water detection report for booking #${booking._id.toString().slice(-6)}. User will be notified to pay remaining amount.`,
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
          title: 'Report Uploaded by Vendor',
          message: `Vendor has uploaded the water detection report. Please pay remaining ₹${booking.payment.remainingAmount} to view it.`,
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
            message: `New water detection report uploaded for booking #${booking._id.toString().slice(-6)}`,
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
      .populate('user', 'name email phone address profilePicture documents.profilePicture')
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
      .populate('user', 'name email phone address')
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

    // Check if status is cancellable (ONLY ACCEPTED - until he visits the site)
    const cancellableStatuses = [BOOKING_STATUS.ACCEPTED];
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

    // Trigger auto-reassignment
    const reassignmentResult = await autoReassignBooking(bookingId, cancellationReason, 'VENDOR');

    res.json({
      success: true,
      message: reassignmentResult.success
        ? `Booking cancelled and reassigned successfully.`
        : `Booking cancelled successfully.`,
      data: {
        bookingId: booking._id,
        reassigned: reassignmentResult.success,
        newVendor: reassignmentResult.data?.vendorName
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
  markAsVisited,
  markVisitedAndUploadReport,
  markAsCompleted,
  getBookingDetails,
  requestTravelCharges,
  downloadInvoice
};

