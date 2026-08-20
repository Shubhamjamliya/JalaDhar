const mongoose = require('mongoose');

/**
 * NotificationLog Schema
 * Provides idempotency and duplicate prevention for push notifications (SOP v3.0)
 */
const notificationLogSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userModel: {
    type: String,
    enum: ['User', 'Vendor', 'Admin', 'Expert'],
    default: 'User'
  },
  title: {
    type: String,
    default: ''
  },
  tokens: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['SENT', 'FAILED', 'NO_TOKENS', 'SKIPPED_DUPLICATE'],
    default: 'SENT'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours TTL auto-deletion
  }
}, {
  timestamps: true
});

// TTL index to automatically delete records after 24 hours
notificationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

module.exports = NotificationLog;
