const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getDashboardStats,
  getNewBookings,
  getBookingHistory,
  acceptBooking,
  rejectBooking,
  markAsVisited,
  markAsCompleted,
  scheduleVisit
} = require('../../controllers/vendorControllers/vendorDashboardController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');

// Validation rules
const rejectBookingValidation = [
  body('rejectionReason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters')
];

const scheduleVisitValidation = [
  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('scheduledTime')
    .notEmpty()
    .withMessage('Scheduled time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (use HH:MM)')
];

// Routes
// Dashboard stats
router.get('/dashboard', authenticate, isVendor, getDashboardStats);

// Booking management
router.get('/bookings', authenticate, isVendor, getNewBookings);
router.get('/bookings/history', authenticate, isVendor, getBookingHistory);

// Booking actions
router.patch('/bookings/:bookingId/accept', authenticate, isVendor, acceptBooking);
router.patch('/bookings/:bookingId/reject', authenticate, isVendor, rejectBookingValidation, rejectBooking);
router.patch('/bookings/:bookingId/visited', authenticate, isVendor, markAsVisited);
router.patch('/bookings/:bookingId/completed', authenticate, isVendor, markAsCompleted);
router.put('/bookings/:bookingId/schedule', authenticate, isVendor, scheduleVisitValidation, scheduleVisit);

module.exports = router;

