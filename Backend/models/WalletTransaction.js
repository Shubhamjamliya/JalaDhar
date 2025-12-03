const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  type: {
    type: String,
    enum: ['TRAVEL_CHARGES', 'SITE_VISIT', 'REPORT_UPLOAD', 'PLATFORM_FEE_DEDUCTION', 'WITHDRAWAL_REQUEST', 'WITHDRAWAL_PROCESSED', 'WITHDRAWAL_REJECTED', 'FINAL_SETTLEMENT_REWARD', 'FINAL_SETTLEMENT_PENALTY'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  },
  description: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  errorMessage: String,
  retryCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
walletTransactionSchema.index({ vendor: 1, createdAt: -1 });
walletTransactionSchema.index({ booking: 1 });
walletTransactionSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);

