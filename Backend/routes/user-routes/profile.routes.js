const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const {
  getProfile,
  updateProfile,
  uploadProfilePicture
} = require('../../controllers/userControllers/userProfileController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isUser } = require('../../middleware/roleMiddleware');

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
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.pincode').optional().trim()
];

// Routes
// Get profile
router.get('/profile', authenticate, isUser, getProfile);

// Update profile
router.put('/profile', authenticate, isUser, updateProfileValidation, updateProfile);

// Upload profile picture
router.post('/profile/picture', authenticate, isUser, upload.single('image'), uploadProfilePicture);

module.exports = router;

