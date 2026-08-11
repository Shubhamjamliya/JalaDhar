const mongoose = require('mongoose');

const agreementAcceptanceLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  userName: {
    type: String,
    required: [true, 'User Name is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile Number is required'],
    trim: true
  },
  agreementVersion: {
    type: String,
    required: [true, 'Agreement Version is required'],
    trim: true,
    default: 'v1.0.0'
  },
  acceptedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: 'Unknown',
    trim: true
  },
  deviceId: {
    type: String,
    default: 'Web/Browser',
    trim: true
  },
  appVersion: {
    type: String,
    default: '1.0.0',
    trim: true
  },
  status: {
    type: String,
    enum: ['ACCEPTED', 'REVOKED'],
    default: 'ACCEPTED'
  }
}, {
  timestamps: true
});

// Indexes for fast administrative querying
agreementAcceptanceLogSchema.index({ user: 1, agreementVersion: 1 });
agreementAcceptanceLogSchema.index({ acceptedAt: -1 });

module.exports = mongoose.model('AgreementAcceptanceLog', agreementAcceptanceLogSchema);
