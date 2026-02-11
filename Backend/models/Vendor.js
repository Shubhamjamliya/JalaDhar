const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vendorSchema = new mongoose.Schema({
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
    enum: ['VENDOR'],
    default: 'VENDOR'
  },
  // Bank Details - Now in separate VendorBankDetails collection
  // bankDetails field removed - use VendorBankDetails model instead
  // Educational Qualifications
  educationalQualifications: [{
    degree: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  // Experience (in years)
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: 0
  },
  experienceDetails: {
    type: String,
    trim: true,
    default: null
  },
  // Documents - Now in separate VendorDocument collection
  // documents field removed - use VendorDocument model instead
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
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    geoLocation: {
      formattedAddress: String,
      placeId: String,
      geocodedAt: Date
    }
  },
  // Availability Settings
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    workingDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '18:00'
      }
    },
    timeSlots: [{
      date: Date,
      slots: [{
        start: String,
        end: String,
        isAvailable: {
          type: Boolean,
          default: true
        }
      }]
    }]
  },
  // Services offered by vendor
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  // Payment Collection Status
  paymentCollection: {
    totalEarnings: {
      type: Number,
      default: 0
    },
    pendingAmount: {
      type: Number,
      default: 0
    },
    collectedAmount: {
      type: Number,
      default: 0
    },
    lastPaymentDate: Date,
    // Wallet system
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
  },
  // Gallery Images
  gallery: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    caption: String
  }],
  // Rating and Performance
  rating: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    successCount: {
      type: Number,
      default: 0
    },
    failureCount: {
      type: Number,
      default: 0
    },
    successRatio: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
vendorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
vendorSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate success ratio before saving
vendorSchema.pre('save', function (next) {
  if (this.rating.successCount + this.rating.failureCount > 0) {
    const total = this.rating.successCount + this.rating.failureCount;
    this.rating.successRatio = Math.round(
      (this.rating.successCount / total) * 100
    );
  }
  next();
});

// Remove sensitive data before sending JSON
vendorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationOTP;
  delete obj.emailVerificationOTPExpiry;
  return obj;
};

module.exports = mongoose.model('Vendor', vendorSchema);

