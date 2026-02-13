const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const Service = require('../models/Service');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../utils/constants');
const { calculateDistance, calculateTravelCharges, calculateGST } = require('../utils/distanceCalculator');
const { getSettings } = require('./settingsService');
const { sendNotification } = require('./notificationService');
const { getIO } = require('../sockets');

/**
 * Automatically reassign a booking to the next best available vendor
 * @param {string} bookingId - ID of the booking to reassign
 * @param {string} reason - Reason for reassignment (rejection/cancel reason)
 * @param {string} initiatorRole - Role who initiated reassignment (VENDOR, ADMIN)
 * @returns {Promise<Object>} - Result of reassignment
 */
const autoReassignBooking = async (bookingId, reason, initiatorRole = 'VENDOR') => {
  try {
    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Add current vendor to rejected vendors list
    if (booking.vendor) {
      if (!booking.rejectedVendors) {
        booking.rejectedVendors = [];
      }
      if (!booking.rejectedVendors.includes(booking.vendor)) {
        booking.rejectedVendors.push(booking.vendor);
      }
    }

    const originalService = await Service.findById(booking.service);
    if (!originalService) {
      throw new Error('Original service not found');
    }

    const { name, category } = originalService;
    const userLat = booking.address?.coordinates?.lat;
    const userLng = booking.address?.coordinates?.lng;

    if (!userLat || !userLng) {
      throw new Error('User coordinates not found in booking');
    }

    // Find all active and approved services with the same name and category
    const similarServices = await Service.find({
      name,
      category,
      status: 'APPROVED',
      isActive: true,
      vendor: { $nin: booking.rejectedVendors }
    }).populate('vendor');

    if (similarServices.length === 0) {
      // No other services available
      booking.status = BOOKING_STATUS.REJECTED;
      booking.vendorStatus = BOOKING_STATUS.REJECTED;
      booking.userStatus = BOOKING_STATUS.REJECTED;
      booking.rejectionReason = `No other vendors available. Original reason: ${reason}`;
      await booking.save();

      // Notify user that no vendors are available
      const io = getIO();
      await sendNotification({
        recipient: booking.user._id,
        recipientModel: 'User',
        type: 'BOOKING_FAILED',
        title: 'Booking Assignment Failed',
        message: 'We couldn\'t find another expert for your request. Your booking has been cancelled.',
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        }
      }, io);

      return {
        success: false,
        message: 'No other vendors available for reassignment'
      };
    }

    // Calculate distance and sort vendors
    const vendorsWithDistance = similarServices.map(service => {
      const vendor = service.vendor;
      let distance = null;
      if (vendor.address?.coordinates?.lat && vendor.address?.coordinates?.lng) {
        distance = calculateDistance(
          vendor.address.coordinates.lat,
          vendor.address.coordinates.lng,
          userLat,
          userLng
        );
      }

      return {
        vendor,
        service,
        distance,
        successRatio: vendor.rating?.successRatio || 0,
        averageRating: vendor.rating?.averageRating || 0,
        experience: vendor.experience || 0
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

    const bestMatch = vendorsWithDistance[0];
    const newVendor = bestMatch.vendor;
    const newService = bestMatch.service;
    const newDistance = bestMatch.distance;

    // Get settings for charge calculation
    const settings = await getSettings(['TRAVEL_CHARGE_PER_KM', 'BASE_RADIUS_KM', 'GST_PERCENTAGE']);
    const travelChargePerKm = settings.TRAVEL_CHARGE_PER_KM || 10;
    const baseRadius = settings.BASE_RADIUS_KM || 30;
    const gstPercentage = settings.GST_PERCENTAGE || 18;

    // Recalculate amounts
    const travelCharges = calculateTravelCharges(newDistance, baseRadius, travelChargePerKm);
    const baseServiceFee = newService.price;
    const subtotal = baseServiceFee + travelCharges;
    const gst = calculateGST(subtotal, gstPercentage);
    const totalAmount = subtotal + gst;

    // Update booking with new vendor, new service, and recalculated amounts
    booking.vendor = newVendor._id;
    booking.service = newService._id;
    booking.payment.distance = newDistance;
    booking.payment.baseServiceFee = baseServiceFee;
    booking.payment.travelCharges = travelCharges;
    booking.payment.subtotal = subtotal;
    booking.payment.gst = gst;
    booking.payment.totalAmount = totalAmount;

    // Adjust remaining amount based on new total
    if (booking.payment.advancePaid) {
      booking.payment.remainingAmount = totalAmount - booking.payment.advanceAmount;
    } else {
      // If not paid yet, recalculate both
      booking.payment.advanceAmount = totalAmount * 0.4;
      booking.payment.remainingAmount = totalAmount * 0.6;
    }

    // Reset status to ASSIGNED for the new vendor
    booking.status = BOOKING_STATUS.ASSIGNED;
    booking.vendorStatus = BOOKING_STATUS.ASSIGNED;
    booking.userStatus = BOOKING_STATUS.ASSIGNED;
    booking.assignedAt = new Date();

    // Recalculate vendor wallet payments for the new vendor
    const { calculateVendorPayment } = require('./walletService');
    const vendorPayment = calculateVendorPayment(baseServiceFee, travelCharges);

    booking.payment.vendorWalletPayments = {
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

    await booking.save();

    // Notify the new vendor
    const io = getIO();
    await sendNotification({
      recipient: newVendor._id,
      recipientModel: 'Vendor',
      type: 'BOOKING_ASSIGNED',
      title: 'New Booking Reassigned',
      message: `A booking has been reassigned to you from ${booking.user.name}. Please review and accept.`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id
      }
    }, io);

    // Notify user about reassignment
    await sendNotification({
      recipient: booking.user._id,
      recipientModel: 'User',
      type: 'BOOKING_REASSIGNED',
      title: 'Expert Reassigned',
      message: `Your booking has been reassigned to ${newVendor.name} due to ${initiatorRole === 'VENDOR' ? 'unavailability of the previous expert' : 'administrative changes'}.`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id
      }
    }, io);

    return {
      success: true,
      message: `Booking successfully reassigned to ${newVendor.name}`,
      data: {
        vendorId: newVendor._id,
        vendorName: newVendor.name
      }
    };

  } catch (error) {
    console.error('Auto reassignment error:', error);
    throw error;
  }
};

module.exports = {
  autoReassignBooking
};
