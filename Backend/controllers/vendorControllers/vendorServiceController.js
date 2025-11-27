const Service = require('../../models/Service');
const Vendor = require('../../models/Vendor');
const { SERVICE_STATUS } = require('../../utils/constants');
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
const uploadToCloudinary = (buffer, folder = 'vendor-services') => {
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
 * Add new service
 */
const addService = async (req, res) => {
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
    const {
      name,
      description,
      machineType,
      skills,
      price,
      duration,
      category
    } = req.body;

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Parse skills if it's a string and not empty
    let parsedSkills = [];
    if (skills) {
      if (typeof skills === 'string' && skills.trim() !== '' && skills !== '[]') {
        try {
          parsedSkills = JSON.parse(skills);
          // Only include if it's a non-empty array
          if (!Array.isArray(parsedSkills) || parsedSkills.length === 0) {
            parsedSkills = [];
          }
        } catch (e) {
          parsedSkills = [];
        }
      } else if (Array.isArray(skills) && skills.length > 0) {
        parsedSkills = skills;
      }
    }

    // Handle service images upload
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, `vendor-services/${vendorId}`);
        images.push({
          url: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date()
        });
      }
    }

    // Create service
    const serviceData = {
      vendor: vendorId,
      name: name.trim(),
      description: description?.trim() || '',
      machineType: machineType.trim(),
      price: parseFloat(price),
      images,
      status: SERVICE_STATUS.PENDING // New services need admin approval
    };

    // Add skills only if not empty
    if (parsedSkills.length > 0) {
      serviceData.skills = parsedSkills;
    }

    // Add category only if provided and not empty
    if (category && category.trim() !== '') {
      serviceData.category = category.trim();
    }

    // Add duration only if provided
    if (duration) {
      serviceData.duration = parseInt(duration);
    }

    const service = await Service.create(serviceData);

    // Add service to vendor's services array
    vendor.services.push(service._id);
    await vendor.save();

    res.status(201).json({
      success: true,
      message: 'Service added successfully. Pending admin approval.',
      data: {
        service
      }
    });
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add service',
      error: error.message
    });
  }
};

/**
 * Get all vendor services
 */
const getMyServices = async (req, res) => {
  try {
    const vendorId = req.userId;
    const { status, isActive, page = 1, limit = 10 } = req.query;

    const query = { vendor: vendorId };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, total] = await Promise.all([
      Service.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Service.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Services retrieved successfully',
      data: {
        services,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalServices: total,
          hasNext: skip + services.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve services',
      error: error.message
    });
  }
};

/**
 * Get service details
 */
const getServiceDetails = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const vendorId = req.userId;

    const service = await Service.findOne({
      _id: serviceId,
      vendor: vendorId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service details retrieved successfully',
      data: {
        service
      }
    });
  } catch (error) {
    console.error('Get service details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve service details',
      error: error.message
    });
  }
};

/**
 * Update service details
 */
