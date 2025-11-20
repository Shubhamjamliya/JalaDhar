const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllBookings,
  approveBorewellResult,
  processVendorSettlement,
  getBookingStatistics
} = require('../../controllers/bookingControllers/adminBookingController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

// Validation rules
const approveBorewellResultValidation = [
  body('approved').isBoolean().withMessage('Approved must be a boolean value')
];

// Routes
router.get('/bookings', authenticate, isAdmin, getAllBookings);
router.get('/statistics', authenticate, isAdmin, getBookingStatistics);
router.patch('/bookings/:bookingId/approve-result', authenticate, isAdmin, approveBorewellResultValidation, approveBorewellResult);
router.patch('/bookings/:bookingId/settlement', authenticate, isAdmin, processVendorSettlement);

module.exports = router;

