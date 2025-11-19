const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendEmailVerification,
  logout
} = require('../../controllers/vendorControllers/vendorAuthController');
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

// Configure multer fields for document uploads
const uploadDocuments = upload.fields([
  { name: 'aadharCard', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }, // Allow multiple certificates
  { name: 'cancelledCheque', maxCount: 1 }
]);

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('bankDetails.accountHolderName').trim().notEmpty().withMessage('Account holder name is required'),
  body('bankDetails.accountNumber').trim().notEmpty().withMessage('Account number is required'),
  body('bankDetails.ifscCode').trim().notEmpty().withMessage('IFSC code is required'),
  body('bankDetails.bankName').trim().notEmpty().withMessage('Bank name is required'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be a valid number (years)')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const verifyEmailValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

const resendEmailValidation = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

// Routes
router.post('/register', uploadDocuments, registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.post('/verify-email', verifyEmailValidation, verifyEmail);
router.post('/resend-email-verification', resendEmailValidation, resendEmailVerification);
router.post('/logout', authenticate, isVendor, logout);

module.exports = router;

