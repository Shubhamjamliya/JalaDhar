const Vendor = require('../../models/Vendor');
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
      .select('-password -emailVerificationOTP -emailVerificationOTPExpiry');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

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

    // Allowed fields to update
    const allowedFields = [
      'name',
      'phone',
      'address',
      'bankDetails',
      'educationalQualifications',
      'experience'
    ];

    // Update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] === 'string' && (field === 'address' || field === 'bankDetails' || field === 'educationalQualifications')) {
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

    // Delete old profile picture if exists
    if (vendor.documents.profilePicture && vendor.documents.profilePicture.publicId) {
      await deleteFromCloudinary(vendor.documents.profilePicture.publicId);
    }

    // Upload new profile picture
    const result = await uploadToCloudinary(req.file.buffer, 'vendor-documents/profile');

    vendor.documents.profilePicture = {
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date()
    };

    await vendor.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: vendor.documents.profilePicture
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

