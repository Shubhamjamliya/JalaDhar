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
  getBookingDetails,
  resolveInfeasibleBooking,
  assignBorewellQA,
  assignReportQA,
  assignBookingOperations
} = require('../../controllers/bookingControllers/adminBookingController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin, isSuperAdmin, canApproveReports, canApproveDisbursals } = require('../../middleware/roleMiddleware');

// Validation rules
const approveBorewellResultValidation = [
  body('approved')
    .isBoolean()
    .withMessage('Approved must be a boolean')
];

const rejectTravelChargesValidation = [
  body('rejectionReason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters')
];

// Routes
router.get('/bookings', authenticate, isAdmin, getAllBookings);
router.patch('/bookings/:bookingId/resolve-infeasible', authenticate, isSuperAdmin, resolveInfeasibleBooking);
router.patch('/bookings/:bookingId/assign-operations', authenticate, isSuperAdmin, assignBookingOperations);
// Moved generic /bookings/:bookingId to end to avoid masking other routes
router.get('/statistics', authenticate, isAdmin, getBookingStatistics);
router.get('/travel-charges', authenticate, isAdmin, getTravelChargesRequests);
router.patch('/bookings/:bookingId/approve-result', authenticate, canApproveReports, approveBorewellResultValidation, approveBorewellResult);
router.patch('/bookings/:bookingId/settlement', authenticate, canApproveDisbursals, processVendorSettlement);
router.patch('/bookings/:bookingId/travel-charges/approve', authenticate, canApproveDisbursals, approveTravelCharges);
router.patch('/bookings/:bookingId/travel-charges/reject', authenticate, canApproveDisbursals, rejectTravelChargesValidation, rejectTravelCharges);
router.patch('/bookings/:bookingId/travel-charges/pay', authenticate, canApproveDisbursals, payTravelCharges);
router.patch('/bookings/:bookingId/first-installment/pay', authenticate, canApproveDisbursals, payFirstInstallment);
router.patch('/bookings/:bookingId/second-installment/pay', authenticate, canApproveDisbursals, paySecondInstallment);
router.get('/bookings/report-pending', authenticate, isAdmin, getReportPendingApprovals);
router.patch('/bookings/:bookingId/assign-report-qa', authenticate, isSuperAdmin, assignReportQA);
router.patch('/bookings/:bookingId/approve-report', authenticate, canApproveReports, approveReport);
router.patch('/bookings/:bookingId/reject-report', authenticate, canApproveReports, rejectTravelChargesValidation, rejectReport);
router.get('/bookings/borewell-pending', authenticate, isAdmin, getBorewellPendingApprovals);
router.patch('/bookings/:bookingId/assign-borewell-qa', authenticate, isSuperAdmin, assignBorewellQA);
router.get('/bookings/pending-user-refunds', authenticate, isAdmin, getPendingUserRefunds);
router.patch('/bookings/:bookingId/user-refund', authenticate, canApproveDisbursals, processUserRefund);
router.patch('/bookings/:bookingId/final-settlement', authenticate, canApproveDisbursals, processFinalSettlement);
router.get('/bookings/pending-first-payment', authenticate, isAdmin, getPendingFirstPaymentReleases);
router.get('/bookings/pending-second-payment', authenticate, isAdmin, getPendingSecondPaymentReleases);

// New Final Settlement routes (separate from old final settlement)
// Vendor final settlements
router.get('/bookings/final-settlement/vendor/pending', authenticate, isAdmin, getPendingVendorFinalSettlements);
router.get('/bookings/final-settlement/vendor/completed', authenticate, isAdmin, getCompletedVendorFinalSettlements);
router.patch('/bookings/:bookingId/final-settlement/vendor/process', authenticate, canApproveDisbursals, processNewFinalSettlement);
// User final settlements
router.get('/bookings/final-settlement/user/pending', authenticate, isAdmin, getPendingUserFinalSettlements);
router.get('/bookings/final-settlement/user/completed', authenticate, isAdmin, getCompletedUserFinalSettlements);
router.patch('/bookings/:bookingId/final-settlement/user/process', authenticate, canApproveDisbursals, processUserFinalSettlement);
router.patch('/bookings/:bookingId/resolve-infeasible', authenticate, isSuperAdmin, resolveInfeasibleBooking);

// Generic ID route must be last
router.get('/bookings/:bookingId', authenticate, isAdmin, getBookingDetails);

module.exports = router;

