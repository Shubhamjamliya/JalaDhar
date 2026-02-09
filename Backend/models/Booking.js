const mongoose = require('mongoose');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../utils/constants');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor is required']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING
  },
  // Separate status for vendor and user views
  vendorStatus: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING
  },
  userStatus: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  scheduledTime: {
    type: String,
    required: [true, 'Scheduled time is required']
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    landmark: String
  },
  // Customer Enquiry Form fields
  village: {
    type: String,
    trim: true
  },
  mandal: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    enum: ['Agriculture', 'Industrial/Commercial', 'Domestic/Household', 'Open plots'],
    trim: true
  },
  purposeExtent: {
    type: Number,
    min: 0
  },

  payment: {
    baseServiceFee: {
      type: Number,
      required: true,
      min: [0, 'Base service fee cannot be negative']
    },
    distance: {
      type: Number, // Distance in km between vendor and user location
      default: null
    },
    travelCharges: {
      type: Number,
      default: 0,
      min: [0, 'Travel charges cannot be negative']
    },
    gst: {
      type: Number,
      default: 0,
      min: [0, 'GST cannot be negative']
    },
    subtotal: {
      type: Number, // baseServiceFee + travelCharges
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative']
    },
    advanceAmount: {
      type: Number,
      required: true,
      min: [0, 'Advance amount cannot be negative']
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: [0, 'Remaining amount cannot be negative']
    },
    advancePaid: {
      type: Boolean,
      default: false
    },
    remainingPaid: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING
    },
    // Advance payment details
    advanceTransactionId: String,
    advanceRazorpayOrderId: String,
    advanceRazorpayPaymentId: String,
    advancePaidAt: Date,
    // Remaining payment details
    remainingTransactionId: String,
    remainingRazorpayOrderId: String,
    remainingRazorpayPaymentId: String,
    remainingPaidAt: Date,
    // Vendor settlement
    vendorSettlement: {
      amount: Number,
      status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
      },
      settlementType: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        default: null
      },
      incentive: Number,
      penalty: Number,
      travelCharges: Number,
      settledAt: Date,
      settledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      }
    },
    // First installment (50% after report upload)
    firstInstallment: {
      amount: Number,
      paid: {
        type: Boolean,
        default: false
      },
      paidAt: Date,
      paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      }
    },
    // Vendor wallet payments
    vendorWalletPayments: {
      // Calculation breakdown
      base: {
        type: Number,
        default: 0
      },
      gst: {
        type: Number,
        default: 0
      },
      platformFee: {
        type: Number,
        default: 0
      },
      totalVendorPayment: {
        type: Number,
        default: 0
      },
      // Payment schedule
      siteVisitPayment: {
        amount: {
          type: Number,
          default: 0
        },
        credited: {
          type: Boolean,
          default: false
        },
        creditedAt: Date,
        transactionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'WalletTransaction'
        },
        failed: {
          type: Boolean,
          default: false
        },
        errorMessage: String
      },
      reportUploadPayment: {
        amount: {
          type: Number,
          default: 0
        },
        credited: {
          type: Boolean,
          default: false
        },
        creditedAt: Date,
        transactionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'WalletTransaction'
        },
        failed: {
          type: Boolean,
          default: false
        },
        errorMessage: String
      },
      totalCredited: {
        type: Number,
        default: 0
      }
    }
  },
  // Final Settlement (separate from vendorSettlement - for borewell result based rewards/penalties)
  finalSettlement: {
    rewardAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    penaltyAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    remittanceAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED'],
      default: 'PENDING'
    },
    borewellResult: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: null
    },
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WalletTransaction'
    },
    notes: String
  },
  notes: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    default: null
  },
  // Water detection report
  report: {
    waterFound: {
      type: Boolean,
      default: null
    },
    machineReadings: {
      depth: Number,
      flowRate: Number,
      quality: String,
      notes: String
    },
    images: [{
      url: String,
      publicId: String,
      geoTag: {
        lat: Number,
        lng: Number
      },
      uploadedAt: Date
    }],
    reportFile: {
      url: String,
      publicId: String,
      uploadedAt: Date
    },
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    rejectedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    rejectionReason: String
  },
  // Borewell result (after user digs)
  borewellResult: {
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING'
    },
    images: [{
      url: String,
      publicId: String,
      uploadedAt: Date
    }],
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  // Travel charges request
  travelChargesRequest: {
    amount: {
      type: Number,
      min: [0, 'Travel charges cannot be negative']
    },
    reason: String,
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: null
    },
    requestedAt: Date,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    rejectionReason: String,
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  // Invoice
  invoice: {
    invoiceNumber: String,
    invoiceUrl: String,
    publicId: String,
    generatedAt: Date
  },
  // Timestamps
  assignedAt: Date,
  acceptedAt: Date,
  visitedAt: Date,
  reportUploadedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['USER', 'VENDOR', 'ADMIN'],
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
bookingSchema.index({ vendor: 1, status: 1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ 'payment.status': 1 });

// Virtual for booking duration (if needed)
bookingSchema.virtual('duration').get(function () {
  if (this.visitedAt && this.completedAt) {
    return Math.round((this.completedAt - this.visitedAt) / 1000 / 60); // in minutes
  }
  return null;
});

module.exports = mongoose.model('Booking', bookingSchema);

