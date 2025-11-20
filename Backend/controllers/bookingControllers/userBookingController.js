const Booking = require('../../models/Booking');
const Service = require('../../models/Service');
const Vendor = require('../../models/Vendor');
const Payment = require('../../models/Payment');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../utils/constants');
const { createOrder } = require('../../services/razorpayService');
const { sendBookingConfirmationEmail, sendBookingStatusUpdateEmail } = require('../../services/emailService');

/**
 * Get available vendors for a service
 * Sorted by: Ratings, Experience, Success Ratio, Distance
 */
const getAvailableVendors = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { lat, lng } = req.query; // User location for distance calculation

    // Find service
    const service = await Service.findById(serviceId).populate('vendor');
    if (!service || service.status !== 'APPROVED' || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or not available'
      });
    }

    // Find all active and approved vendors offering this service
    const vendors = await Vendor.find({
      isActive: true,
      isApproved: true,
      services: serviceId
    }).select('name email phone experience rating address location documents.profilePicture');

    // Calculate distance and sort vendors
    const vendorsWithDistance = vendors.map(vendor => {
      let distance = null;
      if (lat && lng && vendor.location?.coordinates?.lat && vendor.location?.coordinates?.lng) {
        // Simple distance calculation (Haversine formula can be added)
        const latDiff = Math.abs(vendor.location.coordinates.lat - parseFloat(lat));
        const lngDiff = Math.abs(vendor.location.coordinates.lng - parseFloat(lng));
        distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Approximate km
      }

      return {
        ...vendor.toObject(),
        distance,
        successRatio: vendor.rating?.successRatio || 0,
        averageRating: vendor.rating?.averageRating || 0
      };
    });

    // Sort by: Rating (desc), Success Ratio (desc), Experience (desc), Distance (asc)
    vendorsWithDistance.sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      if (b.successRatio !== a.successRatio) return b.successRatio - a.successRatio;
      if (b.experience !== a.experience) return b.experience - a.experience;
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return 0;
    });

    res.json({
      success: true,
      message: 'Vendors retrieved successfully',
      data: {
        service: {
          id: service._id,
          name: service.name,
          price: service.price
        },
        vendors: vendorsWithDistance
      }
    });
  } catch (error) {
    console.error('Get available vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendors',
      error: error.message
    });
  }
};

/**
 * Create booking and initiate advance payment
 */
const createBooking = async (req, res) => {
  try {
    const userId = req.userId;
    const { serviceId, vendorId, scheduledDate, scheduledTime, address, notes } = req.body;

    // Validate required fields
    if (!serviceId || !vendorId || !scheduledDate || !scheduledTime || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Find service
    const service = await Service.findById(serviceId);
    if (!service || service.status !== 'APPROVED' || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or not available'
      });
    }

    // Find vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.isActive || !vendor.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found or not available'
      });
    }

    // Calculate payment amounts (40% advance, 60% remaining)
    const totalAmount = service.price;
    const advanceAmount = totalAmount * 0.4;
    const remainingAmount = totalAmount * 0.6;

    // Create Razorpay order for advance payment
    const razorpayOrder = await createOrder(advanceAmount, 'INR', {
      receipt: `advance_${Date.now()}`,
      notes: {
        bookingType: 'ADVANCE',
        serviceId: serviceId.toString(),
        vendorId: vendorId.toString()
      }
    });

    // Create booking
    const booking = await Booking.create({
      user: userId,
      vendor: vendorId,
      service: serviceId,
      status: BOOKING_STATUS.PENDING,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        coordinates: address.coordinates || {},
        landmark: address.landmark
      },
      notes,
      payment: {
        totalAmount,
        advanceAmount,
        remainingAmount,
        advancePaid: false,
        remainingPaid: false,
        status: PAYMENT_STATUS.PENDING,
        advanceRazorpayOrderId: razorpayOrder.orderId
      },
      assignedAt: new Date()
    });

    // Update status to ASSIGNED
    booking.status = BOOKING_STATUS.ASSIGNED;
    await booking.save();

    // Create payment record
    await Payment.create({
      booking: booking._id,
      user: userId,
      vendor: vendorId,
      paymentType: 'ADVANCE',
      amount: advanceAmount,
      status: PAYMENT_STATUS.PENDING,
      razorpayOrderId: razorpayOrder.orderId,
      description: `Advance payment for ${service.name}`
    });

    // Populate booking for response
    await booking.populate('user', 'name email phone');
    await booking.populate('vendor', 'name email phone');
    await booking.populate('service', 'name price');

    // Send notifications
    try {
      await sendBookingConfirmationEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        serviceName: service.name,
        vendorName: vendor.name
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please complete advance payment.',
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          service: booking.service,
          vendor: booking.vendor
        },
        payment: {
          advanceAmount,
          remainingAmount,
          totalAmount,
          razorpayOrderId: razorpayOrder.orderId,
          keyId: process.env.RAZORPAY_KEY_ID
        }
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

