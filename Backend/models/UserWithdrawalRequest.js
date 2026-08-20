const mongoose = require('mongoose');
const assignmentHistoryRecordSchema = require('./schemas/assignmentHistorySchema');

const userWithdrawalRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Withdrawal amount is required'],
    min: [0, 'Withdrawal amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'],
    default: 'PENDING',
    index: true
  },
  // Finance Admin assigned to verify and process
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  // Immutable Audit Trail for User Refunds / Withdrawals
  assignmentHistory: [assignmentHistoryRecordSchema],
  payoutType: {
    type: String,
    enum: ['UPI', 'BANK_TRANSFER'],
    default: 'UPI'
  },
  upiId: {
    type: String,
    trim: true,
    default: null
  },
  accountDetails: {
    accountHolderName: { type: String, trim: true, default: null },
    accountNumber: { type: String, trim: true, default: null },
    ifscCode: { type: String, trim: true, default: null },
    bankName: { type: String, trim: true, default: null }
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  // Transaction details
  transactionId: {
    type: String,
    default: null
  },
  razorpayPayoutId: {
    type: String,
    default: null // Keep for backward compatibility
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'BANK_TRANSFER', 'NEFT', 'IMPS', 'RTGS', 'RAZORPAY', 'CASH', 'OTHER'],
    default: null
  },
  paymentDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
userWithdrawalRequestSchema.index({ user: 1, status: 1 });
userWithdrawalRequestSchema.index({ status: 1, requestedAt: -1 });
userWithdrawalRequestSchema.index({ user: 1, requestedAt: -1 });

module.exports = mongoose.model('UserWithdrawalRequest', userWithdrawalRequestSchema);

