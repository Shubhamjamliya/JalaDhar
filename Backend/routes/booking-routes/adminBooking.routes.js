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
  rejectReport,
  getPendingFirstPaymentReleases,
  getPendingSecondPaymentReleases,
  getPendingVendorFinalSettlements,
  getCompletedVendorFinalSettlements,
  getPendingUserFinalSettlements,
  getCompletedUserFinalSettlements,
  processNewFinalSettlement,
  processUserFinalSettlement,
  getBookingDetails
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
router.get('/bookings', authenticate, isAdmin, getAllBookings);
// Moved generic /bookings/:bookingId to end to avoid masking other routes
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
router.get('/bookings/pending-first-payment', authenticate, isAdmin, getPendingFirstPaymentReleases);
router.get('/bookings/pending-second-payment', authenticate, isAdmin, getPendingSecondPaymentReleases);

// New Final Settlement routes (separate from old final settlement)
// Vendor final settlements
router.get('/bookings/final-settlement/vendor/pending', authenticate, isAdmin, getPendingVendorFinalSettlements);
router.get('/bookings/final-settlement/vendor/completed', authenticate, isAdmin, getCompletedVendorFinalSettlements);
router.patch('/bookings/:bookingId/final-settlement/vendor/process', authenticate, isAdmin, processNewFinalSettlement);
// User final settlements
router.get('/bookings/final-settlement/user/pending', authenticate, isAdmin, getPendingUserFinalSettlements);
router.get('/bookings/final-settlement/user/completed', authenticate, isAdmin, getCompletedUserFinalSettlements);
router.patch('/bookings/:bookingId/final-settlement/user/process', authenticate, isAdmin, processUserFinalSettlement);

// Generic ID route must be last
router.get('/bookings/:bookingId', authenticate, isAdmin, getBookingDetails);

module.exports = router;