/**
 * Get user bookings
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('vendor', 'name email phone documents.profilePicture rating')
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
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
      error: error.message
    });
  }
};

/**
 * Get booking details
 */
const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId
    })
      .populate('user', 'name email phone')
      .populate('vendor', 'name email phone documents.profilePicture rating address')
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
 * Initiate remaining payment (60%)
 */
const initiateRemainingPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
      status: BOOKING_STATUS.AWAITING_PAYMENT
    }).populate('service', 'name price');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or payment not required'
      });
    }

    if (booking.payment.remainingPaid) {
      return res.status(400).json({
        success: false,
        message: 'Remaining payment already completed'
      });
    }

    // Create Razorpay order for remaining payment
    const razorpayOrder = await createOrder(booking.payment.remainingAmount, 'INR', {
      receipt: `remaining_${Date.now()}`,
      notes: {
        bookingType: 'REMAINING',
        bookingId: bookingId.toString()
      }
    });

    // Update booking with remaining payment order ID
    booking.payment.remainingRazorpayOrderId = razorpayOrder.orderId;
    await booking.save();

    // Create payment record
    await Payment.create({
      booking: booking._id,
      user: userId,
      vendor: booking.vendor,
      paymentType: 'REMAINING',
      amount: booking.payment.remainingAmount,
      status: PAYMENT_STATUS.PENDING,
      razorpayOrderId: razorpayOrder.orderId,
      description: `Remaining payment for ${booking.service.name}`
    });

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        bookingId: booking._id,
        amount: booking.payment.remainingAmount,
        razorpayOrderId: razorpayOrder.orderId,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Initiate remaining payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
};

/**
 * Upload borewell result (success/failure)
 */
const uploadBorewellResult = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;
    const { status, images } = req.body; // status: 'SUCCESS' or 'FAILED'

    if (!['SUCCESS', 'FAILED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be SUCCESS or FAILED'
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
      status: BOOKING_STATUS.COMPLETED
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not eligible for result upload'
      });
    }

    // Update borewell result
    booking.borewellResult = {
      status,
      images: images || [],
      uploadedAt: new Date(),
      uploadedBy: userId
    };

    // Update booking status
    booking.status = status === 'SUCCESS' ? BOOKING_STATUS.SUCCESS : BOOKING_STATUS.FAILED;
    await booking.save();

    res.json({
      success: true,
      message: 'Borewell result uploaded successfully. Awaiting admin approval.',
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          borewellResult: booking.borewellResult
        }
      }
    });
  } catch (error) {
    console.error('Upload borewell result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload borewell result',
      error: error.message
    });
  }
};

/**
 * Download invoice
 */
const downloadInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
      status: { $in: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.SUCCESS, BOOKING_STATUS.FAILED] }
    })
      .populate('user', 'name email phone address')
      .populate('vendor', 'name email phone')
      .populate('service', 'name price machineType');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or invoice not available'
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
        invoiceNumber: booking.invoice.invoiceNumber
      }
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice',
      error: error.message
    });
  }
};

module.exports = {
  getAvailableVendors,
  createBooking,
  getUserBookings,
  getBookingDetails,
  initiateRemainingPayment,
  uploadBorewellResult,
  downloadInvoice
};

