const mongoose = require('mongoose');
const Booking = require('../../models/Booking');
const Service = require('../../models/Service');
const Vendor = require('../../models/Vendor');
const VendorDocument = require('../../models/VendorDocument');
const Payment = require('../../models/Payment');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../utils/constants');
const { createOrder } = require('../../services/razorpayService');
const { sendBookingConfirmationEmail, sendBookingStatusUpdateEmail } = require('../../services/emailService');
const { uploadToCloudinary } = require('../../services/cloudinaryService');
const { sendNotification } = require('../../services/notificationService');
const { getIO } = require('../../sockets');
const { calculateDistance, calculateTravelCharges, calculateGST } = require('../../utils/distanceCalculator');
const { getSettings } = require('../../services/settingsService');
const { normalizeAcresGuntas } = require('../../utils/landAreaHelper');

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
      isActive: { $ne: false },
      $or: [
        { isApproved: true },
        { verificationStatus: { $in: ['APPROVED', 'ACTIVATED', 'VERIFIED'] } },
        { isApproved: { $exists: false } }
      ],
      services: serviceId
    }).select('name email phone experience rating address workingDays workingHours aboutExpert languages availableServices instruments');

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
      alternatePhone,
      // Customer Enquiry Form fields
      village,
      mandal,
      district,
      state,
      purpose,
      surveyCategory,
      purposeExtent,
      areaUnit,
      existingBorewell,
      existingBorewellInfo,
      customerNotes,
      customerPhotos,
      supportingDocuments,
      images,
      documents,
      surveyNumber
    } = req.body;

    // Validate required fields
    if (!serviceId || !vendorId || !scheduledDate || !address) {
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

    // Find vendor (support ObjectId or string)
    let vendor = null;
    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      vendor = await Vendor.findById(vendorId);
    } else if (vendorId) {
      vendor = await Vendor.findOne({ _id: vendorId });
    }

    if (!vendor) {
      console.warn(`Vendor not found during createBooking: ${vendorId}`);
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (vendor.isActive === false) {
      return res.status(404).json({
        success: false,
        message: 'Vendor is currently inactive'
      });
    }

    // Find service with multiple fallback strategies
    let service = null;
    if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
      service = await Service.findById(serviceId);
    }

    // If service not found by direct ID, check vendor's populated/referenced services
    if (!service && vendor.services && vendor.services.length > 0) {
      const firstService = vendor.services[0];
      if (mongoose.Types.ObjectId.isValid(firstService)) {
        service = await Service.findById(firstService);
      } else if (firstService && typeof firstService === 'object') {
        service = firstService;
      }
    }

    // If still not found, find any active Service in the database
    if (!service) {
      service = await Service.findOne({ status: 'ACTIVE', isActive: { $ne: false } }) || await Service.findOne();
    }

    // Auto-create standard Service in DB if table is completely empty
    if (!service) {
      service = await Service.create({
        name: 'Groundwater Survey',
        category: 'Groundwater Survey',
        price: 5000,
        status: 'ACTIVE',
        isActive: true
      });
    }

    // Validate vendor working day availability
    if (scheduledDate && vendor.workingDays) {
      let bookingDate;
      if (typeof scheduledDate === 'string' && scheduledDate.includes('-')) {
        const parts = scheduledDate.split('T')[0].split('-');
        if (parts.length === 3) {
          bookingDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          bookingDate = new Date(scheduledDate);
        }
      } else {
        bookingDate = new Date(scheduledDate);
      }

      if (!isNaN(bookingDate.getTime())) {
        const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        let activeDays = [];
        const rawDays = vendor.workingDays;
        if (Array.isArray(rawDays)) {
          activeDays = rawDays;
        } else if (typeof rawDays === 'string') {
          const trimmed = rawDays.trim().toLowerCase();
          if (trimmed === 'all days' || trimmed === 'everyday' || trimmed === 'all' || trimmed === 'monday - sunday' || trimmed === 'monday to sunday') {
            activeDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          } else if (trimmed === 'weekdays' || trimmed === 'monday - friday' || trimmed === 'monday to friday') {
            activeDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          } else if (trimmed === 'weekends' || trimmed === 'weekends only' || trimmed === 'saturday & sunday' || trimmed === 'saturday - sunday') {
            activeDays = ['Saturday', 'Sunday'];
          } else if (trimmed === 'monday - saturday' || trimmed === 'monday to saturday') {
            activeDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          } else if (rawDays.includes(',')) {
            activeDays = rawDays.split(',').map(d => d.trim());
          }
        }

        if (activeDays.length > 0) {
          const isDayActive = activeDays.some(d => d.toLowerCase() === dayOfWeek.toLowerCase() || d.toLowerCase().startsWith(dayOfWeek.substring(0, 3).toLowerCase()));
          if (!isDayActive) {
            return res.status(400).json({
              success: false,
              message: `Expert is not available on ${dayOfWeek}s. Please select an available working date.`
            });
          }
        }
      }
    }

    // Get settings
    const settings = await getSettings(['TRAVEL_CHARGE_PER_KM', 'BASE_RADIUS_KM', 'GST_PERCENTAGE', 'ADVANCE_PAYMENT_PERCENTAGE', 'REMAINING_PAYMENT_PERCENTAGE']);
    const adminTravelChargePerKm = Number(settings.TRAVEL_CHARGE_PER_KM) || 10;
    const adminBaseRadius = Number(settings.BASE_RADIUS_KM) || 30;
    const gstPercentage = Number(settings.GST_PERCENTAGE) || 18;
    const advancePercentage = Number(settings.ADVANCE_PAYMENT_PERCENTAGE) || 40;
    const remainingPercentage = Number(settings.REMAINING_PAYMENT_PERCENTAGE) || 60;

    // Resolve effective base radius & travel rate (vendor custom settings take priority, admin acts as platform default)
    let baseRadius = adminBaseRadius;
    if (vendor.serviceRadius) {
      const parsedRadius = parseInt(vendor.serviceRadius, 10);
      if (!isNaN(parsedRadius) && parsedRadius > 0) {
        baseRadius = parsedRadius;
      }
    }

    let travelChargePerKm = adminTravelChargePerKm;
    if (typeof vendor.travelChargesPerKm === 'number' && vendor.travelChargesPerKm > 0) {
      travelChargePerKm = vendor.travelChargesPerKm;
    }

    // Get vendor location (handles both object and GeoJSON array)
    let vendorLat = vendor.address?.coordinates?.lat;
    let vendorLng = vendor.address?.coordinates?.lng;
    if (vendorLat === undefined && Array.isArray(vendor.address?.coordinates?.coordinates)) {
      vendorLng = vendor.address.coordinates.coordinates[0];
      vendorLat = vendor.address.coordinates.coordinates[1];
    }

    // Get user booking location from address
    let userLat = address.coordinates?.lat;
    let userLng = address.coordinates?.lng;
    if (userLat === undefined && Array.isArray(address.coordinates?.coordinates)) {
      userLng = address.coordinates.coordinates[0];
      userLat = address.coordinates.coordinates[1];
    }

    // Calculate distance
    let distance = null;
    let travelCharges = 0;

    const parsedUserLat = parseFloat(userLat);
    const parsedUserLng = parseFloat(userLng);

    if (vendorLat != null && vendorLng != null && !isNaN(parsedUserLat) && !isNaN(parsedUserLng)) {
      distance = calculateDistance(Number(vendorLat), Number(vendorLng), parsedUserLat, parsedUserLng);
      if (typeof distance === 'number' && !isNaN(distance)) {
        travelCharges = calculateTravelCharges(distance, baseRadius, travelChargePerKm);
      }
    }

    // Calculate amounts according to standard formula:
    // 1. Base Service Fee - Dynamic based on vendor's set servicePrice, or service price, or default
    // 2. GST (18% on Base Service Fee)
    // 3. Subtotal = Base Service Fee + GST
    // 4. Travel Charges
    // 5. Total Amount = Subtotal + Travel Charges
    const baseServiceFee = (typeof vendor.servicePrice === 'number' && vendor.servicePrice > 0)
      ? vendor.servicePrice
      : (service && typeof service.price === 'number' && service.price > 0 ? service.price : 3500);
    const gst = parseFloat(calculateGST(baseServiceFee, gstPercentage).toFixed(2));
    const subtotal = parseFloat((baseServiceFee + gst).toFixed(2));
    const travelChargesRounded = parseFloat(travelCharges.toFixed(2));
    const totalAmount = parseFloat((subtotal + travelChargesRounded).toFixed(2));

    // Calculate advance and remaining from configurable percentages
    const advanceAmount = parseFloat((totalAmount * (advancePercentage / 100)).toFixed(2));
    const remainingAmount = parseFloat((totalAmount - advanceAmount).toFixed(2));

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
      vendor: vendor._id,
      service: service._id,
      status: BOOKING_STATUS.AWAITING_ADVANCE,
      vendorStatus: BOOKING_STATUS.AWAITING_ADVANCE,
      userStatus: BOOKING_STATUS.AWAITING_ADVANCE,
      scheduledDate: new Date(scheduledDate),
      scheduledTime: scheduledTime || 'TBD', // Expert sets the actual time upon acceptance
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
      alternatePhone: alternatePhone || undefined,
      // Customer Enquiry Form fields
      village: village || undefined,
      mandal: mandal || undefined,
      district: district || undefined,
      state: state || undefined,
      purpose: purpose || undefined,
      surveyCategory: surveyCategory || purpose || undefined,
      purposeExtent: purposeExtent ? normalizeAcresGuntas(purposeExtent).decimalValue : undefined,
      areaUnit: areaUnit || 'Acres',
      existingBorewellInfo: existingBorewellInfo || (existingBorewell?.hasExisting ? `Yes (${[existingBorewell.depthInFeet ? `${existingBorewell.depthInFeet}ft` : null, existingBorewell.yearOfDrilling ? `Year: ${existingBorewell.yearOfDrilling}` : null, existingBorewell.gapsAndDepths ? `Gaps: ${existingBorewell.gapsAndDepths}` : null].filter(Boolean).join(', ')})` : 'None'),
      customerNotes: customerNotes || notes || undefined,
      customerPhotos: Array.isArray(customerPhotos) && customerPhotos.length > 0 ? customerPhotos : (Array.isArray(images) && images.length > 0 ? images.map(img => typeof img === 'string' ? { url: img } : img) : []),
      supportingDocuments: Array.isArray(supportingDocuments) && supportingDocuments.length > 0 ? supportingDocuments : (Array.isArray(documents) && documents.length > 0 ? documents.map(doc => typeof doc === 'string' ? { url: doc, name: 'Attachment' } : doc) : []),
      surveyNumber: surveyNumber || undefined,
      payment: {
        baseServiceFee: parseFloat(baseServiceFee.toFixed(2)),
        distance: (distance !== null && !isNaN(distance)) ? parseFloat(distance.toFixed(2)) : null,
        travelCharges: travelChargesRounded,
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
          // Pass baseServiceFee + travelCharges so commission/TDS apply to base only
          // (matching Payout Summary: commission=10% of base, TDS=1% of base)
          const vendorPayment = calculateVendorPayment(baseServiceFee, travelCharges);
          return {
            base: vendorPayment.base,
            gst: vendorPayment.customerGST,
            platformFee: vendorPayment.platformCommission + vendorPayment.gstOnCommission + vendorPayment.tds,
            totalVendorPayment: vendorPayment.totalVendorPayment,
            siteVisitPayment: {
              amount: parseFloat((vendorPayment.totalVendorPayment * 0.5).toFixed(2)),
              credited: false
            },
            reportUploadPayment: {
              amount: parseFloat((vendorPayment.totalVendorPayment * 0.5).toFixed(2)),
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
    await booking.populate('user', 'name email phone alternatePhone');
    await booking.populate('vendor', 'name email phone designation workingDays workingHours');
    await booking.populate('service', 'name price');

    // Send notifications (asynchronously)
    Promise.all([
      sendBookingConfirmationEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        displayBookingId: booking.bookingId || `JLD-${booking._id.toString().slice(-5).toUpperCase()}`,
        serviceName: service.name,
        surveyCategory: booking.surveyCategory || service.name || 'Agriculture Survey',
        surveyDate: booking.scheduledDate,
        location: booking.address ? `${booking.address.city || booking.village || ''}, ${booking.address.state || booking.state || ''}`.trim().replace(/^,\s*/, '') : (booking.district ? `${booking.district}, ${booking.state}` : 'Nizamabad, Telangana'),
        propertyType: booking.propertyType || 'Residential',
        vendorName: vendor.name,
        vendorDesignation: vendor.designation || 'Geophysicist',
        surveyPurpose: booking.purpose || 'Borewell',
        area: booking.purposeExtent ? `${booking.purposeExtent} ${booking.areaUnit || 'Acres'}` : '3.50 Acres',
        totalAmount: booking.payment?.totalAmount || 15000,
        advancePaidPercentage: '40%',
        paymentStatus: 'Advance Paid'
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
        .populate('vendor', 'name email phone rating designation workingDays workingHours')
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
      .populate('user', 'name email phone alternatePhone')
      .populate('vendor', 'name email phone rating address designation workingDays workingHours')
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
    }).populate('vendor', 'name email designation');

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
      status: {
        $in: [
          BOOKING_STATUS.PAYMENT_SUCCESS,
          BOOKING_STATUS.BOREWELL_UPLOADED,
          BOOKING_STATUS.ADMIN_APPROVED,
          BOOKING_STATUS.FINAL_SETTLEMENT,
          BOOKING_STATUS.COMPLETED,
          BOOKING_STATUS.SUCCESS,
          BOOKING_STATUS.FAILED
        ]
      }
    })
      .populate('user', 'name email phone alternatePhone address')
      .populate('vendor', 'name email phone designation')
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
        .populate('vendor', 'name rating designation')
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
      isActive: { $ne: false },
      $or: [
        { isApproved: true },
        { verificationStatus: { $in: ['APPROVED', 'ACTIVATED', 'VERIFIED'] } },
        { isApproved: { $exists: false } }
      ]
    };

    // First, get all vendors with services populated (no status filter - show all services)
    const vendors = await Vendor.find(query)
      .select('name email phone experience experienceDetails designation education institution graduationYear specialization surveysCompleted rating bookingStats serviceAreas designation address location services servicePrice machineType workingDays workingHours aboutExpert languages availableServices instruments district state serviceRadius willingToTravel modeOfTravel travelChargesPerKm multipleStates')
      .populate({
        path: 'services',
        // Removed match filter - show all services regardless of status
        select: 'name category price description images status isActive machineType'
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

    // Ensure vendors array has sanitized services
    let vendorsWithServices = vendors.map(v => {
      const allServices = v.services ? v.services.filter(s => s !== null && s !== undefined) : [];
      v.services = allServices;
      return v;
    });

    // Fetch profile pictures for all vendors at once
    const vendorIds = vendorsWithServices.map(v => v._id);
    const profilePics = await VendorDocument.find({
      vendor: { $in: vendorIds },
      documentType: 'PROFILE_PICTURE',
      isActive: true
    }).select('vendor url').lean();

    // Create a map for quick lookup
    const profilePicMap = profilePics.reduce((acc, pic) => {
      acc[pic.vendor.toString()] = pic.url;
      return acc;
    }, {});

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

      // Get vendor's dynamic servicePrice (or minimum price from services)
      const prices = (vendor.services || []).map(s => s.price).filter(p => p > 0);
      const minPrice = (typeof vendor.servicePrice === 'number' && vendor.servicePrice > 0)
        ? vendor.servicePrice
        : (prices.length > 0 ? Math.min(...prices) : 3500);

      const serviceCategory = primaryService?.category || vendor.designation || 'Groundwater Survey';

      // Enhanced Expert Profile Stats calculation
      const successfulSurveys = vendor.rating?.successCount ?? vendor.bookingStats?.success ?? (typeof vendor.surveysCompleted === 'number' ? vendor.surveysCompleted : 0);
      const failedSurveys = vendor.rating?.failureCount ?? vendor.bookingStats?.failed ?? 0;
      const totalSurveys = successfulSurveys + failedSurveys;
      const successRate = vendor.rating?.successRatio ?? (totalSurveys > 0 ? Math.round((successfulSurveys / totalSurveys) * 100) : (successfulSurveys > 0 ? 100 : 0));

      const serviceAreas = (Array.isArray(vendor.serviceAreas) && vendor.serviceAreas.length > 0)
        ? vendor.serviceAreas
        : ([vendor.address?.city, vendor.address?.state].filter(Boolean).length > 0
          ? [vendor.address.city, vendor.address.state].filter(Boolean)
          : ['Local Region']);

      return {
        ...vendor, // Already a plain object due to lean()
        expertId: vendor.expertId || `EXP-${vendor._id.toString().slice(-6).toUpperCase()}`,
        distance,
        profilePicture: profilePicMap[vendor._id.toString()] || null,
        experience: vendor.experience || 0,
        experienceDetails: vendor.experienceDetails || null,
        designation: vendor.designation || null,
        machineType: vendor.machineType || primaryService?.machineType || null,
        surveysCompleted: vendor.surveysCompleted || successfulSurveys,
        averageRating: vendor.rating?.averageRating || 0,
        totalRatings: vendor.rating?.totalRatings || 0,
        successfulSurveys,
        failedSurveys,
        successRate,
        serviceAreas,
        category: serviceCategory,
        servicePrice: vendor.servicePrice || minPrice,
        minPrice,
        serviceTags: (vendor.services && vendor.services.length > 0)
          ? vendor.services.map(s => s.category || s.name).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3)
          : [serviceCategory],
        allServices: (vendor.services && vendor.services.length > 0) ? vendor.services.map(s => ({
          id: s._id,
          name: s.name,
          category: s.category,
          price: (typeof vendor.servicePrice === 'number' && vendor.servicePrice > 0) ? vendor.servicePrice : (s.price || minPrice),
          description: s.description,
          images: s.images,
          machineType: s.machineType || vendor.machineType || null
        })) : [{
          id: vendor._id,
          name: `${serviceCategory} Service`,
          category: serviceCategory,
          price: minPrice,
          description: 'Geoscientific groundwater survey & borewell point detection service.',
          images: [],
          machineType: vendor.machineType || null
        }]
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
      .select('name email phone experience experienceDetails designation education institution graduationYear specialization surveysCompleted machineType rating bookingStats serviceAreas address location services servicePrice isActive isApproved gender educationalQualifications workingDays workingHours aboutExpert languages availableServices instruments district state serviceRadius willingToTravel modeOfTravel travelChargesPerKm multipleStates panNo isGstRegistered gstNumber')
      .populate({
        path: 'services',
        select: 'name category price description images status isActive machineType'
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

    // specific documents fetch (Profile Picture and Certificates)
    const documents = await VendorDocument.find({
      vendor: vendorId,
      documentType: { $in: ['CERTIFICATE', 'TRAINING_CERTIFICATE', 'PROFILE_PICTURE'] },
      isActive: true
    }).select('documentType url name certificateName');

    const profilePicDoc = documents.find(doc => doc.documentType === 'PROFILE_PICTURE');
    const degreeCertificates = documents.filter(doc => doc.documentType === 'CERTIFICATE');
    const trainingCertificates = documents.filter(doc => doc.documentType === 'TRAINING_CERTIFICATE');

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

    // Enhanced Expert Profile Stats calculation
    const successfulSurveys = vendor.rating?.successCount ?? vendor.bookingStats?.success ?? (typeof vendor.surveysCompleted === 'number' ? vendor.surveysCompleted : 0);
    const failedSurveys = vendor.rating?.failureCount ?? vendor.bookingStats?.failed ?? 0;
    const totalSurveys = successfulSurveys + failedSurveys;
    const successRate = vendor.rating?.successRatio ?? (totalSurveys > 0 ? Math.round((successfulSurveys / totalSurveys) * 100) : (successfulSurveys > 0 ? 100 : 0));

    const serviceAreas = (Array.isArray(vendor.serviceAreas) && vendor.serviceAreas.length > 0)
      ? vendor.serviceAreas
      : ([vendor.address?.city, vendor.address?.state].filter(Boolean).length > 0
        ? [vendor.address.city, vendor.address.state].filter(Boolean)
        : ['Local Region']);

    const expertPrice = (typeof vendor.servicePrice === 'number' && vendor.servicePrice > 0)
      ? vendor.servicePrice
      : (vendor.services?.[0]?.price || 3500);

    const qualifications = (Array.isArray(vendor.educationalQualifications) && vendor.educationalQualifications.length > 0)
      ? vendor.educationalQualifications
      : (vendor.education ? [{
          degree: vendor.education,
          institution: vendor.institution || 'Verified on File',
          year: vendor.graduationYear || '',
          specialization: vendor.specialization || ''
        }] : []);

    // Format vendor data
    const formattedVendor = {
      ...vendor,
      expertId: vendor.expertId || `EXP-${vendor._id.toString().slice(-6).toUpperCase()}`,
      distance,
      profilePicture: profilePicDoc ? profilePicDoc.url : null,
      education: qualifications, // Map for frontend compatibility
      educationalQualifications: qualifications,
      degree: vendor.education || qualifications[0]?.degree || null,
      experience: vendor.experience || 0,
      experienceDetails: vendor.experienceDetails || null,
      machineType: vendor.machineType || vendor.services?.[0]?.machineType || null,
      surveysCompleted: vendor.surveysCompleted || successfulSurveys,
      servicePrice: expertPrice,
      averageRating: vendor.rating?.averageRating || 0,
      totalRatings: vendor.rating?.totalRatings || 0,
      successCount: successfulSurveys,
      failureCount: failedSurveys,
      successfulSurveys,
      failedSurveys,
      successRatio: successRate,
      successRate,
      serviceAreas,
      degreeCertificates,
      trainingCertificates,
      services: (vendor.services && vendor.services.length > 0)
        ? vendor.services.filter(s => s !== null && s !== undefined).map(s => ({
            id: s._id,
            name: s.name,
            category: s.category,
            price: (typeof vendor.servicePrice === 'number' && vendor.servicePrice > 0) ? vendor.servicePrice : (s.price || 3500),
            description: s.description,
            images: s.images,
            status: s.status,
            isActive: s.isActive,
            machineType: s.machineType || vendor.machineType || null
          }))
        : [{
            id: vendor._id,
            name: `${vendor.designation || 'Groundwater Survey'} Service`,
            category: vendor.designation || 'Groundwater Survey',
            price: expertPrice,
            description: 'Geoscientific groundwater survey & borewell point detection service.',
            images: [],
            status: 'ACTIVE',
            isActive: true,
            machineType: vendor.machineType || null
          }]
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
    let recentBookings = await Booking.find({ user: userId })
      .populate('vendor', 'name rating designation')
      .populate('service', 'name price')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status scheduledDate scheduledTime service vendor createdAt payment report')
      .lean();

    // Fetch profile pictures for vendors in recent bookings
    const vendorIds = [...new Set(recentBookings.filter(b => b.vendor).map(b => b.vendor._id.toString()))];
    if (vendorIds.length > 0) {
      const profilePics = await VendorDocument.find({
        vendor: { $in: vendorIds },
        documentType: 'PROFILE_PICTURE',
        isActive: true
      }).select('vendor url').lean();

      const profilePicMap = profilePics.reduce((acc, pic) => {
        acc[pic.vendor.toString()] = pic.url;
        return acc;
      }, {});

      recentBookings = recentBookings.map(booking => {
        if (booking.vendor) {
          booking.vendor.profilePicture = profilePicMap[booking.vendor._id.toString()] || null;
        }
        return booking;
      });
    }

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
    }).populate('vendor', 'name email designation');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be cancelled
    const cancellableStatuses = [
      BOOKING_STATUS.AWAITING_ADVANCE,
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

    // Check if advance payment was made and credit refund to user wallet
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
          userId,
          refundAmount,
          booking._id,
          `Refund for cancelled booking #${booking._id.toString().slice(-6).toUpperCase()}`
        );

        await Payment.create({
          booking: booking._id,
          user: userId,
          vendor: booking.vendor?._id || booking.vendor,
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

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'vendorId is required'
      });
    }

    // Find vendor (support ObjectId or string)
    let vendor = null;
    if (mongoose.Types.ObjectId.isValid(vendorId)) {
      vendor = await Vendor.findById(vendorId);
    } else {
      vendor = await Vendor.findOne({ _id: vendorId });
    }

    if (!vendor) {
      console.warn(`Vendor not found for calculation: ${vendorId}`);
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Find service with multiple fallback strategies
    let service = null;
    if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
      service = await Service.findById(serviceId);
    }

    // If service not found by direct ID, check vendor's populated/referenced services
    if (!service && vendor.services && vendor.services.length > 0) {
      const firstService = vendor.services[0];
      if (mongoose.Types.ObjectId.isValid(firstService)) {
        service = await Service.findById(firstService);
      } else if (firstService && typeof firstService === 'object') {
        service = firstService;
      }
    }

    // If still not found, find any active Service in the database
    if (!service) {
      service = await Service.findOne({ status: 'ACTIVE', isActive: { $ne: false } }) || await Service.findOne();
    }

    // Dynamic base price: prioritize vendor's configured servicePrice
    const baseServiceFee = (typeof vendor.servicePrice === 'number' && vendor.servicePrice > 0)
      ? vendor.servicePrice
      : (service && typeof service.price === 'number' && service.price > 0 ? service.price : 3500);

    // Get settings with bulletproof defaults
    let settings = {};
    try {
      settings = await getSettings(['TRAVEL_CHARGE_PER_KM', 'BASE_RADIUS_KM', 'GST_PERCENTAGE', 'ADVANCE_PAYMENT_PERCENTAGE', 'REMAINING_PAYMENT_PERCENTAGE']) || {};
    } catch (sErr) {
      console.warn('Could not fetch settings for booking calculation, using safe defaults', sErr);
    }

    const adminTravelChargePerKm = Number(settings.TRAVEL_CHARGE_PER_KM) || 10;
    const adminBaseRadius = Number(settings.BASE_RADIUS_KM) || 30;
    const gstPercentage = Number(settings.GST_PERCENTAGE) || 18;
    const advancePercentage = Number(settings.ADVANCE_PAYMENT_PERCENTAGE) || 40;
    const remainingPercentage = Number(settings.REMAINING_PAYMENT_PERCENTAGE) || 60;

    // Resolve effective base radius & travel rate (vendor custom settings take priority, admin acts as platform default)
    let baseRadius = adminBaseRadius;
    if (vendor.serviceRadius) {
      const parsedRadius = parseInt(vendor.serviceRadius, 10);
      if (!isNaN(parsedRadius) && parsedRadius > 0) {
        baseRadius = parsedRadius;
      }
    }

    let travelChargePerKm = adminTravelChargePerKm;
    if (typeof vendor.travelChargesPerKm === 'number' && vendor.travelChargesPerKm > 0) {
      travelChargePerKm = vendor.travelChargesPerKm;
    }

    // Extract vendor coordinates safely (handles both object and GeoJSON array)
    let vendorLat = vendor.address?.coordinates?.lat;
    let vendorLng = vendor.address?.coordinates?.lng;
    if (vendorLat === undefined && Array.isArray(vendor.address?.coordinates?.coordinates)) {
      vendorLng = vendor.address.coordinates.coordinates[0];
      vendorLat = vendor.address.coordinates.coordinates[1];
    }

    let distance = null;
    let travelCharges = 0;

    const parsedUserLat = parseFloat(userLat);
    const parsedUserLng = parseFloat(userLng);

    if (vendorLat != null && vendorLng != null && !isNaN(parsedUserLat) && !isNaN(parsedUserLng)) {
      distance = calculateDistance(Number(vendorLat), Number(vendorLng), parsedUserLat, parsedUserLng);
      if (typeof distance === 'number' && !isNaN(distance)) {
        travelCharges = calculateTravelCharges(distance, baseRadius, travelChargePerKm);
      }
    }

    const gst = calculateGST(baseServiceFee, gstPercentage);
    const subtotal = baseServiceFee + gst;
    const totalAmount = subtotal + travelCharges;
    const advanceAmount = totalAmount * (advancePercentage / 100);
    const remainingAmount = totalAmount - advanceAmount;

    return res.json({
      success: true,
      message: 'Charges calculated successfully',
      data: {
        baseServiceFee: parseFloat(baseServiceFee.toFixed(2)),
        distance: (distance !== null && !isNaN(distance)) ? parseFloat(distance.toFixed(2)) : null,
        travelCharges: parseFloat(travelCharges.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        gst: parseFloat(gst.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        advanceAmount: parseFloat(advanceAmount.toFixed(2)),
        remainingAmount: parseFloat(remainingAmount.toFixed(2)),
        baseRadius,
        travelChargePerKm,
        gstPercentage,
        advancePercentage,
        remainingPercentage
      }
    });
  } catch (error) {
    console.error('Calculate booking charges error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate charges'
    });
  }
};

/**
 * Submit feedback for the survey report
 */
const submitReportFeedback = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { isUseful } = req.body;
    const userId = req.userId;

    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    if (!booking.report) {
      return res.status(400).json({
        success: false,
        message: 'Report has not been uploaded yet'
      });
    }

    booking.report.feedback = {
      isUseful,
      submittedAt: new Date()
    };
    
    booking.markModified('report');
    await booking.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedback: booking.report.feedback
      }
    });
  } catch (error) {
    console.error('Submit report feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

/**
 * Get available replacement experts for an expert-cancelled booking
 */
const getAvailableReplacementVendors = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId
    }).populate('service');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== BOOKING_STATUS.EXPERT_CANCELLED && booking.cancellationDetails?.cancelledBy !== 'VENDOR') {
      return res.status(400).json({
        success: false,
        message: 'This booking is not pending replacement reassignment.'
      });
    }

    // Exclude previously assigned / rejected vendors
    const excludedVendors = [...(booking.rejectedVendors || [])];
    if (booking.vendor && !excludedVendors.includes(booking.vendor)) {
      excludedVendors.push(booking.vendor);
    }
    if (booking.cancellationDetails?.cancellingVendor && !excludedVendors.includes(booking.cancellationDetails.cancellingVendor)) {
      excludedVendors.push(booking.cancellationDetails.cancellingVendor);
    }

    // Query active and approved vendors
    const Vendor = require('../../models/Vendor');
    const query = {
      _id: { $nin: excludedVendors },
      isApproved: true,
      isActive: true
    };

    // Filter by district if available
    if (booking.district || booking.address?.district) {
      const targetDistrict = booking.district || booking.address?.district;
      query.$or = [
        { district: new RegExp(`^${targetDistrict}$`, 'i') },
        { serviceDistricts: new RegExp(`^${targetDistrict}$`, 'i') },
        { 'address.district': new RegExp(`^${targetDistrict}$`, 'i') }
      ];
    }

    const availableVendors = await Vendor.find(query)
      .select('name expertId designation email phone rating profilePicture experience workingDays workingHours specialization address machineType aboutExpert')
      .sort({ 'rating.averageRating': -1, surveysCompleted: -1 })
      .limit(10);

    // Fallback: If no vendors found in the exact district, return top rated vendors in the state
    let vendorsList = availableVendors;
    if (vendorsList.length === 0) {
      const fallbackQuery = {
        _id: { $nin: excludedVendors },
        isApproved: true,
        isActive: true
      };
      vendorsList = await Vendor.find(fallbackQuery)
        .select('name expertId designation email phone rating profilePicture experience workingDays workingHours specialization address machineType aboutExpert')
        .sort({ 'rating.averageRating': -1, surveysCompleted: -1 })
        .limit(10);
    }

    res.json({
      success: true,
      data: {
        bookingId: booking._id,
        currentScheduledDate: booking.scheduledDate,
        purpose: booking.purpose || booking.surveyCategory,
        replacementVendors: vendorsList
      }
    });

  } catch (error) {
    console.error('getAvailableReplacementVendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch replacement experts',
      error: error.message
    });
  }
};

