const Rating = require('../../models/Rating');
const Booking = require('../../models/Booking');
const Vendor = require('../../models/Vendor');
const User = require('../../models/User');
const { BOOKING_STATUS } = require('../../utils/constants');
const { sendNotification } = require('../../services/notificationService');
const { getIO } = require('../../sockets');

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

    // Calculate overall rating (average of all ratings)
    const accuracy = parseInt(ratings.accuracy);
    const professionalism = parseInt(ratings.professionalism);
    const behavior = parseInt(ratings.behavior);
    const visitTiming = parseInt(ratings.visitTiming);
    const overallRating = Math.round(
      ((accuracy + professionalism + behavior + visitTiming) / 4) * 10
    ) / 10; // Round to 1 decimal place

    // Create rating
    const rating = await Rating.create({
      booking: bookingId,
      user: userId,
      vendor: booking.vendor,
      service: booking.service,
      ratings: {
        accuracy,
        professionalism,
        behavior,
        visitTiming
      },
      overallRating,
      review: review || '',
      isSuccess
    });

    // Update vendor rating statistics
    const updatedVendor = await updateVendorRating(booking.vendor, rating.overallRating, isSuccess);

    // Get user details for notification
    const user = await User.findById(userId).select('name');
    
    // Send notification to vendor
    try {
      const io = getIO();
      const reviewText = review ? ` Review: "${review.substring(0, 100)}${review.length > 100 ? '...' : ''}"` : '';
      await sendNotification({
        recipient: booking.vendor,
        recipientModel: 'Vendor',
        type: 'NEW_RATING',
        title: 'New Rating Received',
        message: `${user?.name || 'A customer'} rated you ${overallRating}/5 stars.${reviewText} Your overall rating is now ${updatedVendor?.rating?.averageRating || overallRating}/5.`,
        relatedEntity: {
          entityType: 'Rating',
          entityId: rating._id
        },
        metadata: {
          ratingId: rating._id.toString(),
          bookingId: bookingId.toString(),
          overallRating,
          averageRating: updatedVendor?.rating?.averageRating || overallRating,
          totalRatings: updatedVendor?.rating?.totalRatings || 1,
          review: review || null
        }
      }, io);
    } catch (notifError) {
      console.error('Failed to send rating notification:', notifError);
      // Don't fail the request if notification fails
    }

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
    if (!vendor) return null;

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
    return vendor;
  } catch (error) {
    console.error('Update vendor rating error:', error);
    return null;
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
 * Get vendor's own ratings (authenticated vendor endpoint)
 */
const getMyRatings = async (req, res) => {
  try {
    const vendorId = req.userId; // Vendor ID from authentication
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [ratings, total] = await Promise.all([
      Rating.find({ vendor: vendorId })
        .populate('user', 'name profilePicture')
        .populate('service', 'name')
        .populate('booking', 'scheduledDate scheduledTime')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Rating.countDocuments({ vendor: vendorId })
    ]);

    // Calculate rating statistics
    const allRatings = await Rating.find({ vendor: vendorId }).select('overallRating ratings isSuccess');
    const stats = {
      totalRatings: allRatings.length,
      averageRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      categoryAverages: {
        accuracy: 0,
        professionalism: 0,
        behavior: 0,
        visitTiming: 0
      },
      successCount: 0,
      failureCount: 0
    };

    if (allRatings.length > 0) {
      // Calculate averages
      const sumOverall = allRatings.reduce((sum, r) => sum + r.overallRating, 0);
      stats.averageRating = Math.round((sumOverall / allRatings.length) * 10) / 10;

      // Rating distribution
      allRatings.forEach(r => {
        const rating = Math.floor(r.overallRating);
        if (rating >= 1 && rating <= 5) {
          stats.ratingDistribution[rating]++;
        }
      });

      // Category averages
      const sumAccuracy = allRatings.reduce((sum, r) => sum + (r.ratings?.accuracy || 0), 0);
      const sumProfessionalism = allRatings.reduce((sum, r) => sum + (r.ratings?.professionalism || 0), 0);
      const sumBehavior = allRatings.reduce((sum, r) => sum + (r.ratings?.behavior || 0), 0);
      const sumVisitTiming = allRatings.reduce((sum, r) => sum + (r.ratings?.visitTiming || 0), 0);

      stats.categoryAverages.accuracy = Math.round((sumAccuracy / allRatings.length) * 10) / 10;
      stats.categoryAverages.professionalism = Math.round((sumProfessionalism / allRatings.length) * 10) / 10;
      stats.categoryAverages.behavior = Math.round((sumBehavior / allRatings.length) * 10) / 10;
      stats.categoryAverages.visitTiming = Math.round((sumVisitTiming / allRatings.length) * 10) / 10;

      // Success/failure counts
      stats.successCount = allRatings.filter(r => r.isSuccess === true).length;
      stats.failureCount = allRatings.filter(r => r.isSuccess === false).length;
    }

    res.json({
      success: true,
      message: 'Ratings retrieved successfully',
      data: {
        ratings,
        stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRatings: total
        }
      }
    });
  } catch (error) {
    console.error('Get my ratings error:', error);
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
      return res.json({
        success: true,
        message: 'No rating found for this booking',
        data: {
          rating: null
        }
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

/**
 * Get user's own ratings (authenticated user endpoint)
 */
const getUserRatings = async (req, res) => {
  try {
    const userId = req.userId; // User ID from authentication
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [ratings, total] = await Promise.all([
      Rating.find({ user: userId })
        .populate('vendor', 'name profilePicture')
        .populate('service', 'name')
        .populate('booking', 'scheduledDate scheduledTime')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Rating.countDocuments({ user: userId })
    ]);

    // Calculate statistics
    const allRatings = await Rating.find({ user: userId }).select('overallRating ratings isSuccess');
    const stats = {
      totalRatings: allRatings.length,
      averageRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      categoryAverages: {
        accuracy: 0,
        professionalism: 0,
        behavior: 0,
        visitTiming: 0
      },
      successCount: 0,
      failureCount: 0
    };

    if (allRatings.length > 0) {
      // Calculate averages
      const sumOverall = allRatings.reduce((sum, r) => sum + r.overallRating, 0);
      stats.averageRating = Math.round((sumOverall / allRatings.length) * 10) / 10;

      // Rating distribution
      allRatings.forEach(r => {
        const rating = Math.floor(r.overallRating);
        if (rating >= 1 && rating <= 5) {
          stats.ratingDistribution[rating]++;
        }
      });

      // Category averages
      const sumAccuracy = allRatings.reduce((sum, r) => sum + (r.ratings?.accuracy || 0), 0);
      const sumProfessionalism = allRatings.reduce((sum, r) => sum + (r.ratings?.professionalism || 0), 0);
      const sumBehavior = allRatings.reduce((sum, r) => sum + (r.ratings?.behavior || 0), 0);
      const sumVisitTiming = allRatings.reduce((sum, r) => sum + (r.ratings?.visitTiming || 0), 0);

      stats.categoryAverages.accuracy = Math.round((sumAccuracy / allRatings.length) * 10) / 10;
      stats.categoryAverages.professionalism = Math.round((sumProfessionalism / allRatings.length) * 10) / 10;
      stats.categoryAverages.behavior = Math.round((sumBehavior / allRatings.length) * 10) / 10;
      stats.categoryAverages.visitTiming = Math.round((sumVisitTiming / allRatings.length) * 10) / 10;

      // Success/failure counts
      stats.successCount = allRatings.filter(r => r.isSuccess === true).length;
      stats.failureCount = allRatings.filter(r => r.isSuccess === false).length;
    }

    res.json({
      success: true,
      message: 'Ratings retrieved successfully',
      data: {
        ratings,
        stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRatings: total
        }
      }
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve ratings',
      error: error.message
    });
  }
};

module.exports = {
  submitRating,
  getVendorRatings,
  getMyRatings,
  getBookingRating,
  getUserRatings
};

