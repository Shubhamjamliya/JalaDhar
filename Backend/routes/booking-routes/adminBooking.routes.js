const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllBookings,
  approveBorewellResult,
  processVendorSettlement,
  getBookingStatistics,
  getTravelChargesRequests,
  approveTravelCharges,
  rejectTravelCharges
} = require('../../controllers/bookingControllers/adminBookingController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

// Validation rules
const approveBorewellResultValidation = [
  body('approved').isBoolean().withMessage('Approved must be a boolean value')
];

const rejectTravelChargesValidation = [
  body('rejectionReason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10 })
    .withMessage('Rejection reason must be at least 10 characters')
];

// Routes
router.get('/bookings', authenticate, isAdmin, getAllBookings);
router.get('/statistics', authenticate, isAdmin, getBookingStatistics);
router.get('/travel-charges', authenticate, isAdmin, getTravelChargesRequests);
router.patch('/bookings/:bookingId/approve-result', authenticate, isAdmin, approveBorewellResultValidation, approveBorewellResult);
router.patch('/bookings/:bookingId/settlement', authenticate, isAdmin, processVendorSettlement);
router.patch('/bookings/:bookingId/travel-charges/approve', authenticate, isAdmin, approveTravelCharges);
router.patch('/bookings/:bookingId/travel-charges/reject', authenticate, isAdmin, rejectTravelChargesValidation, rejectTravelCharges);

module.exports = router;

