const Vendor = require('../../models/Vendor');
const VendorBankDetails = require('../../models/VendorBankDetails');
const VendorDocument = require('../../models/VendorDocument');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = 'vendor-documents') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

// Helper function to delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

/**
 * Get vendor profile
 */
const getProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.userId)
      .populate('services', 'name machineType price status')
      .select('-password -emailVerificationOTP -emailVerificationOTPExpiry')
      .lean();

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get bank details and documents from separate collections
    const [bankDetails, documents] = await Promise.all([
      VendorBankDetails.findOne({ vendor: req.userId, isActive: true }).lean(),
      VendorDocument.find({ vendor: req.userId, isActive: true }).lean()
    ]);

    // Format documents similar to old structure for backward compatibility
    const formattedDocuments = {};
    documents.forEach(doc => {
      if (doc.documentType === 'PROFILE_PICTURE') {
        formattedDocuments.profilePicture = {
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt
        };
      } else if (doc.documentType === 'AADHAR') {
        formattedDocuments.aadharCard = {
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt
        };
      } else if (doc.documentType === 'PAN') {
        formattedDocuments.panCard = {
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt
        };
      } else if (doc.documentType === 'CHEQUE') {
        formattedDocuments.cancelledCheque = {
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt
        };
      } else if (doc.documentType === 'CERTIFICATE') {
        if (!formattedDocuments.certificates) {
          formattedDocuments.certificates = [];
        }
        formattedDocuments.certificates.push({
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt,
          name: doc.name || doc.certificateName
        });
      }
    });

    // Add bankDetails and documents to vendor object
    vendor.bankDetails = bankDetails || null;
    vendor.documents = formattedDocuments;

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        vendor
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message
    });
  }
};

/**
 * Update vendor profile
 */
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendor = await Vendor.findById(req.userId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Allowed fields to update (excluding bankDetails which is in separate collection)
    const allowedFields = [
      'name',
      'phone',
      'address',
      'educationalQualifications',
      'experience'
    ];

    // Update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] === 'string' && (field === 'address' || field === 'educationalQualifications')) {
          try {
            vendor[field] = JSON.parse(req.body[field]);
          } catch (e) {
            vendor[field] = req.body[field];
          }
        } else {
          vendor[field] = req.body[field];
        }
      }
    });

    await vendor.save();

    // Handle bank details update separately
    if (req.body.bankDetails !== undefined) {
      const bankDetailsData = typeof req.body.bankDetails === 'string' 
        ? JSON.parse(req.body.bankDetails) 
        : req.body.bankDetails;
      
      // Find existing bank details or create new
      let bankDetails = await VendorBankDetails.findOne({ vendor: vendorId });
      
      if (bankDetails) {
        // Store previous account number for audit
        bankDetails.previousAccountNumber = bankDetails.accountNumber;
        bankDetails.accountHolderName = bankDetailsData.accountHolderName;
        bankDetails.accountNumber = bankDetailsData.accountNumber;
        bankDetails.ifscCode = bankDetailsData.ifscCode;
        bankDetails.bankName = bankDetailsData.bankName;
        bankDetails.branchName = bankDetailsData.branchName || null;
        bankDetails.isVerified = false; // Reset verification on update
        bankDetails.verifiedBy = null;
        bankDetails.verifiedAt = null;
        bankDetails.updatedBy = vendorId;
        await bankDetails.save();
      } else {
        // Create new bank details
        bankDetails = await VendorBankDetails.create({
          vendor: vendorId,
          accountHolderName: bankDetailsData.accountHolderName,
          accountNumber: bankDetailsData.accountNumber,
          ifscCode: bankDetailsData.ifscCode,
          bankName: bankDetailsData.bankName,
          branchName: bankDetailsData.branchName || null,
          isActive: true,
          isVerified: false,
          updatedBy: vendorId
        });
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        vendor
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Upload/Update profile picture
 */
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const vendor = await Vendor.findById(req.userId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Find existing profile picture document
    const existingProfilePic = await VendorDocument.findOne({
      vendor: req.userId,
      documentType: 'PROFILE_PICTURE',
      isActive: true
    });

    // Delete old profile picture from Cloudinary if exists
    if (existingProfilePic && existingProfilePic.publicId) {
      await deleteFromCloudinary(existingProfilePic.publicId);
      // Mark old document as inactive
      existingProfilePic.isActive = false;
      await existingProfilePic.save();
    }

    // Upload new profile picture
    const result = await uploadToCloudinary(req.file.buffer, 'vendor-documents/profile');

    // Create new profile picture document
    const profilePictureDoc = await VendorDocument.create({
      vendor: req.userId,
      documentType: 'PROFILE_PICTURE',
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
      status: existingProfilePic?.status || 'PENDING', // Keep previous status if exists
      version: existingProfilePic ? existingProfilePic.version + 1 : 1
    });

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: {
          url: profilePictureDoc.url,
          publicId: profilePictureDoc.publicId,
          uploadedAt: profilePictureDoc.uploadedAt
        }
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
};

/**
 * Upload gallery images
 */
const uploadGalleryImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    const vendor = await Vendor.findById(req.userId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const uploadedImages = [];
    const captions = req.body.captions ? (typeof req.body.captions === 'string' ? JSON.parse(req.body.captions) : req.body.captions) : [];

    // Upload each image
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const result = await uploadToCloudinary(file.buffer, 'vendor-documents/gallery');

      const imageData = {
        url: result.secure_url,
        publicId: result.public_id,
        uploadedAt: new Date(),
        caption: captions[i] || ''
      };

      vendor.gallery.push(imageData);
      uploadedImages.push(imageData);
    }

    await vendor.save();

    res.json({
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      data: {
        images: uploadedImages,
        totalImages: vendor.gallery.length
      }
    });
  } catch (error) {
    console.error('Upload gallery images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload gallery images',
      error: error.message
    });
  }
};

