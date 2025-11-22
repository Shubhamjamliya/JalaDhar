const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  verifyAdvancePayment,
  verifyRemainingPayment,
  handleWebhook
} = require('../../controllers/paymentControllers/paymentController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isUser } = require('../../middleware/roleMiddleware');

// Validation rules
const verifyPaymentValidation = [
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('razorpayOrderId').notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpayPaymentId').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpaySignature').notEmpty().withMessage('Razorpay signature is required')
];

// Routes
router.post('/verify-advance', authenticate, isUser, verifyPaymentValidation, verifyAdvancePayment);
router.post('/verify-remaining', authenticate, isUser, verifyPaymentValidation, verifyRemainingPayment);
router.post('/webhook', handleWebhook); // No auth for webhook

module.exports = router;

