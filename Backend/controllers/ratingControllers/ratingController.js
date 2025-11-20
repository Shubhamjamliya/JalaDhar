const Rating = require('../../models/Rating');
const Booking = require('../../models/Booking');
const Vendor = require('../../models/Vendor');
const { BOOKING_STATUS } = require('../../utils/constants');

/**
 * Submit rating and review
 */
const submitRating = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookingId } = req.params;
    const { ratings, review } = req.body;

    // Validate ratings
    if (!ratings || !ratings.accuracy || !ratings.professionalism || !ratings.behavior || !ratings.visitTiming) {
      return res.status(400).json({
        success: false,
        message: 'All rating fields are required (accuracy, professionalism, behavior, visitTiming)'
      });
    }

    // Find booking
    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
      status: { $in: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.SUCCESS, BOOKING_STATUS.FAILED] }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not eligible for rating'
      });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({ booking: bookingId });
    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'Rating already submitted for this booking'
      });
    }

    // Get success status from booking
    const isSuccess = booking.status === BOOKING_STATUS.SUCCESS;

    // Create rating
    const rating = await Rating.create({
      booking: bookingId,
      user: userId,
      vendor: booking.vendor,
      service: booking.service,
      ratings: {
        accuracy: parseInt(ratings.accuracy),
        professionalism: parseInt(ratings.professionalism),
        behavior: parseInt(ratings.behavior),
        visitTiming: parseInt(ratings.visitTiming)
      },
      review: review || '',
      isSuccess
    });

    // Update vendor rating statistics
    await updateVendorRating(booking.vendor, rating.overallRating, isSuccess);

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: {
          id: rating._id,
          overallRating: rating.overallRating,
          ratings: rating.ratings,
          review: rating.review
        }
      }
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: error.message
    });
  }
};

/**
 * Update vendor rating statistics
 */
const updateVendorRating = async (vendorId, newRating, isSuccess) => {
  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return;

    // Get all ratings for this vendor
    const allRatings = await Rating.find({ vendor: vendorId });
    
    // Calculate average rating
    const totalRatings = allRatings.length;
    const sumRatings = allRatings.reduce((sum, r) => sum + r.overallRating, 0);
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    // Update success/failure counts
    const successCount = allRatings.filter(r => r.isSuccess === true).length;
    const failureCount = allRatings.filter(r => r.isSuccess === false).length;

    // Update vendor
    vendor.rating = {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: totalRatings,
      successCount,
      failureCount,
      successRatio: totalRatings > 0 ? Math.round((successCount / totalRatings) * 100) : 0
    };

    await vendor.save();
  } catch (error) {
    console.error('Update vendor rating error:', error);
  }
};

/**
 * Get vendor ratings
 */
const getVendorRatings = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [ratings, total] = await Promise.all([
      Rating.find({ vendor: vendorId })
        .populate('user', 'name')
        .populate('service', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Rating.countDocuments({ vendor: vendorId })
    ]);

    res.json({
      success: true,
      message: 'Ratings retrieved successfully',
      data: {
        ratings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRatings: total
        }
      }
    });
  } catch (error) {
    console.error('Get vendor ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve ratings',
      error: error.message
    });
  }
};

/**
 * Get booking rating (if exists)
 */
const getBookingRating = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const rating = await Rating.findOne({ booking: bookingId })
      .populate('user', 'name')
      .populate('vendor', 'name');

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found for this booking'
      });
    }

    res.json({
      success: true,
      message: 'Rating retrieved successfully',
      data: {
        rating
      }
    });
  } catch (error) {
    console.error('Get booking rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rating',
      error: error.message
    });
  }
};

module.exports = {
  submitRating,
  getVendorRatings,
  getBookingRating
};

