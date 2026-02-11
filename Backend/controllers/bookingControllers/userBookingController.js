const Booking = require('../../models/Booking');
const Service = require('../../models/Service');
const Vendor = require('../../models/Vendor');
const Payment = require('../../models/Payment');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../utils/constants');
const { createOrder } = require('../../services/razorpayService');
const { sendBookingConfirmationEmail, sendBookingStatusUpdateEmail } = require('../../services/emailService');
const { uploadToCloudinary } = require('../../services/cloudinaryService');
const { sendNotification } = require('../../services/notificationService');
const { getIO } = require('../../sockets');
const { calculateDistance, calculateTravelCharges, calculateGST } = require('../../utils/distanceCalculator');
const { getSettings } = require('../../services/settingsService');

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
    }).select('name email phone experience rating address');

    // Calculate distance and sort vendors
    const vendorsWithDistance = vendors.map(vendor => {
      let distance = null;
      if (lat && lng && vendor.address?.coordinates?.lat && vendor.address?.coordinates?.lng) {
        // Simple distance calculation (Haversine formula can be added)
        const latDiff = Math.abs(vendor.address.coordinates.lat - parseFloat(lat));
        const lngDiff = Math.abs(vendor.address.coordinates.lng - parseFloat(lng));
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
    const {
      serviceId,
      vendorId,
      scheduledDate,
      scheduledTime,
      address,
      notes,
      // Customer Enquiry Form fields
      village,
      mandal,
      district,
      state,
      purpose,
      purposeExtent
    } = req.body;

    // Validate required fields
    if (!serviceId || !vendorId || !scheduledDate || !scheduledTime || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user has an active booking (only one booking at a time)
    // Exclude bookings that are cancelled, completed, rejected, or in final settlement stages
    // An active booking is one that is either paid (advancePaid = true) or already assigned (status != PENDING)
    // Final stages where user can create new booking: ADMIN_APPROVED, FINAL_SETTLEMENT, FINAL_SETTLEMENT_COMPLETE, APPROVED

    // DISABLED: Allowing multiple bookings as per user request
    /*
    const activeBooking = await Booking.findOne({
      user: userId,
      status: {
        $nin: [
          BOOKING_STATUS.COMPLETED,
          BOOKING_STATUS.CANCELLED,
          BOOKING_STATUS.REJECTED,
          BOOKING_STATUS.FAILED,
          BOOKING_STATUS.SUCCESS,
          BOOKING_STATUS.ADMIN_APPROVED,
          BOOKING_STATUS.FINAL_SETTLEMENT,
          BOOKING_STATUS.FINAL_SETTLEMENT_COMPLETE,
          BOOKING_STATUS.APPROVED
        ]
      },
      $or: [
        { 'payment.advancePaid': true }, // Any paid booking is active
        // Removed { status: { $ne: BOOKING_STATUS.PENDING } } to allow multiple pending (unpaid) bookings
      ]
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
    */

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

    // Get settings for charge calculation
    const settings = await getSettings(['TRAVEL_CHARGE_PER_KM', 'BASE_RADIUS_KM', 'GST_PERCENTAGE']);
    const travelChargePerKm = settings.TRAVEL_CHARGE_PER_KM || 10;
    const baseRadius = settings.BASE_RADIUS_KM || 30;
    const gstPercentage = settings.GST_PERCENTAGE || 18;

    // Get vendor location
    const vendorLat = vendor.address?.coordinates?.lat;
    const vendorLng = vendor.address?.coordinates?.lng;

    // Get user booking location from address
    const userLat = address.coordinates?.lat;
    const userLng = address.coordinates?.lng;

    // Calculate distance
    let distance = null;
    let travelCharges = 0;
    if (vendorLat && vendorLng && userLat && userLng) {
      distance = calculateDistance(vendorLat, vendorLng, userLat, userLng);
      travelCharges = calculateTravelCharges(distance, baseRadius, travelChargePerKm);
    }

    // Calculate amounts
    const baseServiceFee = service.price;
    const subtotal = baseServiceFee + travelCharges;
    const gst = calculateGST(subtotal, gstPercentage);
    const totalAmount = subtotal + gst;

    // Calculate advance and remaining (40% and 60% of total)
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

    // Create booking in PENDING status - will be set to ASSIGNED only after payment verification
    const booking = await Booking.create({
      user: userId,
      vendor: vendorId,
      service: serviceId,
      status: BOOKING_STATUS.AWAITING_ADVANCE,
      vendorStatus: BOOKING_STATUS.AWAITING_ADVANCE,
      userStatus: BOOKING_STATUS.AWAITING_ADVANCE,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        coordinates: address.coordinates || {},
        landmark: address.landmark,
        village: village || address.village,
        mandal: mandal || address.mandal,
        district: district || address.district
      },
      notes,
      // Customer Enquiry Form fields
      village: village || undefined,
      mandal: mandal || undefined,
      district: district || undefined,
      state: state || undefined,
      purpose: purpose || undefined,
      purposeExtent: purposeExtent ? parseFloat(purposeExtent) : undefined,
      payment: {
        baseServiceFee,
        distance: distance || null,
        travelCharges,
        subtotal,
        gst,
        totalAmount,
        advanceAmount,
        remainingAmount,
        advancePaid: false,
        remainingPaid: false,
        status: PAYMENT_STATUS.PENDING,
        advanceRazorpayOrderId: razorpayOrder.orderId,
        // Calculate vendor payment breakdown
        vendorWalletPayments: (() => {
          const { calculateVendorPayment } = require('../../services/walletService');
          const vendorPayment = calculateVendorPayment(baseServiceFee, travelCharges);
          return {
            base: vendorPayment.base,
            gst: vendorPayment.gst,
            platformFee: vendorPayment.platformFee,
            totalVendorPayment: vendorPayment.totalVendorPayment,
            siteVisitPayment: {
              amount: vendorPayment.totalVendorPayment * 0.5,
              credited: false
            },
            reportUploadPayment: {
              amount: vendorPayment.totalVendorPayment * 0.5,
              credited: false
            },
            totalCredited: 0
          };
        })()
      },
      assignedAt: new Date()
    });

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

    // Send notifications (asynchronously)
    Promise.all([
      sendBookingConfirmationEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        serviceName: service.name,
        vendorName: vendor.name
      }).catch(err => console.error('Email notification error:', err)),

      (async () => {
        try {
          const io = getIO();
          await sendNotification({
            recipient: vendorId,
            recipientModel: 'Vendor',
            type: 'BOOKING_CREATED',
            title: 'New Booking Request',
            message: `New booking request from ${booking.user.name} for ${service.name}`,
            relatedEntity: {
              entityType: 'Booking',
              entityId: booking._id
            },
            metadata: {
              serviceName: service.name,
              userName: booking.user.name,
              scheduledDate: booking.scheduledDate
            }
          }, io);
        } catch (err) {
          console.error('Socket notification error:', err);
        }
      })()
    ]);

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
      // Use userStatus for user queries
      query.userStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('vendor', 'name email phone rating')
        .populate('service', 'name price machineType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    // Fetch profile pictures for all vendors in the list
    const vendorIds = [...new Set(bookings.map(b => b.vendor?._id).filter(id => id))];
    if (vendorIds.length > 0) {
      const VendorDocument = require('../../models/VendorDocument');
      const profilePics = await VendorDocument.find({
        vendor: { $in: vendorIds },
        documentType: 'PROFILE_PICTURE',
        isActive: true
      }).select('vendor url');

      const profilePicMap = {};
      profilePics.forEach(pic => {
        profilePicMap[pic.vendor.toString()] = pic.url;
      });

      // Update bookings with profile pictures
      bookings.forEach(booking => {
        if (booking.vendor && profilePicMap[booking.vendor._id.toString()]) {
          const vendorObj = booking.vendor.toObject ? booking.vendor.toObject() : booking.vendor;
          const url = profilePicMap[booking.vendor._id.toString()];
          vendorObj.profilePicture = url;
          vendorObj.documents = { profilePicture: { url } };
          booking.vendor = vendorObj;
        }
      });
    }

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
      .populate('vendor', 'name email phone rating address')
      .populate('service', 'name price machineType description');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Fetch vendor's profile picture from VendorDocument collection
    if (booking.vendor) {
      const VendorDocument = require('../../models/VendorDocument');
      const profilePic = await VendorDocument.findOne({
        vendor: booking.vendor._id,
        documentType: 'PROFILE_PICTURE',
        isActive: true
      }).select('url');

      if (profilePic) {
        // Convert to plain object if it's a Mongoose document
        const vendorObj = booking.vendor.toObject ? booking.vendor.toObject() : booking.vendor;
        vendorObj.profilePicture = profilePic.url;

        // Also provide standard documents object for compatibility
        vendorObj.documents = {
          profilePicture: {
            url: profilePic.url
          }
        };

        booking.vendor = vendorObj;
      }
    }

    // Get payment config if payment is pending
    let paymentConfig = null;
    if (booking.status === BOOKING_STATUS.PENDING || booking.status === BOOKING_STATUS.AWAITING_PAYMENT || booking.status === BOOKING_STATUS.AWAITING_ADVANCE) {
      const Payment = require('../../models/Payment');
      const { PAYMENT_STATUS } = require('../../utils/constants');

      const payment = await Payment.findOne({
        booking: bookingId,
        paymentType: 'ADVANCE',
        status: PAYMENT_STATUS.PENDING
      });

      if (payment) {
        paymentConfig = {
          razorpayOrderId: payment.razorpayOrderId,
          keyId: process.env.RAZORPAY_KEY_ID,
          amount: payment.amount,
          currency: 'INR'
        };
      } else if (booking.payment?.advanceRazorpayOrderId && !booking.payment?.advancePaid) {
        // Fallback: use booking's own payment data if Payment record not found
        paymentConfig = {
          razorpayOrderId: booking.payment.advanceRazorpayOrderId,
          keyId: process.env.RAZORPAY_KEY_ID,
          amount: booking.payment.advanceAmount,
          currency: 'INR'
        };
      }
    }

    res.json({
      success: true,
      message: 'Booking details retrieved successfully',
      data: {
        booking,
        paymentConfig
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
      userStatus: BOOKING_STATUS.AWAITING_PAYMENT
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
      userStatus: BOOKING_STATUS.PAYMENT_SUCCESS
    }).populate('vendor', 'name email');

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

    // When user uploads borewell result:
    // - Both user and vendor status: BOREWELL_UPLOADED
    // - Main status: BOREWELL_UPLOADED (will be changed to SUCCESS/FAILED after admin approval)
    booking.status = BOOKING_STATUS.BOREWELL_UPLOADED;
    booking.userStatus = BOOKING_STATUS.BOREWELL_UPLOADED;
    booking.vendorStatus = BOOKING_STATUS.BOREWELL_UPLOADED;
    await booking.save();

    // Send notifications
    try {
      const io = getIO();
      const { sendNotification } = require('../../services/notificationService');

      // Notify vendor - borewell result uploaded by user
      await sendNotification({
        recipient: booking.vendor._id || booking.vendor,
        recipientModel: 'Vendor',
        type: 'BOREWELL_UPLOADED',
        title: 'Borewell Result Uploaded by User',
        message: `User has uploaded borewell result for booking #${booking._id.toString().slice(-6)} - Status: ${status}. Awaiting admin approval.`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        },
        metadata: {
          bookingId: booking._id.toString(),
          status: status,
          userId: userId.toString()
        }
      }, io);

      // Notify admin
      const Admin = require('../../models/Admin');
      const admins = await Admin.find({ isActive: true });

      for (const admin of admins) {
        await sendNotification({
          recipient: admin._id,
          recipientModel: 'Admin',
          type: 'BOREWELL_UPLOADED',
          title: 'Borewell Result Uploaded',
          message: `Borewell result uploaded for booking #${booking._id.toString().slice(-6)} - Status: ${status}`,
          relatedEntity: {
            entityType: 'Booking',
            entityId: booking._id
          },
          metadata: {
            bookingId: booking._id.toString(),
            status: status,
            userId: userId.toString()
          }
        }, io);
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

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
        .populate('vendor', 'name rating')
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
    const { lat, lng, radius = 50, limit = 10, minPrice, maxPrice, minRating, minExperience, serviceType } = req.query;

    // Validate and set radius (50-100km range)
    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius) || searchRadius < 50) {
      searchRadius = 50;
    } else if (searchRadius > 100) {
      searchRadius = 100;
    }

    const query = {
      isActive: true,
      isApproved: true
    };

    // First, get all vendors with services populated (no status filter - show all services)
    const vendors = await Vendor.find(query)
      .select('name email phone experience rating address location services')
      .populate({
        path: 'services',
        // Removed match filter - show all services regardless of status
        select: 'name category price description images status isActive'
      })
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance

    if (vendors.length === 0) {
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

      // Replace services array with filtered one
      v.services = allServices;
      return v;
    }).filter(v => v.services && v.services.length > 0); // Only keep vendors with services

    // Calculate distance and format vendors
    const formattedVendors = vendorsWithServices.map(vendor => {
      let distance = null;
      // Use address.coordinates for distance calculation
      const vendorLat = vendor.address?.coordinates?.lat;
      const vendorLng = vendor.address?.coordinates?.lng;

      if (lat && lng && vendorLat !== null && vendorLat !== undefined && vendorLng !== null && vendorLng !== undefined) {
        // Haversine formula for accurate distance
        const R = 6371; // Earth's radius in km
        const dLat = (parseFloat(vendorLat) - parseFloat(lat)) * Math.PI / 180;
        const dLon = (parseFloat(vendorLng) - parseFloat(lng)) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(parseFloat(lat) * Math.PI / 180) * Math.cos(parseFloat(vendorLat) * Math.PI / 180) *
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
      filteredVendors = filteredVendors.filter(v => {
        const type = serviceType.toLowerCase();

        // Check service tags
        const hasTag = v.serviceTags.some(tag => tag && tag.toLowerCase().includes(type));

        // Check primary category
        const hasCategory = v.category && v.category.toLowerCase().includes(type);

        // Check actual service names - more robust
        const hasServiceName = v.allServices.some(s => s.name.toLowerCase().includes(type) || (s.category && s.category.toLowerCase().includes(type)));

        return hasTag || hasCategory || hasServiceName;
      });
    }

    // Note: We show all vendors, but only calculate distance for those with coordinates
    // Vendors without coordinates will be shown but without distance badge
    // IMPORTANT: We show vendors WITH distance even if outside radius, so users can see all vendors with their distances

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


    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

    const vendor = await Vendor.findById(vendorId)
      .select('name email phone experience rating address location services isActive isApproved')
      .populate({
        path: 'services',
        select: 'name category price description images status isActive'
      })
      .lean();

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (!vendor.isActive || !vendor.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not available'
      });
    }

    // Calculate distance if user location provided
    let distance = null;
    if (lat && lng && vendor.address?.coordinates?.lat && vendor.address?.coordinates?.lng) {
      const R = 6371; // Earth's radius in km
      const dLat = (vendor.address.coordinates.lat - parseFloat(lat)) * Math.PI / 180;
      const dLon = (vendor.address.coordinates.lng - parseFloat(lng)) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(parseFloat(lat) * Math.PI / 180) * Math.cos(vendor.address.coordinates.lat * Math.PI / 180) *
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
      .populate('vendor', 'name rating')
      .populate('service', 'name price')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status scheduledDate scheduledTime service vendor createdAt payment');

    // Format stats
    const stats = {
      total: totalBookings,
      pending: 0,
      accepted: 0,
      completed: 0,
      cancelled: 0
    };

    bookingStats.forEach(stat => {
      if (stat._id === 'PENDING' || stat._id === 'ASSIGNED' || stat._id === 'AWAITING_ADVANCE') {
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
    booking.vendorStatus = BOOKING_STATUS.CANCELLED;
    booking.userStatus = BOOKING_STATUS.CANCELLED;
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

      // Send real-time notification
      const io = getIO();
      await sendNotification({
        recipient: booking.vendor._id,
        recipientModel: 'Vendor',
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        message: `Booking #${booking._id.toString().slice(-6)} has been cancelled by user`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        },
        metadata: {
          bookingId: booking._id.toString(),
          cancellationReason: cancellationReason || 'Cancelled by user'
        }
      }, io);
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

/**
 * Calculate booking charges (for preview before booking)
 */
const calculateBookingCharges = async (req, res) => {
  try {
    const { serviceId, vendorId, userLat, userLng } = req.body;

    if (!serviceId || !vendorId || !userLat || !userLng) {
      return res.status(400).json({
        success: false,
        message: 'serviceId, vendorId, userLat, and userLng are required'
      });
    }

    // Find service and vendor
    const service = await Service.findById(serviceId);
    const vendor = await Vendor.findById(vendorId);

    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or not available'
      });
    }

    if (!vendor || !vendor.isActive || !vendor.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found or not available'
      });
    }

    // Get settings
    const settings = await getSettings(['TRAVEL_CHARGE_PER_KM', 'BASE_RADIUS_KM', 'GST_PERCENTAGE']);
    const travelChargePerKm = settings.TRAVEL_CHARGE_PER_KM || 10;
    const baseRadius = settings.BASE_RADIUS_KM || 30;
    const gstPercentage = settings.GST_PERCENTAGE || 18;

    // Calculate distance
    const vendorLat = vendor.address?.coordinates?.lat;
    const vendorLng = vendor.address?.coordinates?.lng;

    let distance = null;
    let travelCharges = 0;

    if (vendorLat && vendorLng) {
      distance = calculateDistance(vendorLat, vendorLng, parseFloat(userLat), parseFloat(userLng));
      travelCharges = calculateTravelCharges(distance, baseRadius, travelChargePerKm);
    }

    const baseServiceFee = service.price;
    const subtotal = baseServiceFee + travelCharges;
    const gst = calculateGST(subtotal, gstPercentage);
    const totalAmount = subtotal + gst;
    const advanceAmount = totalAmount * 0.4;
    const remainingAmount = totalAmount * 0.6;

    res.json({
      success: true,
      message: 'Charges calculated successfully',
      data: {
        baseServiceFee,
        distance: distance ? parseFloat(distance.toFixed(2)) : null,
        travelCharges: parseFloat(travelCharges.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        gst: parseFloat(gst.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        advanceAmount: parseFloat(advanceAmount.toFixed(2)),
        remainingAmount: parseFloat(remainingAmount.toFixed(2)),
        baseRadius,
        travelChargePerKm,
        gstPercentage
      }
    });
  } catch (error) {
    console.error('Calculate booking charges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate charges',
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
  getDashboardStats,
  calculateBookingCharges
};

