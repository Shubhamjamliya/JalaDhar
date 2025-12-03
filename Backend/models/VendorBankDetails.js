const mongoose = require('mongoose');

const vendorBankDetailsSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor is required'],
    unique: true, // One bank details per vendor
    index: true
  },
  accountHolderName: {
    type: String,
    required: [true, 'Account holder name is required'],
    trim: true
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    trim: true
  },
  ifscCode: {
    type: String,
    required: [true, 'IFSC code is required'],
    trim: true,
    uppercase: true
  },
  bankName: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true
  },
  branchName: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  // History tracking
  previousAccountNumber: String, // Store previous for audit
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
vendorBankDetailsSchema.index({ vendor: 1 });
vendorBankDetailsSchema.index({ isVerified: 1 });
vendorBankDetailsSchema.index({ isActive: 1 });

module.exports = mongoose.model('VendorBankDetails', vendorBankDetailsSchema);

