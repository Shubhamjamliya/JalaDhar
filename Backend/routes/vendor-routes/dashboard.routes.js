const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getDashboardStats,
  getNewBookings,
  getBookingHistory
  // Note: acceptBooking, rejectBooking, markAsVisited, markAsCompleted, scheduleVisit
  // have been moved to vendorBooking.routes.js to use the correct booking controller
} = require('../../controllers/vendorControllers/vendorDashboardController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');

// Validation rules - REMOVED: These are now in vendorBooking.routes.js
// const rejectBookingValidation = [...];
// const scheduleVisitValidation = [...];

// Routes
// Dashboard stats
router.get('/dashboard', authenticate, isVendor, getDashboardStats);

// Booking management
// NOTE: Booking actions (accept/reject) are now handled in /api/vendors/bookings routes
// These routes are kept for backward compatibility but may be deprecated
router.get('/bookings', authenticate, isVendor, getNewBookings);
router.get('/bookings/history', authenticate, isVendor, getBookingHistory);

// Booking actions - REMOVED: These are now handled in /api/vendors/bookings routes
// The accept/reject routes have been moved to vendorBooking.routes.js to use the correct booking controller
// router.patch('/bookings/:bookingId/accept', authenticate, isVendor, acceptBooking);
// router.patch('/bookings/:bookingId/reject', authenticate, isVendor, rejectBookingValidation, rejectBooking);
// router.patch('/bookings/:bookingId/visited', authenticate, isVendor, markAsVisited);
// router.patch('/bookings/:bookingId/completed', authenticate, isVendor, markAsCompleted);
// router.put('/bookings/:bookingId/schedule', authenticate, isVendor, scheduleVisitValidation, scheduleVisit);

module.exports = router;

