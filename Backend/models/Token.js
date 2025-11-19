const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Vendor', 'Admin']
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['PASSWORD_RESET', 'EMAIL_VERIFICATION', 'PHONE_VERIFICATION'],
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
tokenSchema.index({ userId: 1, type: 1 });
tokenSchema.index({ token: 1 });

module.exports = mongoose.model('Token', tokenSchema);

