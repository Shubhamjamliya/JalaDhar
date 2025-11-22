const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const {
  getVendorBookings,
  acceptBooking,
  rejectBooking,
  markAsVisited,
  markVisitedAndUploadReport,
  getBookingDetails
} = require('../../controllers/bookingControllers/vendorBookingController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'reportFile') {
      // PDF files for report
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Report file must be PDF'), false);
      }
    } else if (file.fieldname === 'images') {
      // Image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Images must be image files'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

// Validation rules
const rejectBookingValidation = [
  body('rejectionReason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10 })
    .withMessage('Rejection reason must be at least 10 characters')
];

const uploadReportValidation = [
  body('waterFound').notEmpty().withMessage('Water found status is required'),
  body('machineReadings').optional().isJSON().withMessage('Machine readings must be valid JSON')
];

// Routes
// IMPORTANT: Specific routes must come before parameterized routes
router.get('/my-bookings', authenticate, isVendor, getVendorBookings);

// Accept booking route - MUST be before generic :bookingId route
router.patch('/:bookingId/accept', (req, res, next) => {
  console.log(`[ROUTE DEBUG] PATCH /:bookingId/accept matched - bookingId: ${req.params.bookingId}`);
  next();
}, authenticate, (req, res, next) => {
  console.log(`[AUTH DEBUG] Authentication passed - bookingId: ${req.params.bookingId}, userId: ${req.userId}`);
  next();
}, isVendor, (req, res, next) => {
  console.log(`[VENDOR DEBUG] Vendor check passed - bookingId: ${req.params.bookingId}`);
  next();
}, acceptBooking);

router.patch('/:bookingId/reject', authenticate, isVendor, rejectBookingValidation, rejectBooking);
router.patch('/:bookingId/visited', authenticate, isVendor, markAsVisited);
router.post(
  '/:bookingId/visit-report',
  authenticate,
  isVendor,
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'reportFile', maxCount: 1 }
  ]),
  uploadReportValidation,
  markVisitedAndUploadReport
);
// Generic route should be last
router.get('/:bookingId', authenticate, isVendor, getBookingDetails);

module.exports = router;

