const Vendor = require('../../models/Vendor');
const VendorBankDetails = require('../../models/VendorBankDetails');
const VendorDocument = require('../../models/VendorDocument');
const Service = require('../../models/Service');
const Booking = require('../../models/Booking');
const { validationResult } = require('express-validator');
const { sendVendorApprovalEmail, sendVendorRejectionEmail } = require('../../services/emailService');
const { logAdminActivity } = require('../../services/auditLogger');

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
    if (isApproved !== undefined && isApproved !== '') {
      query.isApproved = isApproved === 'true';
    }

    // Filter by active status
    if (isActive !== undefined && isActive !== '') {
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
        .populate('assignedTo', 'name email role')
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
      verificationStatus: { $in: ['APPLICATION_SUBMITTED', 'PENDING', 'MORE_DOCS_NEEDED'] }
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .select('-password -emailVerificationOTP -emailVerificationOTPExpiry')
        .populate('assignedTo', 'name email role')
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
      .populate('services', 'name machineType price status images')
      .lean();

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get bank details and documents from separate collections
    let [bankDetails, documents, totalServices, activeServices, totalBookings, completedBookings] = await Promise.all([
      VendorBankDetails.findOne({ vendor: vendorId, isActive: { $ne: false } }).lean(),
      VendorDocument.find({ vendor: vendorId, isActive: { $ne: false } }).lean(),
      Service.countDocuments({ vendor: vendorId }),
      Service.countDocuments({ vendor: vendorId, isActive: true, status: 'APPROVED' }),
      Booking.countDocuments({ vendor: vendorId }),
      Booking.countDocuments({ vendor: vendorId, status: 'COMPLETED' })
    ]);

    if (!documents || documents.length === 0) {
      documents = await VendorDocument.find({ vendor: vendorId }).lean();
    }
    if (!bankDetails) {
      bankDetails = await VendorBankDetails.findOne({ vendor: vendorId }).lean();
    }
    if (!bankDetails && vendor.bankDetails) {
      bankDetails = vendor.bankDetails;
    }

    // Format documents similar to old structure for backward compatibility
    const formattedDocuments = {};
    (documents || []).forEach(doc => {
      if (doc.documentType === 'PROFILE_PICTURE') {
        formattedDocuments.profilePicture = {
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt,
          status: doc.status
        };
      } else if (doc.documentType === 'AADHAR') {
        if (!formattedDocuments.aadharCards) {
          formattedDocuments.aadharCards = [];
        }
        const aadharDoc = {
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt,
          name: doc.name || 'Aadhaar Card',
          status: doc.status
        };
        formattedDocuments.aadharCards.push(aadharDoc);
        if (!formattedDocuments.aadharCard) {
          formattedDocuments.aadharCard = aadharDoc;
        }
      } else if (doc.documentType === 'PAN') {
        formattedDocuments.panCard = {
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt,
          status: doc.status
        };
      } else if (doc.documentType === 'CHEQUE') {
        formattedDocuments.cancelledCheque = {
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt,
          status: doc.status
        };
      } else if (doc.documentType === 'GROUNDWATER_REG') {
        formattedDocuments.groundwaterRegDetails = {
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt,
          status: doc.status
        };
      } else if (doc.documentType === 'CERTIFICATE') {
        if (!formattedDocuments.certificates) {
          formattedDocuments.certificates = [];
        }
        formattedDocuments.certificates.push({
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt,
          name: doc.name || doc.certificateName,
          status: doc.status
        });
      } else if (doc.documentType === 'TRAINING_CERTIFICATE') {
        if (!formattedDocuments.trainingCertificates) {
          formattedDocuments.trainingCertificates = [];
        }
        formattedDocuments.trainingCertificates.push({
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt,
          name: doc.name || doc.certificateName,
          status: doc.status
        });
      }
    });

    // Check embedded documents on vendor model (for legacy / signup fallback)
    if (vendor.documents && typeof vendor.documents === 'object') {
      ['profilePicture', 'aadharCard', 'panCard', 'cancelledCheque', 'groundwaterRegDetails', 'certificates', 'trainingCertificates'].forEach(k => {
        if (!formattedDocuments[k] && vendor.documents[k]) {
          formattedDocuments[k] = vendor.documents[k];
        }
      });
    }

    // Top-level field fallbacks on vendor document
    if (!formattedDocuments.aadharCard && vendor.aadharCard) {
      formattedDocuments.aadharCard = typeof vendor.aadharCard === 'string' ? { url: vendor.aadharCard } : vendor.aadharCard;
    }
    if (!formattedDocuments.panCard && vendor.panCard) {
      formattedDocuments.panCard = typeof vendor.panCard === 'string' ? { url: vendor.panCard } : vendor.panCard;
    }
    if (!formattedDocuments.cancelledCheque && vendor.cancelledCheque) {
      formattedDocuments.cancelledCheque = typeof vendor.cancelledCheque === 'string' ? { url: vendor.cancelledCheque } : vendor.cancelledCheque;
    }
    if (!formattedDocuments.groundwaterRegDetails && vendor.groundwaterRegDetails) {
      formattedDocuments.groundwaterRegDetails = typeof vendor.groundwaterRegDetails === 'string' ? { url: vendor.groundwaterRegDetails } : vendor.groundwaterRegDetails;
    }

    // Add bankDetails and documents to vendor object
    vendor.bankDetails = bankDetails || null;
    vendor.documents = formattedDocuments;
    vendor.documentsList = documents || [];

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

    if (vendor.isApproved && vendor.verificationStatus === 'ACTIVATED') {
      return res.status(400).json({
        success: false,
        message: 'Vendor is already fully approved and activated'
      });
    }

    // Approve vendor documents & identity -> Move to VERIFIED_PENDING_AGREEMENT state
    // isApproved will become true once the expert signs the digital agreement
    vendor.isApproved = false;
    vendor.verificationStatus = 'VERIFIED_PENDING_AGREEMENT';
    vendor.approvedBy = adminId;
    vendor.approvedAt = new Date();
    vendor.rejectionReason = null;
    await vendor.save();

    // Decrement assigned admin's active KYC workload
    if (vendor.assignedTo) {
      const { decrementActiveWorkload } = require('../../services/workloadDistributionService');
      await decrementActiveWorkload(vendor.assignedTo);
    }

    // Approve all pending services
    await Service.updateMany(
      { vendor: vendor._id, status: 'PENDING' },
      {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date()
      }
    );

    // Approve all pending documents
    await VendorDocument.updateMany(
      { vendor: vendor._id, status: 'PENDING' },
      {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date()
      }
    );

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

    // Record Audit Log
    logAdminActivity({
      req,
      action: 'VENDOR_KYC_APPROVED',
      module: 'VERIFICATION',
      targetEntity: 'Vendor',
      targetId: vendor._id,
      targetLabel: `Expert: ${vendor.name} (${vendor.phone || vendor.email})`,
      previousState: { verificationStatus: 'PENDING_VERIFICATION', isApproved: false },
      newState: { verificationStatus: 'VERIFIED_PENDING_AGREEMENT', isApproved: false }
    });

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

    // Decrement assigned admin's active KYC workload
    if (vendor.assignedTo) {
      const { decrementActiveWorkload } = require('../../services/workloadDistributionService');
      await decrementActiveWorkload(vendor.assignedTo);
    }

    // Send rejection email
    await sendVendorRejectionEmail({
      email: vendor.email,
      name: vendor.name,
      rejectionReason: vendor.rejectionReason
    });

    // Record Audit Log
    logAdminActivity({
      req,
      action: 'VENDOR_KYC_REJECTED',
      module: 'VERIFICATION',
      targetEntity: 'Vendor',
      targetId: vendor._id,
      targetLabel: `Expert: ${vendor.name} (${vendor.phone || vendor.email})`,
      previousState: { isApproved: false },
      newState: { isApproved: false, rejectionReason: vendor.rejectionReason },
      notes: vendor.rejectionReason
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

    // Record Audit Log
    logAdminActivity({
      req,
      action: 'VENDOR_DEACTIVATED',
      module: 'VERIFICATION',
      targetEntity: 'Vendor',
      targetId: vendor._id,
      targetLabel: `Expert: ${vendor.name} (${vendor.phone || vendor.email})`,
      previousState: { isActive: true },
      newState: { isActive: false }
    });

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

    // Record Audit Log
    logAdminActivity({
      req,
      action: 'VENDOR_ACTIVATED',
      module: 'VERIFICATION',
      targetEntity: 'Vendor',
      targetId: vendor._id,
      targetLabel: `Expert: ${vendor.name} (${vendor.phone || vendor.email})`,
      previousState: { isActive: false },
      newState: { isActive: true }
    });

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

/**
 * Reassign Vendor KYC to an Expert Verification Admin (Super Admin only)
 */
const assignVendorKYC = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { assignedTo, reason, notes } = req.body;
    const adminId = req.userId;
    const adminUser = req.user;

    const targetAdminId = assignedTo || adminId;
    const { manualReassign } = require('../../services/workloadDistributionService');

    const result = await manualReassign({
      model: Vendor,
      entityId: vendorId,
      newAdminId: targetAdminId,
      reassignedByAdmin: adminUser || { _id: adminId, name: 'Admin' },
      reason: reason || 'Manual KYC reassignment by Super Admin',
      notes: notes || ''
    });

    res.json({
      success: true,
      message: result.message,
      data: {
        vendor: result.entity,
        auditRecord: result.auditRecord
      }
    });
  } catch (error) {
    console.error('Assign vendor KYC error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign vendor KYC',
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
  activateVendor,
  assignVendorKYC
};

