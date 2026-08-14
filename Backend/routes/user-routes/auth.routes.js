const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  sendRegistrationOTP,
  register,
  login,
  sendLoginOTP,
  verifyLoginOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  verifyEmail,
  resendEmailVerification,
  logout
} = require('../../controllers/userControllers/userAuthController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isUser } = require('../../middleware/roleMiddleware');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').trim().notEmpty().withMessage('Please provide a valid email or phone number'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').trim().notEmpty().withMessage('Please provide a valid email or mobile number')
];

const resetPasswordValidation = [
  body('email').trim().notEmpty().withMessage('Please provide a valid email or mobile number'),
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

// Validation for sending OTP
const sendOTPValidation = [
  body('name').trim().notEmpty().withMessage('Full Name is required'),
  body('phone').trim().notEmpty().withMessage('Mobile Number is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid email')
];

// Validation for registration with OTP
const registerWithOTPValidation = [
  body('name').trim().notEmpty().withMessage('Full Name is required'),
  body('phone').trim().notEmpty().withMessage('Mobile Number is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid email'),
  body('password').optional({ checkFalsy: true }),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('token').trim().notEmpty().withMessage('Verification token is required')
];

// Routes
router.post('/register/send-otp', sendOTPValidation, sendRegistrationOTP);
router.post('/register', registerWithOTPValidation, register);
router.post('/login', loginValidation, login);
router.post('/login/send-otp', sendLoginOTP);
router.post('/login/verify-otp', verifyLoginOTP);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.post('/verify-email', verifyEmailValidation, verifyEmail);
router.post('/resend-email-verification', resendEmailValidation, resendEmailVerification);
router.post('/logout', authenticate, isUser, logout);

module.exports = router;