/**
 * Reassign booking to a replacement expert chosen by the customer (₹0 Extra Fee)
 */
const reassignReplacementVendor = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { vendorId, scheduledDate, scheduledTime } = req.body;
    const userId = req.userId;

    if (!vendorId || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID and scheduled date are required'
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId
    }).populate('service user');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== BOOKING_STATUS.EXPERT_CANCELLED && booking.cancellationDetails?.cancelledBy !== 'VENDOR') {
      return res.status(400).json({
        success: false,
        message: 'This booking is not eligible for replacement reassignment.'
      });
    }

    const Vendor = require('../../models/Vendor');
    const newVendor = await Vendor.findOne({
      _id: vendorId,
      isApproved: true,
      isActive: true
    });

    if (!newVendor) {
      return res.status(404).json({
        success: false,
        message: 'Selected replacement expert is not active or available'
      });
    }

    // Keep the previous vendor in rejectedVendors
    if (!booking.rejectedVendors) {
      booking.rejectedVendors = [];
    }
    if (booking.vendor && !booking.rejectedVendors.includes(booking.vendor)) {
      booking.rejectedVendors.push(booking.vendor);
    }

    // Reassign to new vendor with ₹0 extra fee
    booking.vendor = newVendor._id;
    booking.scheduledDate = new Date(scheduledDate);
    booking.scheduledTime = scheduledTime || 'TBD';

    // Reset status to ACCEPTED
    booking.status = BOOKING_STATUS.ACCEPTED;
    booking.userStatus = BOOKING_STATUS.ACCEPTED;
    booking.vendorStatus = BOOKING_STATUS.ASSIGNED;
    booking.acceptedAt = new Date();
    booking.assignedAt = new Date();

    // Generate fresh Start / End survey OTPs
    const startOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const endOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    booking.otp = {
      startSurvey: {
        code: startOtpCode,
        generatedAt: new Date(),
        verified: false,
        verifiedAt: null
      },
      endSurvey: {
        code: endOtpCode,
        generatedAt: new Date(),
        verified: false,
        verifiedAt: null
      }
    };

    // Update cancellation resolution metadata
    booking.cancellationDetails = {
      ...booking.cancellationDetails,
      userResolution: {
        status: 'REASSIGNED',
        resolvedAt: new Date(),
        replacementVendor: newVendor._id,
        refundAmount: 0,
        notes: `Reassigned by customer to ${newVendor.name} at ₹0 extra fee`
      }
    };

    await booking.save();

    // Send notifications to the new vendor and user
    const io = getIO();
    const shortBookingId = booking._id.toString().slice(-4).toUpperCase();

    // Notify New Expert
    await sendNotification({
      recipient: newVendor._id,
      recipientModel: 'Vendor',
      type: 'BOOKING_ASSIGNED',
      title: 'Priority Job Assigned',
      message: `You have been assigned as a priority expert for booking #JALA${shortBookingId} scheduled on ${new Date(scheduledDate).toLocaleDateString("en-IN")}.`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id
      }
    }, io);

    // Notify User
    await sendNotification({
      recipient: userId,
      recipientModel: 'User',
      type: 'BOOKING_REASSIGNED',
      title: 'Expert Reassigned Successfully',
      message: `Your groundwater survey (#JALA${shortBookingId}) has been successfully reassigned to ${newVendor.name} for ${new Date(scheduledDate).toLocaleDateString("en-IN")} at ₹0 extra cost.`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id
      }
    }, io);

    res.json({
      success: true,
      message: 'Survey successfully rescheduled with new expert at ₹0 extra cost.',
      data: {
        bookingId: booking._id,
        status: booking.status,
        vendor: {
          id: newVendor._id,
          name: newVendor.name,
          phone: newVendor.phone
        },
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime
      }
    });

  } catch (error) {
    console.error('reassignReplacementVendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reassign replacement expert',
      error: error.message
    });
  }
};

