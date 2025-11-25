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
  rejectTravelCharges,
  payTravelCharges,
  payFirstInstallment,
  paySecondInstallment,
  getReportPendingApprovals,
  getBorewellPendingApprovals,
  getPendingUserRefunds,
  processUserRefund,
  processFinalSettlement,
  approveReport,
  rejectReport
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
router.patch('/bookings/:bookingId/travel-charges/pay', authenticate, isAdmin, payTravelCharges);
router.patch('/bookings/:bookingId/first-installment/pay', authenticate, isAdmin, payFirstInstallment);
router.patch('/bookings/:bookingId/second-installment/pay', authenticate, isAdmin, paySecondInstallment);
router.get('/bookings/report-pending', authenticate, isAdmin, getReportPendingApprovals);
router.patch('/bookings/:bookingId/approve-report', authenticate, isAdmin, approveReport);
router.patch('/bookings/:bookingId/reject-report', authenticate, isAdmin, rejectTravelChargesValidation, rejectReport);
router.get('/bookings/borewell-pending', authenticate, isAdmin, getBorewellPendingApprovals);
router.get('/bookings/pending-user-refunds', authenticate, isAdmin, getPendingUserRefunds);
router.patch('/bookings/:bookingId/user-refund', authenticate, isAdmin, processUserRefund);
router.patch('/bookings/:bookingId/final-settlement', authenticate, isAdmin, processFinalSettlement);

module.exports = router;

