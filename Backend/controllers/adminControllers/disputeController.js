const Dispute = require('../../models/Dispute');
const Booking = require('../../models/Booking');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const { sendNotification } = require('../../services/notificationService');
const { getIO } = require('../../sockets');

/**
 * Get all disputes with filters
 */
const getAllDisputes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      priority,
      raisedBy,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (priority) {
      query.priority = priority;
    }

    if (raisedBy) {
      query.raisedBy = raisedBy;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .populate('raisedBy', 'name email phone')
        .populate('booking', 'status scheduledDate')
        .populate('assignedTo', 'name email')
        .populate('resolution.resolvedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Dispute.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Disputes retrieved successfully',
      data: {
        disputes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalDisputes: total
        }
      }
    });
  } catch (error) {
    console.error('Get all disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve disputes',
      error: error.message
    });
  }
};

/**
 * Get single dispute details
 */
const getDisputeDetails = async (req, res) => {
  try {
    const { disputeId } = req.params;

    const dispute = await Dispute.findById(disputeId)
      .populate('raisedBy', 'name email phone')
      .populate('booking', 'status scheduledDate address user vendor service')
      .populate('assignedTo', 'name email')
      .populate('resolution.resolvedBy', 'name email')
      .populate('comments.commentedBy', 'name email');

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    res.json({
      success: true,
      message: 'Dispute details retrieved successfully',
      data: {
        dispute
      }
    });
  } catch (error) {
    console.error('Get dispute details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dispute details',
      error: error.message
    });
  }
};

/**
 * Update dispute status
 */
const updateDisputeStatus = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.userId;

    const dispute = await Dispute.findById(disputeId)
      .populate('raisedBy', 'name email');

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    dispute.status = status;
    if (!dispute.assignedTo) {
      dispute.assignedTo = adminId;
    }

    if (notes) {
      dispute.comments.push({
        comment: notes,
        commentedBy: adminId,
        commentedByModel: 'Admin'
      });
    }

    if (status === 'RESOLVED' || status === 'CLOSED') {
      dispute.resolution = {
        notes: notes || '',
        resolvedBy: adminId,
        resolvedAt: new Date(),
        actionTaken: req.body.actionTaken || 'OTHER'
      };
    }

    await dispute.save();

    // Send notification
    try {
      const io = getIO();
      await sendNotification({
        recipient: dispute.raisedBy._id,
        recipientModel: dispute.raisedByModel,
        type: 'DISPUTE_UPDATED',
        title: 'Dispute Status Updated',
        message: `Your dispute "${dispute.subject}" status has been updated to ${status}`,
        relatedEntity: {
          entityType: 'Dispute',
          entityId: dispute._id
        },
        metadata: {
          disputeId: dispute._id.toString(),
          status
        }
      }, io);
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Dispute status updated successfully',
      data: {
        dispute
      }
    });
  } catch (error) {
    console.error('Update dispute status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dispute status',
      error: error.message
    });
  }
};

/**
 * Assign dispute to admin
 */
const assignDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { assignedTo } = req.body;
    const adminId = req.userId;

    const dispute = await Dispute.findById(disputeId);

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    dispute.assignedTo = assignedTo || adminId;
    if (dispute.status === 'PENDING') {
      dispute.status = 'IN_PROGRESS';
    }

    await dispute.save();

    res.json({
      success: true,
      message: 'Dispute assigned successfully',
      data: {
        dispute
      }
    });
  } catch (error) {
    console.error('Assign dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign dispute',
      error: error.message
    });
  }
};

/**
 * Add comment to dispute
 */
const addComment = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { comment } = req.body;
    const adminId = req.userId;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    const dispute = await Dispute.findById(disputeId)
      .populate('raisedBy', 'name email');

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    dispute.comments.push({
      comment: comment.trim(),
      commentedBy: adminId,
      commentedByModel: 'Admin'
    });

    await dispute.save();

    // Send notification
    try {
      const io = getIO();
      await sendNotification({
        recipient: dispute.raisedBy._id,
        recipientModel: dispute.raisedByModel,
        type: 'DISPUTE_COMMENT',
        title: 'New Comment on Dispute',
        message: `Admin added a comment on your dispute "${dispute.subject}"`,
        relatedEntity: {
          entityType: 'Dispute',
          entityId: dispute._id
        },
        metadata: {
          disputeId: dispute._id.toString()
        }
      }, io);
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: {
        dispute
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

/**
 * Get dispute statistics
 */
const getDisputeStatistics = async (req, res) => {
  try {
    const [
      totalDisputes,
      pendingDisputes,
      inProgressDisputes,
      resolvedDisputes,
      disputesByType,
      disputesByPriority
    ] = await Promise.all([
      Dispute.countDocuments(),
      Dispute.countDocuments({ status: 'PENDING' }),
      Dispute.countDocuments({ status: 'IN_PROGRESS' }),
      Dispute.countDocuments({ status: 'RESOLVED' }),
      Dispute.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]),
      Dispute.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      message: 'Dispute statistics retrieved successfully',
      data: {
        totalDisputes,
        pendingDisputes,
        inProgressDisputes,
        resolvedDisputes,
        disputesByType,
        disputesByPriority
      }
    });
  } catch (error) {
    console.error('Get dispute statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dispute statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllDisputes,
  getDisputeDetails,
  updateDisputeStatus,
  assignDispute,
  addComment,
  getDisputeStatistics
};

