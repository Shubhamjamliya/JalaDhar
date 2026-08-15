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
  dob: {
    type: String,
    trim: true,
    default: null
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', null],
    default: null
  },
  designation: {
    type: String,
    default: null
  },
  panNo: {
    type: String,
    trim: true,
    default: null
  },
  isGstRegistered: {
    type: String,
    enum: ['Yes', 'No', null],
    default: null
  },
  gstNumber: {
    type: String,
    trim: true,
    default: null
  },
  education: {
    type: String,
    trim: true,
    default: null
  },
  institution: {
    type: String,
    trim: true,
    default: null
  },
  graduationYear: {
    type: String,
    trim: true,
    default: null
  },
  specialization: {
    type: String,
    trim: true,
    default: null
  },
  surveysCompleted: {
    type: Number,
    min: 0,
    default: 0
  },
  machineType: {
    type: String,
    trim: true,
    default: null
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
  expertId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
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
  verificationStatus: {
    type: String,
    enum: ['APPLICATION_SUBMITTED', 'PENDING', 'MORE_DOCS_NEEDED', 'VERIFIED_PENDING_AGREEMENT', 'ACTIVATED', 'APPROVED', 'REJECTED'],
    default: 'APPLICATION_SUBMITTED'
  },
  expertAgreementAcceptedVersion: {
    type: String,
    default: null
  },
  expertAgreementAcceptedAt: {
    type: Date,
    default: null
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
  district: {
    type: String,
    trim: true,
    default: null
  },
  state: {
    type: String,
    trim: true,
    default: null
  },
  serviceRadius: {
    type: String,
    trim: true,
    default: "50 km"
  },
  multipleStates: [{
    type: String,
    trim: true
  }],
  willingToTravel: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'Yes'
  },
  modeOfTravel: [{
    type: String,
    enum: ['Bus', 'Car', 'Bike', 'Train']
  }],
  travelChargesPerKm: {
    type: Number,
    min: 0,
    default: 0
  },
  address: {
    street: String,
    city: String,
    district: String,
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
  // Service areas / regions served by vendor
  serviceAreas: [{
    type: String,
    trim: true
  }],
  // New Expert Profile fields
  languages: {
    type: [String],
    default: ['English', 'Hindi', 'Telugu']
  },
  profileViews: {
    type: Number,
    default: 0
  },
  travelChargesPolicy: {
    type: String,
    trim: true,
    default: "Standard transport rates apply"
  },
  availableServices: {
    type: [String],
    enum: ['Agricultural Survey', 'Domestic Survey', 'Industrial Survey', 'Commercial Survey'],
    default: ['Agricultural Survey', 'Domestic Survey']
  },
  workingDays: {
    type: mongoose.Schema.Types.Mixed,
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  workingHours: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      start: '08:00',
      end: '19:00',
      preset: 'MORNING_TO_EVENING',
      label: '08:00 AM - 07:00 PM'
    }
  },
  aboutExpert: {
    type: String,
    trim: true,
    default: ""
  },
  // Services offered by vendor (legacy - kept for backward compatibility)
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  // Geoscientific Instruments / Devices available with the expert
  instruments: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Dowsing Rods', '3D Locator', 'PQWT', 'ADMT', 'Resistivity Meter', 'Other'],
      required: true
    },
    model: {
      type: String,
      trim: true,
      default: null
    },
    description: {
      type: String,
      trim: true,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Global service price (expertise fee) - set by vendor
  servicePrice: {
    type: Number,
    min: [0, 'Service price cannot be negative'],
    default: null
  },
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
    },
    totalJobsCompleted: {
      type: Number,
      default: 0
    }
  },
  // All time booking stats (separate from rating based stats)
  bookingStats: {
    total: { type: Number, default: 0 },
    success: { type: Number, default: 0 }, // Based on borewell success
    failed: { type: Number, default: 0 }, // Based on borewell failure
    cancelled: { type: Number, default: 0 } // Cancelled or rejected
  }
}, {
  timestamps: true
});

// Hash password before saving
vendorSchema.pre('save', async function (next) {
  if (!this.expertId && this._id) {
    this.expertId = `EXP-${this._id.toString().slice(-6).toUpperCase()}`;
  }
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

