const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const {
  getVendorBookings,
  acceptBooking,
  rejectBooking,
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
router.get('/my-bookings', authenticate, isVendor, getVendorBookings);
router.get('/:bookingId', authenticate, isVendor, getBookingDetails);
router.patch('/:bookingId/accept', authenticate, isVendor, acceptBooking);
router.patch('/:bookingId/reject', authenticate, isVendor, rejectBookingValidation, rejectBooking);
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

module.exports = router;

