const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const {
  addService,
  getMyServices,
  getServiceDetails,
  updateService,
  deleteService,
  uploadServiceImages,
  deleteServiceImage
} = require('../../controllers/vendorControllers/vendorServiceController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');

// Configure multer for memory storage (to upload directly to Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Validation rules
const addServiceValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Service name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Service name must be between 3 and 100 characters'),
  body('machineType')
    .trim()
    .notEmpty()
    .withMessage('Machine type is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Machine type must be between 2 and 50 characters'),
  body('skills')
    .optional()
    .custom((value) => {
      try {
        const skills = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(skills)) {
          throw new Error('Skills must be an array');
        }
        if (skills.length === 0) {
          throw new Error('At least one skill is required');
        }
        return true;
      } catch (error) {
        throw new Error('Invalid skills format');
      }
    }),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a valid number and cannot be negative'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a valid number (in minutes) and at least 1'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters')
];

const updateServiceValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Service name cannot be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('Service name must be between 3 and 100 characters'),
  body('machineType')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Machine type cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Machine type must be between 2 and 50 characters'),
  body('skills')
    .optional()
    .custom((value) => {
      try {
        const skills = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(skills)) {
          throw new Error('Skills must be an array');
        }
        return true;
      } catch (error) {
        throw new Error('Invalid skills format');
      }
    }),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a valid number and cannot be negative'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a valid number (in minutes) and at least 1'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Routes
// Add new service
router.post('/services', authenticate, isVendor, upload.array('images', 5), addServiceValidation, addService);

// Get all vendor services
router.get('/services', authenticate, isVendor, getMyServices);

// Get service details
router.get('/services/:serviceId', authenticate, isVendor, getServiceDetails);

// Update service
router.put('/services/:serviceId', authenticate, isVendor, updateServiceValidation, updateService);

// Delete service
router.delete('/services/:serviceId', authenticate, isVendor, deleteService);

// Service images
router.post('/services/:serviceId/images', authenticate, isVendor, upload.array('images', 5), uploadServiceImages);
router.delete('/services/:serviceId/images/:imageId', authenticate, isVendor, deleteServiceImage);

module.exports = router;

