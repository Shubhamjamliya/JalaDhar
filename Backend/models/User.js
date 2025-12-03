const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['USER'],
    default: 'USER'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    type: String,
    select: false
  },
  emailVerificationOTPExpiry: {
    type: Date,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  // Wallet system for refunds and withdrawals
  wallet: {
    walletBalance: {
      type: Number,
      default: 0,
      min: [0, 'Wallet balance cannot be negative']
    },
    totalCredited: {
      type: Number,
      default: 0,
      min: [0, 'Total credited cannot be negative']
    },
    withdrawalRequests: [{
      amount: {
        type: Number,
        required: true,
        min: [0, 'Withdrawal amount cannot be negative']
      },
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'],
        default: 'PENDING'
      },
      requestedAt: {
        type: Date,
        default: Date.now
      },
      processedAt: Date,
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      },
      razorpayPayoutId: String, // Keep for backward compatibility
      transactionId: String, // New transaction ID field
      paymentMethod: {
        type: String,
        enum: ['UPI', 'BANK_TRANSFER', 'NEFT', 'IMPS', 'RTGS', 'RAZORPAY', 'CASH', 'OTHER'],
        default: null
      },
      paymentDate: Date,
      notes: String,
      rejectionReason: String
    }]
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data before sending JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationOTP;
  delete obj.emailVerificationOTPExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

