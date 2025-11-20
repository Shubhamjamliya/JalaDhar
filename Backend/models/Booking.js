const mongoose = require('mongoose');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../utils/constants');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor is required']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  scheduledTime: {
    type: String,
    required: [true, 'Scheduled time is required']
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    landmark: String
  },
  payment: {
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
    transactionId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paidAt: Date
  },
  notes: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    default: null
  },
  completedAt: Date,
  visitedAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['USER', 'VENDOR', 'ADMIN'],
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
bookingSchema.index({ vendor: 1, status: 1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ 'payment.status': 1 });

// Virtual for booking duration (if needed)
bookingSchema.virtual('duration').get(function() {
  if (this.visitedAt && this.completedAt) {
    return Math.round((this.completedAt - this.visitedAt) / 1000 / 60); // in minutes
  }
  return null;
});

module.exports = mongoose.model('Booking', bookingSchema);

