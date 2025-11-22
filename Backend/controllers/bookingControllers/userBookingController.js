const Booking = require('../../models/Booking');
const Service = require('../../models/Service');
const Vendor = require('../../models/Vendor');
const Payment = require('../../models/Payment');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../utils/constants');
const { createOrder } = require('../../services/razorpayService');
const { sendBookingConfirmationEmail, sendBookingStatusUpdateEmail } = require('../../services/emailService');
const { uploadToCloudinary } = require('../../services/cloudinaryService');

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

    // Check if user has an active booking (only one booking at a time)
    const activeBooking = await Booking.findOne({
      user: userId,
      status: {
        $nin: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.FAILED, BOOKING_STATUS.SUCCESS]
      }
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active booking. Please complete or cancel your current booking before creating a new one.',
        data: {
          activeBookingId: activeBooking._id,
          activeBookingStatus: activeBooking.status
        }
      });
    }

    // Find service
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
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
    let razorpayOrder;
    try {
      razorpayOrder = await createOrder(advanceAmount, 'INR', {
        receipt: `advance_${Date.now()}`,
        notes: {
          bookingType: 'ADVANCE',
          serviceId: serviceId.toString(),
          vendorId: vendorId.toString()
        }
      });
      
      // Validate order creation
      if (!razorpayOrder || !razorpayOrder.orderId) {
        throw new Error('Failed to create Razorpay order');
      }
    } catch (razorpayError) {
      console.error('Razorpay order creation error:', razorpayError);
      return res.status(500).json({
        success: false,
        message: 'Payment service unavailable. Please try again later or contact support.',
        error: razorpayError.message
      });
    }

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
        },
        razorpayOrder: {
          id: razorpayOrder.orderId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency
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
    const { status } = req.body; // status: 'SUCCESS' or 'FAILED'

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

    // Handle file uploads (images)
    const borewellImages = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file.buffer, 'borewell-results/images');
        borewellImages.push({
          url: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date()
        });
      }
    }

    // Update borewell result
    booking.borewellResult = {
      status,
      images: borewellImages,
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

/**
 * Get all available services (for users to browse)
 */
const getAllServices = async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;

    // No status filter - show all services regardless of approval status
    const query = {
      isActive: true
    };

    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, total] = await Promise.all([
      Service.find(query)
        .populate('vendor', 'name rating documents.profilePicture')
        .select('name description price duration machineType category images vendor')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Service.countDocuments(query)
    ]);

    // Get unique categories (all active services)
    const categories = await Service.distinct('category', { isActive: true });

    res.json({
      success: true,
      message: 'Services retrieved successfully',
      data: {
        services,
        categories: categories.filter(c => c),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalServices: total
        }
      }
    });
  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve services',
      error: error.message
    });
  }
};

/**
 * Get nearby vendors with their services (for user dashboard and listings)
 */
