const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  sendAdminRegistrationOTP,
  registerAdminWithOTP
} = require('../../controllers/adminControllers/adminAuthController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const { adminRegistrationRateLimiter } = require('../../middleware/rateLimiter');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('adminCode').trim().notEmpty().withMessage('Admin code is required')
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

// Validation rules for admin-to-admin registration
const adminRegistrationOTPValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('name').trim().notEmpty().withMessage('Name is required')
];

const registerAdminWithOTPValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('token').trim().notEmpty().withMessage('Verification token is required')
];

// Routes
router.post('/register', adminRegistrationRateLimiter, registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', authenticate, isAdmin, logout);
router.get('/profile', authenticate, isAdmin, getProfile);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Admin-to-admin registration with OTP (requires authentication)
router.post('/register/send-otp', authenticate, isAdmin, adminRegistrationOTPValidation, sendAdminRegistrationOTP);
router.post('/register/verify-otp', authenticate, isAdmin, registerAdminWithOTPValidation, registerAdminWithOTP);

module.exports = router;