/**
 * Claim 100% Full Refund when Expert Cancels (Advance + Travel + GST)
 */
const claimFullRefundForExpertCancellation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId
    }).populate('user');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== BOOKING_STATUS.EXPERT_CANCELLED && booking.cancellationDetails?.cancelledBy !== 'VENDOR') {
      return res.status(400).json({
        success: false,
        message: 'This booking is not pending cancellation resolution.'
      });
    }

    const Payment = require('../../models/Payment');
    const { creditToUserWallet } = require('../../services/userWalletService');

    // Calculate 100% full refund of all amounts paid
    const isAdvancePaidOnBooking = booking.payment?.advancePaid && (booking.payment?.advanceAmount > 0);
    const completedAdvancePayment = await Payment.findOne({
      booking: booking._id,
      paymentType: 'ADVANCE',
      status: 'COMPLETED'
    });

    let refundAmount = 0;
    if (isAdvancePaidOnBooking) {
      refundAmount = (booking.payment.advanceAmount || 0) + (booking.payment.travelCharges || 0);
    } else if (completedAdvancePayment) {
      refundAmount = completedAdvancePayment.amount;
    } else if (booking.payment?.totalAmount && booking.payment?.advancePaid) {
      refundAmount = booking.payment.totalAmount * 0.4;
    }

    // Credit 100% full refund to User Wallet
    if (refundAmount > 0) {
      await creditToUserWallet(
        userId,
        refundAmount,
        booking._id,
        `100% Full Refund for expert-cancelled booking #JALA${booking._id.toString().slice(-4).toUpperCase()}`
      );

      await Payment.create({
        booking: booking._id,
        user: userId,
        vendor: booking.vendor,
        paymentType: 'REFUND',
        amount: refundAmount,
        status: 'COMPLETED',
        description: `100% Full Refund credited to wallet for expert-cancelled booking #JALA${booking._id.toString().slice(-4).toUpperCase()}`,
        completedAt: new Date()
      });
    }

    // Set terminal status to CANCELLED
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.userStatus = BOOKING_STATUS.CANCELLED;
    booking.vendorStatus = BOOKING_STATUS.CANCELLED;
    booking.cancelledBy = 'VENDOR';
    booking.cancelledAt = new Date();

    if (booking.payment) {
      booking.payment.refundStatus = 'COMPLETED';
    }

    booking.cancellationDetails = {
      ...booking.cancellationDetails,
      userResolution: {
        status: 'REFUNDED',
        resolvedAt: new Date(),
        replacementVendor: null,
        refundAmount: refundAmount,
        notes: `100% Full refund of ₹${refundAmount} credited to user wallet`
      }
    };

    await booking.save();

    // Send notifications
    const io = getIO();
    const shortBookingId = booking._id.toString().slice(-4).toUpperCase();

    await sendNotification({
      recipient: userId,
      recipientModel: 'User',
      type: 'REFUND_PROCESSED',
      title: '100% Full Refund Credited',
      message: `A 100% full refund of ₹${refundAmount.toLocaleString("en-IN")} has been credited to your Jaladhaara Wallet for booking #JALA${shortBookingId}.`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id
      }
    }, io);

    res.json({
      success: true,
      message: `100% full refund of ₹${refundAmount.toLocaleString("en-IN")} successfully credited to your wallet.`,
      data: {
        bookingId: booking._id,
        status: booking.status,
        refundAmount: refundAmount
      }
    });

  } catch (error) {
    console.error('claimFullRefundForExpertCancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process 100% full refund',
      error: error.message
    });
  }
};

