const Rating = require('../../models/Rating');
const Booking = require('../../models/Booking');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');

/**
 * Get all ratings with filters
 */
const getAllRatings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      vendorId,
      userId,
      minRating,
      maxRating,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (vendorId) {
      query.vendor = vendorId;
    }

    if (userId) {
      query.user = userId;
    }

    if (minRating || maxRating) {
      query.overallRating = {};
      if (minRating) query.overallRating.$gte = parseFloat(minRating);
      if (maxRating) query.overallRating.$lte = parseFloat(maxRating);
    }

    if (search) {
      query.$or = [
        { review: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'vendor.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [ratings, total] = await Promise.all([
      Rating.find(query)
        .populate('user', 'name email phone')
        .populate('vendor', 'name email phone')
        .populate('service', 'name price')
        .populate('booking', 'status scheduledDate')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Rating.countDocuments(query)
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
    console.error('Get all ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve ratings',
      error: error.message
    });
  }
};

/**
 * Get rating statistics
 */
const getRatingStatistics = async (req, res) => {
  try {
    const [
      totalRatings,
      averageRating,
      ratingDistribution,
      totalReviews,
      topRatedVendors,
      recentRatings
    ] = await Promise.all([
      Rating.countDocuments(),
      Rating.aggregate([
        {
          $group: {
            _id: null,
            average: { $avg: '$overallRating' }
          }
        }
      ]),
      Rating.aggregate([
        {
          $group: {
            _id: '$overallRating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]),
      Rating.countDocuments({ review: { $exists: true, $ne: '' } }),
      Rating.aggregate([
        {
          $group: {
            _id: '$vendor',
            averageRating: { $avg: '$overallRating' },
            totalRatings: { $sum: 1 }
          }
        },
        { $sort: { averageRating: -1 } },
        { $limit: 10 }
      ]),
      Rating.find()
        .populate('vendor', 'name')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Populate vendor names in topRatedVendors
    const vendors = await Vendor.find({
      _id: { $in: topRatedVendors.map(t => t._id) }
    }).select('name email');

    const topRated = topRatedVendors.map(tr => {
      const vendor = vendors.find(v => v._id.toString() === tr._id.toString());
      return {
        vendorId: tr._id,
        vendorName: vendor?.name || 'Unknown',
        vendorEmail: vendor?.email || '',
        averageRating: Math.round(tr.averageRating * 10) / 10,
        totalRatings: tr.totalRatings
      };
    });

    res.json({
      success: true,
      message: 'Rating statistics retrieved successfully',
      data: {
        totalRatings,
        averageRating: averageRating[0]?.average ? Math.round(averageRating[0].average * 10) / 10 : 0,
        ratingDistribution,
        totalReviews,
        topRatedVendors: topRated,
        recentRatings
      }
    });
  } catch (error) {
    console.error('Get rating statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rating statistics',
      error: error.message
    });
  }
};

/**
 * Get single rating details
 */
const getRatingDetails = async (req, res) => {
  try {
    const { ratingId } = req.params;

    const rating = await Rating.findById(ratingId)
      .populate('user', 'name email phone')
      .populate('vendor', 'name email phone')
      .populate('service', 'name price description')
      .populate('booking', 'status scheduledDate address');

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.json({
      success: true,
      message: 'Rating details retrieved successfully',
      data: {
        rating
      }
    });
  } catch (error) {
    console.error('Get rating details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rating details',
      error: error.message
    });
  }
};

/**
 * Delete rating (admin only - for inappropriate content)
 */
const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const adminId = req.userId;

    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Recalculate vendor rating after deletion
    const vendor = await Vendor.findById(rating.vendor);
    if (vendor) {
      const allRatings = await Rating.find({ vendor: rating.vendor });
      if (allRatings.length > 1) {
        // Recalculate average
        const totalRating = allRatings
          .filter(r => r._id.toString() !== ratingId)
          .reduce((sum, r) => sum + r.overallRating, 0);
        vendor.rating.averageRating = totalRating / (allRatings.length - 1);
        vendor.rating.totalRatings = allRatings.length - 1;
      } else {
        vendor.rating.averageRating = 0;
        vendor.rating.totalRatings = 0;
      }
      await vendor.save();
    }

    await Rating.findByIdAndDelete(ratingId);

    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rating',
      error: error.message
    });
  }
};

module.exports = {
  getAllRatings,
  getRatingStatistics,
  getRatingDetails,
  deleteRating
};