const getNearbyVendors = async (req, res) => {
  try {
    const { lat, lng, limit = 10, minPrice, maxPrice, minRating, minExperience, serviceType } = req.query;

    const query = {
      isActive: true,
      isApproved: true
    };

    // First, get all vendors with services populated (no status filter - show all services)
    const vendors = await Vendor.find(query)
      .select('name email phone experience rating address location documents.profilePicture services')
      .populate({
        path: 'services',
        // Removed match filter - show all services regardless of status
        select: 'name category price description images status isActive'
      })
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance

    console.log(`[getNearbyVendors] Found ${vendors.length} active and approved vendors`);

    if (vendors.length === 0) {
      console.log(`[getNearbyVendors] No vendors found with isActive: true, isApproved: true`);
      return res.json({
        success: true,
        message: 'No vendors found',
        data: {
          vendors: []
        }
      });
    }

    // Filter vendors that have at least one service (any status - no approval required)
    let vendorsWithServices = vendors.map(v => {
      // Filter out null/undefined services
      const allServices = v.services ? v.services.filter(s => s !== null && s !== undefined) : [];

      if (allServices.length === 0) {
        console.log(`[getNearbyVendors] Vendor ${v.name} (${v._id}) has no services. Services array length: ${v.services?.length || 0}`);
      } else {
        console.log(`[getNearbyVendors] Vendor ${v.name} (${v._id}) has ${allServices.length} services`);
      }

      // Replace services array with filtered one
      v.services = allServices;
      return v;
    }).filter(v => v.services && v.services.length > 0); // Only keep vendors with services

    console.log(`[getNearbyVendors] Found ${vendorsWithServices.length} vendors with services out of ${vendors.length} total`);

    // Calculate distance and format vendors
    const formattedVendors = vendorsWithServices.map(vendor => {
      let distance = null;
      if (lat && lng && vendor.location?.coordinates?.lat && vendor.location?.coordinates?.lng) {
        // Haversine formula for accurate distance
        const R = 6371; // Earth's radius in km
        const dLat = (vendor.location.coordinates.lat - parseFloat(lat)) * Math.PI / 180;
        const dLon = (vendor.location.coordinates.lng - parseFloat(lng)) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(parseFloat(lat) * Math.PI / 180) * Math.cos(vendor.location.coordinates.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      }

      // Get primary service category
      const primaryService = vendor.services && vendor.services.length > 0
        ? vendor.services[0]
        : null;

      // Get minimum price from all services
      const prices = vendor.services.map(s => s.price).filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

      return {
        ...vendor, // Already a plain object due to lean()
        distance,
        averageRating: vendor.rating?.averageRating || 0,
        totalRatings: vendor.rating?.totalRatings || 0,
        category: primaryService?.category || 'General',
        minPrice,
        serviceTags: vendor.services
          .map(s => s.category || s.name)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 3),
        allServices: vendor.services.map(s => ({
          id: s._id,
          name: s.name,
          category: s.category,
          price: s.price,
          description: s.description,
          images: s.images
        }))
      };
    });

    // Apply filters
    let filteredVendors = formattedVendors;

    // Filter by price range
    if (minPrice) {
      filteredVendors = filteredVendors.filter(v => v.minPrice >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filteredVendors = filteredVendors.filter(v => v.minPrice <= parseFloat(maxPrice));
    }

    // Filter by rating
    if (minRating) {
      filteredVendors = filteredVendors.filter(v => v.averageRating >= parseFloat(minRating));
    }

    // Filter by experience
    if (minExperience) {
      filteredVendors = filteredVendors.filter(v => (v.experience || 0) >= parseFloat(minExperience));
    }

    // Filter by service type/category
    if (serviceType) {
      filteredVendors = filteredVendors.filter(v => 
        v.serviceTags.some(tag => tag.toLowerCase().includes(serviceType.toLowerCase())) ||
        v.category?.toLowerCase().includes(serviceType.toLowerCase())
      );
    }

    // Sort by distance (if available), then by rating
    filteredVendors.sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return (b.averageRating || 0) - (a.averageRating || 0);
    });

    res.json({
      success: true,
      message: 'Nearby vendors retrieved successfully',
      data: {
        vendors: filteredVendors
      }
    });
  } catch (error) {
    console.error('Get nearby vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve nearby vendors',
      error: error.message
    });
  }
};

/**
 * Get vendor profile details (for users to view)
 */