/**
 * Reschedule booking by Customer (Voluntary date/time change)
 * Guardrails: Max 2 reschedules, allowed in PENDING, ASSIGNED, ACCEPTED, AWAITING_ADVANCE
 */
const rescheduleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { scheduledDate, scheduledTime, reason } = req.body;
    const userId = req.userId;

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'New scheduled date is required'
      });
    }

    const requestedDate = new Date(scheduledDate);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheduled date format'
      });
    }

    // Fetch dynamic reschedule policy settings
    const rescheduleSettings = await getSettings([
      'ALLOW_CUSTOMER_RESCHEDULE',
      'MAX_FREE_RESCHEDULES',
      'RESCHEDULE_WINDOW_DAYS'
    ]);

    const allowReschedule = rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE !== false && rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE !== 'false';
    const maxReschedules = typeof rescheduleSettings.MAX_FREE_RESCHEDULES === 'number'
      ? rescheduleSettings.MAX_FREE_RESCHEDULES
      : (parseInt(rescheduleSettings.MAX_FREE_RESCHEDULES, 10) >= 0 ? parseInt(rescheduleSettings.MAX_FREE_RESCHEDULES, 10) : 2);
    const windowDays = typeof rescheduleSettings.RESCHEDULE_WINDOW_DAYS === 'number'
      ? rescheduleSettings.RESCHEDULE_WINDOW_DAYS
      : (parseInt(rescheduleSettings.RESCHEDULE_WINDOW_DAYS, 10) || 30);

    if (!allowReschedule) {
      return res.status(403).json({
        success: false,
        message: 'Voluntary rescheduling is currently disabled by platform policy. Please contact customer support for assistance.'
      });
    }

    // Check date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(requestedDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Rescheduled date cannot be in the past'
      });
    }

    // Dynamic days into the future check
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + windowDays);
    if (checkDate > maxFutureDate) {
      return res.status(400).json({
        success: false,
        message: `Rescheduled date must be within the next ${windowDays} days`
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId
    }).populate('vendor user service');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Status check
    const allowedStatuses = [
      BOOKING_STATUS.AWAITING_ADVANCE,
      BOOKING_STATUS.PENDING,
      BOOKING_STATUS.ASSIGNED,
      BOOKING_STATUS.ACCEPTED
    ];

    if (!allowedStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be rescheduled in status: ${booking.status}. Once the expert is en route or survey has begun, rescheduling is locked.`
      });
    }

    // Check max reschedules limit dynamically
    const currentCount = booking.rescheduleCount || 0;
    if (currentCount >= maxReschedules) {
      return res.status(400).json({
        success: false,
        message: `Maximum limit of ${maxReschedules} reschedule${maxReschedules === 1 ? '' : 's'} has been reached for this booking. Please contact customer support for further assistance.`
      });
    }

    // Validate vendor working day availability
    if (booking.vendor && booking.vendor.workingDays) {
      const dayOfWeek = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
      let activeDays = [];
      const rawDays = booking.vendor.workingDays;
      if (Array.isArray(rawDays)) {
        activeDays = rawDays;
      } else if (typeof rawDays === 'object') {
        activeDays = Object.entries(rawDays)
          .filter(([, active]) => Boolean(active))
          .map(([day]) => day);
      } else if (typeof rawDays === 'string') {
        const trimmed = rawDays.trim().toLowerCase();
        if (trimmed === 'all days' || trimmed === 'everyday' || trimmed === 'all' || trimmed === 'monday - sunday' || trimmed === 'monday to sunday') {
          activeDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        } else if (trimmed === 'weekdays' || trimmed === 'monday - friday' || trimmed === 'monday to friday') {
          activeDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        } else if (trimmed === 'weekends' || trimmed === 'weekends only' || trimmed === 'saturday & sunday' || trimmed === 'saturday - sunday') {
          activeDays = ['Saturday', 'Sunday'];
        } else if (trimmed === 'monday - saturday' || trimmed === 'monday to saturday') {
          activeDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        } else if (rawDays.includes(',')) {
          activeDays = rawDays.split(',').map(d => d.trim());
        }
      }

      if (activeDays.length > 0) {
        const isAvailable = activeDays.some(d => d.toLowerCase() === dayOfWeek.toLowerCase());
        if (!isAvailable) {
          return res.status(400).json({
            success: false,
            message: `The assigned expert is not available on ${dayOfWeek}s. Please select an available working day.`
          });
        }
      }
    }

    // Record previous schedule in history
    const previousDate = booking.scheduledDate;
    const previousTime = booking.scheduledTime;

    booking.scheduledDate = requestedDate;
    // Reschedule defaults to expert time confirmation (TBD)
    const newFormattedTime = "Time TBD by Expert";
    booking.scheduledTime = newFormattedTime;
    booking.rescheduleCount = currentCount + 1;

    if (!booking.rescheduleHistory) {
      booking.rescheduleHistory = [];
    }

    booking.rescheduleHistory.push({
      requestedBy: 'USER',
      requesterId: userId,
      requesterModel: 'User',
      previousDate: previousDate,
      previousTime: previousTime,
      newDate: requestedDate,
      newTime: newFormattedTime,
      reason: reason ? reason.trim() : 'Customer voluntary date reschedule',
      status: 'APPLIED',
      createdAt: new Date()
    });

    await booking.save();

    // Send notifications to Vendor and User
    const shortBookingId = booking._id.toString().slice(-4).toUpperCase();
    const formattedNewDate = requestedDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const io = getIO();

    // Real-time socket broadcast for booking update
    if (io) {
      const bookingPayload = {
        bookingId: booking._id.toString(),
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        rescheduleCount: booking.rescheduleCount,
        reschedulesRemaining: Math.max(0, maxReschedules - booking.rescheduleCount),
        maxReschedules: maxReschedules,
        rescheduleHistory: booking.rescheduleHistory,
        status: booking.status,
        booking: {
          _id: booking._id,
          bookingId: booking.bookingId || booking._id,
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          rescheduleCount: booking.rescheduleCount,
          rescheduleHistory: booking.rescheduleHistory,
          status: booking.status
        }
      };
      const userIdStr = userId.toString();
      io.to(`booking_${booking._id}`).emit('booking_updated', bookingPayload);
      io.to(`booking_${booking._id}`).emit('BOOKING_RESCHEDULED', bookingPayload);
      io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('booking_updated', bookingPayload);
      io.to(`user:${userIdStr}`).to(`User_${userIdStr}`).to(userIdStr).emit('BOOKING_RESCHEDULED', bookingPayload);
      if (booking.vendor) {
        const vendorIdStr = (booking.vendor._id || booking.vendor).toString();
        const vendorRooms = [
          `vendor:${vendorIdStr}`,
          `Vendor_${vendorIdStr}`,
          `vendor_${vendorIdStr}`,
          vendorIdStr
        ];
        vendorRooms.forEach(room => {
          io.to(room).emit('booking_updated', bookingPayload);
          io.to(room).emit('booking_status_updated', bookingPayload);
          io.to(room).emit('BOOKING_RESCHEDULED', bookingPayload);
        });
      }
    }

    // Notify Assigned Expert
    if (booking.vendor) {
      await sendNotification({
        recipient: booking.vendor._id || booking.vendor,
        recipientModel: 'Vendor',
        type: 'BOOKING_RESCHEDULED',
        title: 'Survey Appointment Rescheduled 🗓️',
        message: `Customer rescheduled booking #JALA${shortBookingId} to ${formattedNewDate}. Please set your visit arrival time slot. Reason: ${reason ? reason.trim() : 'Customer requested date change'}`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        },
        metadata: {
          bookingId: booking._id.toString(),
          newDate: requestedDate,
          newTime: newFormattedTime
        }
      }, io);
    }

    // Notify User
    await sendNotification({
      recipient: userId,
      recipientModel: 'User',
      type: 'BOOKING_RESCHEDULED',
      title: 'Survey Rescheduled Successfully ✅',
      message: `Your groundwater survey (#JALA${shortBookingId}) has been successfully moved to ${formattedNewDate} (${newFormattedTime}). (Reschedule ${currentCount + 1} of ${maxReschedules} used)`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id
      },
      metadata: {
        bookingId: booking._id.toString(),
        newDate: requestedDate,
        newTime: newFormattedTime
      }
    }, io);

    res.json({
      success: true,
      message: `Survey appointment rescheduled to ${formattedNewDate} successfully. (${Math.max(0, maxReschedules - (currentCount + 1))} reschedules remaining)`,
      data: {
        bookingId: booking._id,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        rescheduleCount: booking.rescheduleCount,
        reschedulesRemaining: Math.max(0, maxReschedules - booking.rescheduleCount),
        maxReschedules: maxReschedules,
        rescheduleHistory: booking.rescheduleHistory
      }
    });

  } catch (error) {
    console.error('rescheduleBooking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule booking',
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
  rescheduleBooking,
  getAvailableReplacementVendors,
  reassignReplacementVendor,
  claimFullRefundForExpertCancellation,
  initiateRemainingPayment,
  uploadBorewellResult,
  downloadInvoice,
  getDashboardStats,
  calculateBookingCharges,
  submitReportFeedback
};


