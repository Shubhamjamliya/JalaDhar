const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  uploadGalleryImages,
  deleteGalleryImage,

  getPaymentStatus
} = require('../../controllers/vendorControllers/vendorProfileController');
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
const updateProfileValidation = [
  body('name').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Phone cannot be empty'),
  body('experience').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Experience must be a valid number (years)')
];

// Routes
// Get profile
router.get('/profile', authenticate, isVendor, getProfile);

// Update profile
router.put('/profile', authenticate, isVendor, updateProfileValidation, updateProfile);

// Upload profile picture
router.post('/profile/picture', authenticate, isVendor, upload.single('image'), uploadProfilePicture);

// Gallery management
router.post('/gallery', authenticate, isVendor, upload.array('images', 10), uploadGalleryImages);
router.delete('/gallery/:imageId', authenticate, isVendor, deleteGalleryImage);



// Payment status
router.get('/payment-status', authenticate, isVendor, getPaymentStatus);

module.exports = router;