const getVendorProfile = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { lat, lng } = req.query; // User location for distance calculation

    console.log(`[getVendorProfile] Fetching vendor profile for ID: ${vendorId}`);

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

    const vendor = await Vendor.findById(vendorId)
      .select('name email phone experience rating address location documents.profilePicture services isActive isApproved')
      .populate({
        path: 'services',
        select: 'name category price description images status isActive'
      })
      .lean();

    if (!vendor) {
      console.log(`[getVendorProfile] Vendor not found with ID: ${vendorId}`);
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (!vendor.isActive || !vendor.isApproved) {
      console.log(`[getVendorProfile] Vendor ${vendorId} is not active or not approved. isActive: ${vendor.isActive}, isApproved: ${vendor.isApproved}`);
      return res.status(404).json({
        success: false,
        message: 'Vendor not available'
      });
    }

    // Calculate distance if user location provided
    let distance = null;
    if (lat && lng && vendor.location?.coordinates?.lat && vendor.location?.coordinates?.lng) {
      const R = 6371; // Earth's radius in km
      const dLat = (vendor.location.coordinates.lat - parseFloat(lat)) * Math.PI / 180;
      const dLon = (vendor.location.coordinates.lng - parseFloat(lng)) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(parseFloat(lat) * Math.PI / 180) * Math.cos(vendor.location.coordinates.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance = R * c;
    }

    // Format vendor data
    const formattedVendor = {
      ...vendor,
      distance,
      averageRating: vendor.rating?.averageRating || 0,
      totalRatings: vendor.rating?.totalRatings || 0,
      services: (vendor.services || []).filter(s => s !== null && s !== undefined).map(s => ({
        id: s._id,
        name: s.name,
        category: s.category,
        price: s.price,
        description: s.description,
        images: s.images,
        status: s.status,
        isActive: s.isActive
      }))
    };

    res.json({
      success: true,
      message: 'Vendor profile retrieved successfully',
      data: {
        vendor: formattedVendor
      }
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendor profile',
      error: error.message
    });
  }
};

/**
 * Get user dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Get booking counts by status
    const bookingStats = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total bookings
    const totalBookings = await Booking.countDocuments({ user: userId });

    // Get recent bookings (last 5)
    const recentBookings = await Booking.find({ user: userId })
      .populate('vendor', 'name documents.profilePicture rating')
      .populate('service', 'name price')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status scheduledDate scheduledTime service vendor createdAt');

    // Format stats
    const stats = {
      total: totalBookings,
      pending: 0,
      accepted: 0,
      completed: 0,
      cancelled: 0
    };

    bookingStats.forEach(stat => {
      if (stat._id === 'PENDING' || stat._id === 'ASSIGNED') {
        stats.pending += stat.count;
      } else if (stat._id === 'ACCEPTED' || stat._id === 'VISITED' || stat._id === 'REPORT_UPLOADED' || stat._id === 'AWAITING_PAYMENT') {
        stats.accepted += stat.count;
      } else if (stat._id === 'COMPLETED') {
        stats.completed += stat.count;
      } else if (stat._id === 'CANCELLED' || stat._id === 'REJECTED') {
        stats.cancelled += stat.count;
      }
    });

    res.json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        stats,
        recentBookings
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
 * Cancel a booking
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;
    const { cancellationReason } = req.body;

    // Find booking
    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId
    }).populate('vendor', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be cancelled
    const cancellableStatuses = [
      BOOKING_STATUS.PENDING,
      BOOKING_STATUS.ASSIGNED,
      BOOKING_STATUS.ACCEPTED
    ];

    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled. Current status: ${booking.status}`
      });
    }

    // Update booking status
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = cancellationReason || 'Cancelled by user';
    await booking.save();

    // Send notification email to vendor
    try {
      await sendBookingStatusUpdateEmail({
        email: booking.vendor.email,
        name: booking.vendor.name,
        bookingId: booking._id.toString(),
        status: 'CANCELLED',
        message: 'User has cancelled the booking'
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: {
          id: booking._id,
          status: booking.status
        }
      }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

module.exports = {
  getAllServices,
  getAvailableVendors,
  getNearbyVendors,
  getVendorProfile,
  createBooking,
  getUserBookings,
  getBookingDetails,
  cancelBooking,
  initiateRemainingPayment,
  uploadBorewellResult,
  downloadInvoice,
  getDashboardStats
};