const updateService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { serviceId } = req.params;
    const vendorId = req.userId;

    const service = await Service.findOne({
      _id: serviceId,
      vendor: vendorId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Only allow updates if service is not approved (or allow updates to approved services)
    // For now, we'll allow updates but reset status to PENDING if it was approved
    const wasApproved = service.status === SERVICE_STATUS.APPROVED;

    // Allowed fields to update
    const allowedFields = [
      'name',
      'description',
      'machineType',
      'skills',
      'price',
      'duration',
      'category',
      'isActive'
    ];

    // Update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'skills') {
          // Only update skills if not empty
          let parsedSkills = [];
          if (req.body[field]) {
            if (typeof req.body[field] === 'string' && req.body[field].trim() !== '' && req.body[field] !== '[]') {
              try {
                parsedSkills = JSON.parse(req.body[field]);
                if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
                  service[field] = parsedSkills;
                } else {
                  // Set to empty array if empty
                  service[field] = [];
                }
              } catch (e) {
                // Invalid JSON, set to empty array
                service[field] = [];
              }
            } else if (Array.isArray(req.body[field]) && req.body[field].length > 0) {
              service[field] = req.body[field];
            } else {
              // Empty or invalid, set to empty array
              service[field] = [];
            }
          } else {
            // Explicitly empty, set to empty array
            service[field] = [];
          }
        } else if (field === 'price') {
          service[field] = parseFloat(req.body[field]);
        } else if (field === 'duration') {
          if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
            service[field] = parseInt(req.body[field]);
          } else {
            // Allow setting duration to null/undefined if explicitly provided
            service[field] = undefined;
          }
        } else if (field === 'category') {
          // Only update category if not empty
          if (req.body[field] && req.body[field].trim() !== '') {
            service[field] = req.body[field].trim();
          } else {
            // Set to empty string or undefined if empty
            service[field] = '';
          }
        } else if (field === 'name' || field === 'description' || field === 'machineType') {
          service[field] = req.body[field]?.trim() || service[field];
        } else {
          service[field] = req.body[field];
        }
      }
    });

    // If service was approved and significant fields changed, reset to pending
    if (wasApproved && (
      req.body.name || req.body.machineType || req.body.price || req.body.skills
    )) {
      service.status = SERVICE_STATUS.PENDING;
      service.rejectionReason = null;
      service.approvedBy = null;
      service.approvedAt = null;
    }

    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: {
        service
      }
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
};

/**
 * Delete service (soft delete)
 */
const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const vendorId = req.userId;

    const service = await Service.findOne({
      _id: serviceId,
      vendor: vendorId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if service has active bookings
    const Booking = require('../../models/Booking');
    const activeBookings = await Booking.countDocuments({
      service: serviceId,
      status: { $in: ['PENDING', 'ACCEPTED', 'VISITED'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete service. There are ${activeBookings} active booking(s) associated with this service.`
      });
    }

    // Delete images from Cloudinary
    if (service.images && service.images.length > 0) {
      for (const image of service.images) {
        if (image.publicId) {
          await deleteFromCloudinary(image.publicId);
        }
      }
    }

    // Soft delete - set isActive to false
    service.isActive = false;
    await service.save();

    // Remove from vendor's services array
    const vendor = await Vendor.findById(vendorId);
    if (vendor) {
      vendor.services = vendor.services.filter(
        s => s.toString() !== serviceId
      );
      await vendor.save();
    }

    res.json({
      success: true,
      message: 'Service deleted successfully',
      data: {
        serviceId: service._id
      }
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
};

/**
 * Upload service images
 */
const uploadServiceImages = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const vendorId = req.userId;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      vendor: vendorId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const uploadedImages = [];

    // Upload each image
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, `vendor-services/${vendorId}`);

      const imageData = {
        url: result.secure_url,
        publicId: result.public_id,
        uploadedAt: new Date()
      };

      service.images.push(imageData);
      uploadedImages.push(imageData);
    }

    await service.save();

    res.json({
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      data: {
        images: uploadedImages,
        totalImages: service.images.length
      }
    });
  } catch (error) {
    console.error('Upload service images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload service images',
      error: error.message
    });
  }
};

/**
 * Delete service image
 */
const deleteServiceImage = async (req, res) => {
  try {
    const { serviceId, imageId } = req.params;
    const vendorId = req.userId;

    const service = await Service.findOne({
      _id: serviceId,
      vendor: vendorId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Find the image
    const imageIndex = service.images.findIndex(
      img => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const image = service.images[imageIndex];

    // Delete from Cloudinary
    if (image.publicId) {
      await deleteFromCloudinary(image.publicId);
    }

    // Remove from images array
    service.images.splice(imageIndex, 1);
    await service.save();

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        remainingImages: service.images.length
      }
    });
  } catch (error) {
    console.error('Delete service image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

module.exports = {
  addService,
  getMyServices,
  getServiceDetails,
  updateService,
  deleteService,
  uploadServiceImages,
  deleteServiceImage
};

