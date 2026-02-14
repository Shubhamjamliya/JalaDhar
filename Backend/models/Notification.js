const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['User', 'Vendor', 'Admin']
  },
  type: {
    type: String,
    required: true,
    enum: [
      // Booking notifications
      'BOOKING_CREATED',
      'BOOKING_ASSIGNED',
      'BOOKING_ACCEPTED',
      'BOOKING_REJECTED',
      'BOOKING_VISITED',
      'BOOKING_CANCELLED',
      'BOOKING_COMPLETED',
      'BOOKING_FAILED',
      'BOOKING_REASSIGNED',
      // Report & Borewell
      'REPORT_UPLOADED',
      'REPORT_APPROVED',
      'REPORT_REJECTED',
      'BOREWELL_UPLOADED',
      'BOREWELL_APPROVED',
      // Payment
      'PAYMENT_ADVANCE_SUCCESS',
      'PAYMENT_REMAINING_SUCCESS',
      'PAYMENT_FAILED',
      'PAYMENT_REFUNDED',
      'PAYMENT_RECEIVED',
      'REFUND_PROCESSED',
      // Settlement
      'FIRST_INSTALLMENT_PAID',
      'SETTLEMENT_APPROVED',
      'SETTLEMENT_COMPLETED',
      'FINAL_SETTLEMENT_PROCESSING',
      'FINAL_SETTLEMENT_PROCESSED',
      // Travel charges
      'TRAVEL_CHARGES_REQUESTED',
      'TRAVEL_CHARGES_APPROVED',
      'TRAVEL_CHARGES_REJECTED',
      // Vendor management
      'VENDOR_APPROVED',
      'VENDOR_REJECTED',
      'VENDOR_DEACTIVATED',
      // Service
      'SERVICE_APPROVED',
      'SERVICE_REJECTED',
      // Admin
      'NEW_VENDOR_REGISTRATION',
      'NEW_BOOKING_PENDING',
      'PAYMENT_DISPUTE',
      'NEW_DISPUTE',
      'DISPUTE_UPDATED',
      'DISPUTE_COMMENT',
      // Rating
      'NEW_RATING'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['Booking', 'Payment', 'Vendor', 'Service'],
      default: null
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, recipientModel: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, recipientModel: 1, createdAt: -1 });
notificationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