/**
 * Delete gallery image
 */
const deleteGalleryImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const vendor = await Vendor.findById(req.userId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Find the image in gallery
    const imageIndex = vendor.gallery.findIndex(
      img => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const image = vendor.gallery[imageIndex];

    // Delete from Cloudinary
    if (image.publicId) {
      await deleteFromCloudinary(image.publicId);
    }

    // Remove from gallery array
    vendor.gallery.splice(imageIndex, 1);
    await vendor.save();

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        remainingImages: vendor.gallery.length
      }
    });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

/**
 * Update availability settings
 */
const updateAvailability = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendor = await Vendor.findById(req.userId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const {
      isAvailable,
      workingDays,
      workingHours,
      timeSlots
    } = req.body;

    // Update availability
    if (isAvailable !== undefined) {
      vendor.availability.isAvailable = isAvailable;
    }

    if (workingDays !== undefined) {
      vendor.availability.workingDays = Array.isArray(workingDays) 
        ? workingDays 
        : (typeof workingDays === 'string' ? JSON.parse(workingDays) : []);
    }

    if (workingHours !== undefined) {
      const hours = typeof workingHours === 'string' ? JSON.parse(workingHours) : workingHours;
      if (hours.start) vendor.availability.workingHours.start = hours.start;
      if (hours.end) vendor.availability.workingHours.end = hours.end;
    }

    if (timeSlots !== undefined) {
      vendor.availability.timeSlots = Array.isArray(timeSlots)
        ? timeSlots
        : (typeof timeSlots === 'string' ? JSON.parse(timeSlots) : []);
    }

    await vendor.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        availability: vendor.availability
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
};

/**
 * Get payment collection status
 */
const getPaymentStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.userId)
      .select('paymentCollection name email');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: {
        paymentCollection: vendor.paymentCollection,
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email
        }
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment status',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  uploadGalleryImages,
  deleteGalleryImage,
  updateAvailability,
  getPaymentStatus
};

