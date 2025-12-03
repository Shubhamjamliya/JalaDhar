const Dispute = require('../../models/Dispute');
const Booking = require('../../models/Booking');
const User = require('../../models/User');
const { sendNotification } = require('../../services/notificationService');
const { getIO } = require('../../sockets');
const { uploadToCloudinary } = require('../../services/cloudinaryService');

/**
 * Create a new dispute
 */
const createDispute = async (req, res) => {
  try {
    const userId = req.userId;
    const { subject, description, type, priority, bookingId, attachments } = req.body;

    // Validation
    if (!subject || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'Subject, description, and type are required'
      });
    }

    // Validate booking if provided
    let booking = null;
    if (bookingId) {
      booking = await Booking.findOne({
        _id: bookingId,
        user: userId
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or does not belong to you'
        });
      }
    }

    // Handle file uploads if any
    let uploadedAttachments = [];
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
      
      for (const file of files) {
        try {
          const result = await uploadToCloudinary(file.buffer, 'disputes/attachments', {
            resource_type: 'auto'
          });
          uploadedAttachments.push({
            url: result.secure_url,
            publicId: result.public_id,
            fileName: file.originalname,
            uploadedAt: new Date()
          });
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          // Continue with other files even if one fails
        }
      }
    }

    // Create dispute
    const dispute = await Dispute.create({
      raisedBy: userId,
      raisedByModel: 'User',
      booking: bookingId || null,
      type,
      subject: subject.trim(),
      description: description.trim(),
      priority: priority || 'MEDIUM',
      status: 'PENDING',
      attachments: uploadedAttachments
    });

    // Populate for response
    await dispute.populate('booking', 'status scheduledDate');

    // Send notification to all admins
    try {
      const Admin = require('../../models/Admin');
      const admins = await Admin.find({ isActive: true });
      const io = getIO();
      
      for (const admin of admins) {
        await sendNotification({
          recipient: admin._id,
          recipientModel: 'Admin',
          type: 'NEW_DISPUTE',
          title: 'New Dispute Raised',
          message: `User raised a new dispute: ${dispute.subject}`,
          relatedEntity: {
            entityType: 'Dispute',
            entityId: dispute._id
          },
          metadata: {
            disputeId: dispute._id.toString(),
            type: dispute.type,
            priority: dispute.priority
          }
        }, io);
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      data: {
        dispute
      }
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dispute',
      error: error.message
    });
  }
};

/**
 * Get user's disputes
 */
const getMyDisputes = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      page = 1,
      limit = 10,
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      raisedBy: userId,
      raisedByModel: 'User'
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .populate('booking', 'status scheduledDate service')
        .populate('assignedTo', 'name email')
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
    console.error('Get my disputes error:', error);
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
    const userId = req.userId;
    const { disputeId } = req.params;

    const dispute = await Dispute.findOne({
      _id: disputeId,
      raisedBy: userId,
      raisedByModel: 'User'
    })
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
 * Add comment to dispute
 */
const addComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { disputeId } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    const dispute = await Dispute.findOne({
      _id: disputeId,
      raisedBy: userId,
      raisedByModel: 'User'
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    dispute.comments.push({
      comment: comment.trim(),
      commentedBy: userId,
      commentedByModel: 'User'
    });

    await dispute.save();

    // Send notification to admin
    try {
      const io = getIO();
      if (dispute.assignedTo) {
        await sendNotification({
          recipient: dispute.assignedTo._id,
          recipientModel: 'Admin',
          type: 'DISPUTE_COMMENT',
          title: 'New Comment on Dispute',
          message: `User added a comment on dispute "${dispute.subject}"`,
          relatedEntity: {
            entityType: 'Dispute',
            entityId: dispute._id
          },
          metadata: {
            disputeId: dispute._id.toString()
          }
        }, io);
      }
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

module.exports = {
  createDispute,
  getMyDisputes,
  getDisputeDetails,
  addComment
};

