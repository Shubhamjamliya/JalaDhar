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
  registerAdminWithOTP,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  getAssignmentToggles,
  updateAssignmentToggle,
  getTeamPerformanceStats
} = require('../../controllers/adminControllers/adminAuthController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin, isSuperAdmin } = require('../../middleware/roleMiddleware');
const { authRateLimiter, otpRateLimiter } = require('../../middleware/rateLimiter');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('adminCode').trim().notEmpty().withMessage('Admin code is required')
];

const loginValidation = [
  body('email').trim().notEmpty().withMessage('Please provide your email or mobile number'),
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

const adminRegistrationOTPValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('verifyMethod').optional().isIn(['EMAIL', 'PHONE']).withMessage('Invalid verification method'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid email'),
  body('phone').optional({ checkFalsy: true }).trim()
];

const registerAdminWithOTPValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid email'),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('token').trim().notEmpty().withMessage('Verification token is required')
];

// Routes
router.post('/register', authRateLimiter, registerValidation, register);
router.post('/login', authRateLimiter, loginValidation, login);
router.post('/logout', authenticate, isAdmin, logout);
router.get('/profile', authenticate, isAdmin, getProfile);
router.post('/forgot-password', otpRateLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPasswordValidation, resetPassword);

// Admin-to-admin registration with OTP (managed by Super Admin ONLY)
router.post('/register/send-otp', authenticate, isSuperAdmin, otpRateLimiter, adminRegistrationOTPValidation, sendAdminRegistrationOTP);
router.post('/register/verify-otp', authenticate, isSuperAdmin, authRateLimiter, registerAdminWithOTPValidation, registerAdminWithOTP);

// Admin Management (Super Admin only)
router.get('/manage/all', authenticate, isSuperAdmin, getAllAdmins);
router.patch('/manage/update/:adminId', authenticate, isSuperAdmin, updateAdmin);
router.delete('/manage/delete/:adminId', authenticate, isSuperAdmin, deleteAdmin);

// Workload Distribution & Performance (Super Admin only)
router.get('/assignment-toggles', authenticate, isSuperAdmin, getAssignmentToggles);
router.post('/assignment-toggles', authenticate, isSuperAdmin, updateAssignmentToggle);
router.get('/team-performance', authenticate, isSuperAdmin, getTeamPerformanceStats);

module.exports = router;
