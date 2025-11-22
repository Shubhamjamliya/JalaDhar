const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  submitRating,
  getVendorRatings,
  getMyRatings,
  getBookingRating
} = require('../../controllers/ratingControllers/ratingController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isUser, isVendor } = require('../../middleware/roleMiddleware');

// Validation rules
const submitRatingValidation = [
  body('ratings.accuracy').isInt({ min: 1, max: 5 }).withMessage('Accuracy rating must be between 1 and 5'),
  body('ratings.professionalism').isInt({ min: 1, max: 5 }).withMessage('Professionalism rating must be between 1 and 5'),
  body('ratings.behavior').isInt({ min: 1, max: 5 }).withMessage('Behavior rating must be between 1 and 5'),
  body('ratings.visitTiming').isInt({ min: 1, max: 5 }).withMessage('Visit timing rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 500 }).withMessage('Review must be less than 500 characters')
];

// Routes
router.post('/:bookingId', authenticate, isUser, submitRatingValidation, submitRating);
router.get('/booking/:bookingId', authenticate, isUser, getBookingRating);
router.get('/my-ratings', authenticate, isVendor, getMyRatings); // Vendor's own ratings
router.get('/vendor/:vendorId', getVendorRatings); // Public route

module.exports = router;

