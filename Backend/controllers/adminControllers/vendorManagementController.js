const Vendor = require('../../models/Vendor');
const Service = require('../../models/Service');
const Booking = require('../../models/Booking');
const { validationResult } = require('express-validator');
const { sendVendorApprovalEmail, sendVendorRejectionEmail } = require('../../services/emailService');

/**
 * Get all vendors with filters
 */
const getAllVendors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isApproved,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filter by approval status
    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .select('-password -emailVerificationOTP -emailVerificationOTPExpiry')
        .populate('approvedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Vendor.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Vendors retrieved successfully',
      data: {
        vendors,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalVendors: total,
          hasNext: skip + vendors.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendors',
      error: error.message
    });
  }
};

/**
 * Get pending vendors (awaiting approval)
 */
const getPendingVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const query = {
      isApproved: false,
      isActive: true
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .select('-password -emailVerificationOTP -emailVerificationOTPExpiry')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vendor.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Pending vendors retrieved successfully',
      data: {
        vendors,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalVendors: total,
          hasNext: skip + vendors.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get pending vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending vendors',
      error: error.message
    });
  }
};

/**
 * Get vendor details
 */
const getVendorDetails = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId)
      .select('-password -emailVerificationOTP -emailVerificationOTPExpiry')
      .populate('approvedBy', 'name email')
      .populate('services', 'name machineType price status');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get vendor statistics
    const [totalServices, activeServices, totalBookings, completedBookings] = await Promise.all([
      Service.countDocuments({ vendor: vendorId }),
      Service.countDocuments({ vendor: vendorId, isActive: true, status: 'APPROVED' }),
      Booking.countDocuments({ vendor: vendorId }),
      Booking.countDocuments({ vendor: vendorId, status: 'COMPLETED' })
    ]);

    res.json({
      success: true,
      message: 'Vendor details retrieved successfully',
      data: {
        vendor,
        statistics: {
          totalServices,
          activeServices,
          totalBookings,
          completedBookings
        }
      }
    });
  } catch (error) {
    console.error('Get vendor details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendor details',
      error: error.message
    });
  }
};

/**
 * Approve vendor
 */
const approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const adminId = req.userId;

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (vendor.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is already approved'
      });
    }

    // Approve vendor
    vendor.isApproved = true;
    vendor.approvedBy = adminId;
    vendor.approvedAt = new Date();
    vendor.rejectionReason = null;
    await vendor.save();

    // Send approval email
    await sendVendorApprovalEmail({
      email: vendor.email,
      name: vendor.name
    });

    // Send real-time notification
    try {
      const { sendNotification } = require('../../services/notificationService');
      const { getIO } = require('../../sockets');
      const io = getIO();
      
      await sendNotification({
        recipient: vendor._id,
        recipientModel: 'Vendor',
        type: 'VENDOR_APPROVED',
        title: 'Account Approved',
        message: 'Congratulations! Your vendor account has been approved. You can now accept bookings.',
        relatedEntity: {
          entityType: 'Vendor',
          entityId: vendor._id
        },
        metadata: {
          approvedAt: vendor.approvedAt
        }
      }, io);
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Vendor approved successfully',
      data: {
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          isApproved: vendor.isApproved,
          approvedAt: vendor.approvedAt
        }
      }
    });
  } catch (error) {
    console.error('Approve vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve vendor',
      error: error.message
    });
  }
};

/**
 * Reject vendor
 */
const rejectVendor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { vendorId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (vendor.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject an already approved vendor'
      });
    }

    // Reject vendor
    vendor.isApproved = false;
    vendor.rejectionReason = rejectionReason.trim();
    vendor.approvedBy = null;
    vendor.approvedAt = null;
    await vendor.save();

    // Send rejection email
    await sendVendorRejectionEmail({
      email: vendor.email,
      name: vendor.name,
      rejectionReason: vendor.rejectionReason
    });

    // Send real-time notification
    try {
      const { sendNotification } = require('../../services/notificationService');
      const { getIO } = require('../../sockets');
      const io = getIO();
      
      await sendNotification({
        recipient: vendor._id,
        recipientModel: 'Vendor',
        type: 'VENDOR_REJECTED',
        title: 'Account Rejected',
        message: `Your vendor account application has been rejected. Reason: ${vendor.rejectionReason}`,
        relatedEntity: {
          entityType: 'Vendor',
          entityId: vendor._id
        },
        metadata: {
          rejectionReason: vendor.rejectionReason
        }
      }, io);
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Vendor rejected successfully',
      data: {
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          isApproved: vendor.isApproved,
          rejectionReason: vendor.rejectionReason
        }
      }
    });
  } catch (error) {
    console.error('Reject vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject vendor',
      error: error.message
    });
  }
};

/**
 * Deactivate vendor account
 */
const deactivateVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (!vendor.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is already deactivated'
      });
    }

    // Deactivate vendor
    vendor.isActive = false;
    await vendor.save();

    // Deactivate all vendor services
    await Service.updateMany(
      { vendor: vendorId },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Vendor deactivated successfully',
      data: {
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          isActive: vendor.isActive
        }
      }
    });
  } catch (error) {
    console.error('Deactivate vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate vendor',
      error: error.message
    });
  }
};

/**
 * Activate vendor account
 */
const activateVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (vendor.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is already active'
      });
    }

    // Activate vendor
    vendor.isActive = true;
    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor activated successfully',
      data: {
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          isActive: vendor.isActive
        }
      }
    });
  } catch (error) {
    console.error('Activate vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate vendor',
      error: error.message
    });
  }
};

module.exports = {
  getAllVendors,
  getPendingVendors,
  getVendorDetails,
  approveVendor,
  rejectVendor,
  deactivateVendor,
  activateVendor
};

