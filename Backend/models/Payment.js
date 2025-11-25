const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../utils/constants');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  paymentType: {
    type: String,
    enum: ['ADVANCE', 'REMAINING', 'SETTLEMENT', 'TRAVEL_CHARGES', 'REFUND'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  // Razorpay details
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  // Payment metadata
  currency: {
    type: String,
    default: 'INR'
  },
  method: {
    type: String,
    default: 'razorpay'
  },
  description: String,
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: Date,
  failedAt: Date,
  refundedAt: Date,
  // Refund details
  refund: {
    amount: Number,
    razorpayRefundId: String,
    reason: String,
    processedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ booking: 1, paymentType: 1 });
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ vendor: 1, status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

