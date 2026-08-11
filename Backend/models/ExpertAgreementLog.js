const mongoose = require('mongoose');

const expertAgreementLogSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  expertName: {
    type: String,
    required: true,
    trim: true
  },
  expertId: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  agreementVersion: {
    type: String,
    required: true,
    default: 'v1.0'
  },
  acceptedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  deviceId: {
    type: String,
    default: 'Web/Browser'
  },
  appVersion: {
    type: String,
    default: '1.0.0'
  },
  status: {
    type: String,
    enum: ['ACCEPTED', 'REVOKED'],
    default: 'ACCEPTED'
  },
  pdfUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

expertAgreementLogSchema.index({ vendor: 1, agreementVersion: 1 });
expertAgreementLogSchema.index({ expertId: 1 });
expertAgreementLogSchema.index({ mobileNumber: 1 });

module.exports = mongoose.model('ExpertAgreementLog', expertAgreementLogSchema);
