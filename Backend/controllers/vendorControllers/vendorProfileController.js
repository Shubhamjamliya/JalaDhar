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
    let [bankDetails, documents] = await Promise.all([
      VendorBankDetails.findOne({ vendor: req.userId, isActive: { $ne: false } }).lean(),
      VendorDocument.find({ vendor: req.userId, isActive: { $ne: false } }).lean()
    ]);

    if (!documents || documents.length === 0) {
      documents = await VendorDocument.find({ vendor: req.userId }).lean();
    }

    if (!bankDetails) {
      bankDetails = await VendorBankDetails.findOne({ vendor: req.userId }).lean();
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
          uploadedAt: doc.uploadedAt
        };
      } else if (doc.documentType === 'AADHAR') {
        if (!formattedDocuments.aadharCards) {
          formattedDocuments.aadharCards = [];
        }
        const aadharDoc = {
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt,
          name: doc.name || 'Aadhaar Card'
        };
        formattedDocuments.aadharCards.push(aadharDoc);
        if (!formattedDocuments.aadharCard) {
          formattedDocuments.aadharCard = aadharDoc;
        }
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
      } else if (doc.documentType === 'GROUNDWATER_REG') {
        formattedDocuments.groundwaterRegDetails = {
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt
        };
      } else if (doc.documentType === 'TRAINING_CERTIFICATE') {
        if (!formattedDocuments.trainingCertificates) {
          formattedDocuments.trainingCertificates = [];
        }
        formattedDocuments.trainingCertificates.push({
          url: doc.url,
          publicId: doc.publicId,
          uploadedAt: doc.uploadedAt,
          name: doc.name || doc.certificateName
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

    if (!vendor.profilePicture && formattedDocuments.profilePicture?.url) {
      vendor.profilePicture = formattedDocuments.profilePicture.url;
    }

    // Extract unique instruments from services or machineType if instruments is empty
    const instrumentsSet = new Set();
    if (vendor.instruments && Array.isArray(vendor.instruments) && vendor.instruments.length > 0) {
      vendor.instruments.forEach(inst => {
        const name = typeof inst === 'object' ? (inst.name || inst.category) : inst;
        if (name) instrumentsSet.add(name);
      });
    }
    if (vendor.services && Array.isArray(vendor.services)) {
      vendor.services.forEach(service => {
        if (service.machineType) {
          const types = service.machineType.split(',').map(t => t.trim()).filter(Boolean);
          types.forEach(type => instrumentsSet.add(type));
        }
      });
    }
    if (vendor.machineType) {
      const types = vendor.machineType.split(',').map(t => t.trim()).filter(Boolean);
      types.forEach(type => instrumentsSet.add(type));
    }

    if (instrumentsSet.size > 0) {
      vendor.instruments = Array.from(instrumentsSet);
    }

    // Ensure educationalQualifications has items if education is stored
    if ((!vendor.educationalQualifications || vendor.educationalQualifications.length === 0) && vendor.education) {
      vendor.educationalQualifications = [{
        degree: vendor.education,
        institution: vendor.institution || 'Verified on File',
        year: vendor.graduationYear ? parseInt(vendor.graduationYear) : new Date().getFullYear(),
        specialization: vendor.specialization || ''
      }];
    }

    vendor.expertId = vendor.expertId || (vendor._id ? `EXP-${vendor._id.toString().slice(-6).toUpperCase()}` : null);

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

    const vendorId = req.userId;
    const vendor = await Vendor.findById(vendorId);
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
      'dob',
      'bloodGroup',
      'gender',
      'designation',
      'panNo',
      'isGstRegistered',
      'gstNumber',
      'education',
      'institution',
      'graduationYear',
      'specialization',
      'surveysCompleted',
      'machineType',
      'address',
      'district',
      'state',
      'serviceRadius',
      'multipleStates',
      'willingToTravel',
      'modeOfTravel',
      'travelChargesPerKm',
      'serviceAreas',
      'educationalQualifications',
      'experience',
      'experienceDetails',
      'instruments',
      'servicePrice',
      'languages',
      'travelChargesPolicy',
      'availableServices',
      'workingDays',
      'workingHours',
      'aboutExpert',
      'isOnline',
      'pausedUntil',
      'pauseReason'
    ];

    // Update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        let value = req.body[field];

        // Sanitize empty strings for enum fields
        if ((field === 'bloodGroup' || field === 'gender' || field === 'designation' || field === 'willingToTravel') && value === '') {
          value = null;
        }

        if (typeof value === 'string' && (
          field === 'address' ||
          field === 'educationalQualifications' ||
          field === 'instruments' ||
          field === 'languages' ||
          field === 'availableServices' ||
          field === 'workingDays' ||
          field === 'workingHours' ||
          field === 'multipleStates' ||
          field === 'modeOfTravel' ||
          field === 'serviceAreas'
        )) {
          try {
            vendor[field] = JSON.parse(value);
          } catch (e) {
            if (field === 'multipleStates' || field === 'modeOfTravel' || field === 'serviceAreas') {
              vendor[field] = value.split(',').map(s => s.trim()).filter(Boolean);
            } else {
              vendor[field] = value;
            }
          }
        } else if (field === 'servicePrice') {
          vendor.servicePrice = (value !== null && value !== '' && value !== undefined) ? parseFloat(value) : null;
        } else {
          vendor[field] = value;
        }
      }
    });

    vendor.markModified('workingDays');
    vendor.markModified('workingHours');
    vendor.markModified('address');
    vendor.markModified('multipleStates');
    vendor.markModified('modeOfTravel');
    vendor.markModified('serviceAreas');
    vendor.markModified('instruments');
    vendor.markModified('educationalQualifications');

    await vendor.save();

    // Sync vendor's updated service price, machineType, category to any referenced Service records
    try {
      const Service = require('../../models/Service');
      const serviceUpdates = {};
      if (vendor.servicePrice !== undefined && vendor.servicePrice !== null) {
        serviceUpdates.price = vendor.servicePrice;
      }
      if (vendor.machineType) {
        serviceUpdates.machineType = vendor.machineType;
      }
      if (vendor.designation) {
        serviceUpdates.category = vendor.designation;
      }
      if (Object.keys(serviceUpdates).length > 0) {
        await Service.updateMany(
          { vendor: vendor._id },
          { $set: serviceUpdates }
        );
      }
    } catch (syncErr) {
      console.warn('Could not sync Service collection with vendor profile:', syncErr.message);
    }

    // Handle bank details update separately
    if (req.body.bankDetails !== undefined || req.body['bankDetails[accountHolderName]'] !== undefined || req.body.accountNumber !== undefined) {
      let bankDetailsData = null;
      if (typeof req.body.bankDetails === 'string') {
        try {
          bankDetailsData = JSON.parse(req.body.bankDetails);
        } catch (e) {
          bankDetailsData = null;
        }
      } else if (typeof req.body.bankDetails === 'object') {
        bankDetailsData = req.body.bankDetails;
      }

      if (!bankDetailsData) {
        const holder = req.body['bankDetails[accountHolderName]'] || req.body['bankDetails.accountHolderName'] || req.body.accountHolderName;
        const num = req.body['bankDetails[accountNumber]'] || req.body['bankDetails.accountNumber'] || req.body.accountNumber;
        const ifsc = req.body['bankDetails[ifscCode]'] || req.body['bankDetails.ifscCode'] || req.body.ifscCode;
        const bank = req.body['bankDetails[bankName]'] || req.body['bankDetails.bankName'] || req.body.bankName;
        const branch = req.body['bankDetails[branchName]'] || req.body['bankDetails.branchName'] || req.body.branchName;
        if (holder && num && ifsc && bank) {
          bankDetailsData = {
            accountHolderName: holder,
            accountNumber: num,
            ifscCode: ifsc,
            bankName: bank,
            branchName: branch || null
          };
        }
      }

      if (bankDetailsData && bankDetailsData.accountNumber) {
        // Find existing bank details or create new
        let bankDetails = await VendorBankDetails.findOne({ vendor: vendorId });

        if (bankDetails) {
          // Store previous account number for audit
          bankDetails.previousAccountNumber = bankDetails.accountNumber;
          bankDetails.accountHolderName = bankDetailsData.accountHolderName;
          bankDetails.accountNumber = bankDetailsData.accountNumber;
          bankDetails.ifscCode = bankDetailsData.ifscCode ? bankDetailsData.ifscCode.toUpperCase() : bankDetails.ifscCode;
          bankDetails.bankName = bankDetailsData.bankName;
          bankDetails.branchName = bankDetailsData.branchName || null;
          bankDetails.isActive = true;
          bankDetails.updatedBy = vendorId;
          await bankDetails.save();
        } else {
          // Create new bank details
          bankDetails = await VendorBankDetails.create({
            vendor: vendorId,
            accountHolderName: bankDetailsData.accountHolderName,
            accountNumber: bankDetailsData.accountNumber,
            ifscCode: bankDetailsData.ifscCode ? bankDetailsData.ifscCode.toUpperCase() : '',
            bankName: bankDetailsData.bankName,
            branchName: bankDetailsData.branchName || null,
            isActive: true,
            isVerified: false,
            updatedBy: vendorId
          });
        }
        vendor.bankDetails = bankDetails;
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

/**
 * Toggle vendor real-time online status / smart pause
 */
const toggleOnlineStatus = async (req, res) => {
  try {
    const vendorId = req.userId;
    const { isOnline, pauseDuration, pauseReason } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const newOnlineStatus = typeof isOnline === 'boolean' ? isOnline : !vendor.isOnline;
    vendor.isOnline = newOnlineStatus;

    if (newOnlineStatus) {
      vendor.lastOnlineAt = new Date();
      vendor.pausedUntil = null;
      vendor.pauseReason = null;
    } else {
      vendor.lastOfflineAt = new Date();
      vendor.pauseReason = pauseReason || (pauseDuration === '2_HOURS' ? 'QUICK_BREAK' : pauseDuration === 'REST_OF_TODAY' ? 'BUSY_TODAY' : 'MANUAL');

      if (pauseDuration === '2_HOURS') {
        const pauseDate = new Date();
        pauseDate.setHours(pauseDate.getHours() + 2);
        vendor.pausedUntil = pauseDate;
      } else if (pauseDuration === 'REST_OF_TODAY') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        let startHour = 8;
        let startMin = 0;
        if (vendor.workingHours && vendor.workingHours.start) {
          const [h, m] = vendor.workingHours.start.split(':').map(Number);
          if (!isNaN(h)) startHour = h;
          if (!isNaN(m)) startMin = m;
        }
        tomorrow.setHours(startHour, startMin, 0, 0);
        vendor.pausedUntil = tomorrow;
      } else {
        vendor.pausedUntil = null;
      }
    }

    await vendor.save();

    // Broadcast status change via Socket.IO if available
    try {
      const { getIO } = require('../../sockets');
      const io = getIO();
      if (io) {
        io.emit('vendor_online_status_changed', {
          vendorId: vendor._id,
          isOnline: vendor.isOnline,
          pausedUntil: vendor.pausedUntil,
          pauseReason: vendor.pauseReason,
          timestamp: new Date()
        });
      }
    } catch (socketErr) {
      console.warn('[Socket] Could not broadcast vendor status update:', socketErr.message);
    }

    res.json({
      success: true,
      message: `Status updated to ${vendor.isOnline ? 'Online' : 'Offline'}`,
      data: {
        vendor: {
          _id: vendor._id,
          isOnline: vendor.isOnline,
          pausedUntil: vendor.pausedUntil,
          pauseReason: vendor.pauseReason,
          lastOnlineAt: vendor.lastOnlineAt,
          lastOfflineAt: vendor.lastOfflineAt
        }
      }
    });
  } catch (error) {
    console.error('Toggle online status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability status',
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
  getPaymentStatus,
  toggleOnlineStatus
};


