const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllServices,
  getAvailableVendors,
  getNearbyVendors,
  getVendorProfile,
  createBooking,
  getUserBookings,
  getBookingDetails,
  cancelBooking,
  initiateRemainingPayment,
  uploadBorewellResult,
  downloadInvoice,
  getDashboardStats
} = require('../../controllers/bookingControllers/userBookingController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isUser } = require('../../middleware/roleMiddleware');

// Validation rules
const createBookingValidation = [
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('vendorId').notEmpty().withMessage('Vendor ID is required'),
  body('scheduledDate').notEmpty().withMessage('Scheduled date is required'),
  body('scheduledTime').notEmpty().withMessage('Scheduled time is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.pincode').notEmpty().withMessage('Pincode is required')
];

const uploadBorewellResultValidation = [
  body('status').isIn(['SUCCESS', 'FAILED']).withMessage('Status must be SUCCESS or FAILED')
];

// Routes - Specific routes first, then dynamic routes
router.get('/dashboard/stats', authenticate, isUser, getDashboardStats);
router.get('/my-bookings', authenticate, isUser, getUserBookings);
router.get('/services', authenticate, isUser, getAllServices);
router.get('/vendors/nearby', authenticate, isUser, getNearbyVendors);
router.get('/vendors/:vendorId', authenticate, isUser, getVendorProfile);
router.get('/services/:serviceId/vendors', authenticate, isUser, getAvailableVendors);
router.post('/create', authenticate, isUser, createBookingValidation, createBooking);
router.get('/:bookingId', authenticate, isUser, getBookingDetails);
router.patch('/:bookingId/cancel', authenticate, isUser, body('cancellationReason').optional().isLength({ max: 500 }), cancelBooking);
router.post('/:bookingId/remaining-payment', authenticate, isUser, initiateRemainingPayment);
router.post('/:bookingId/borewell-result', authenticate, isUser, uploadBorewellResultValidation, uploadBorewellResult);
router.get('/:bookingId/invoice', authenticate, isUser, downloadInvoice);

module.exports = router;

