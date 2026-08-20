const mongoose = require('mongoose');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../utils/constants');
const assignmentHistoryRecordSchema = require('./schemas/assignmentHistorySchema');

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
  rejectedVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  // Operations Admin assigned to oversee booking lifecycle
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  // Immutable Audit Trail for Booking Operations
  assignmentHistory: [assignmentHistoryRecordSchema],
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING
  },
  // OTP Verification for Survey
  otp: {
    startSurvey: {
      code: String,
      generatedAt: Date,
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    },
    endSurvey: {
      code: String,
      generatedAt: Date,
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    }
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
    default: 'TBD'
  },
  alternatePhone: {
    type: String,
    trim: true,
    default: null
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
    trim: true
  },
  surveyCategory: {
    type: String,
    trim: true
  },
  purposeExtent: {
    type: Number,
    min: 0
  },
  areaUnit: {
    type: String,
    trim: true,
    default: 'Acres'
  },
  existingBorewellInfo: {
    type: String,
    trim: true,
    default: null
  },
  customerNotes: {
    type: String,
    trim: true
  },
  customerPhotos: [{
    url: String,
    publicId: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  supportingDocuments: [{
    url: String,
    name: String,
    publicId: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

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
      type: Boolean, // true = Suitable Borewell Point Identified, false = No Suitable Borewell Point Identified
      default: null
    },
    feedback: {
      isUseful: Boolean,
      submittedAt: Date,
    },
    // Booking / Customer Info (Snapshot at time of report generation)
    customerName: String,
    village: String,
    mandal: String,
    district: String,
    state: String,
    landLocation: String,
    surveyNumber: String,
    extent: String,
    
    // Geological Information
    geologicalInfo: {
      rockType: String,
      soilType: String,
      terrainType: String,
      weatheredZone: String,
      groundwaterCondition: {
        type: String,
        enum: ['Poor', 'Moderate', 'Good', 'Excellent', '']
      }
    },

    // Existing Borewell Details
    existingBorewell: {
      distance: Number,
      depth: Number,
      yield: Number,
      status: {
        type: String,
        enum: ['Working', 'Seasonal', 'Dry', 'Failed', '']
      }
    },

    // Survey Recommendations
    surveyRecommendations: {
      pointsInvestigated: Number,
      recommendedPointNumber: String,
      latitude: String,
      longitude: String,
      groundElevation: String,
      recommendedBoreDepth: Number,
      recommendedCasingDepth: Number,
      expectedFractureDepths: String,
      expectedYield: Number
    },

    // Drilling Instructions
    drillingInstructions: {
      stopDrillingDepth: Number,
      flushBorewell: {
        type: Boolean,
        default: false
      }
    },

    // Expert Analysis
    confidenceLevel: {
      type: String,
      enum: ['High', 'Medium', 'Low', '']
    },
    drillingRecommendation: {
      type: String,
      enum: ['Proceed Immediately', 'Suitable After Monsoon', 'Proceed With Caution', 'Not Recommended', '']
    },
    
    // Additional Notes
    notes: String,

    // Evidence
    evidence: {
      gpsLocation: {
        lat: Number,
        lng: Number
      },
      surveyTimestamp: Date,
      photoCount: Number
    },
    
    // Expert Declaration & Signature
    declaration: {
      expertDeclaration: {
        type: Boolean,
        default: false
      },
      signature: String
    },

    images: [{
      url: String,
      publicId: String,
      geoTag: {
        lat: Number,
        lng: Number
      },
      category: String, // Site, Equipment, Marked Point
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
    // Quality Control Admin assigned for report verification
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    // Immutable Audit Trail for Survey Report Quality Control
    assignmentHistory: [assignmentHistoryRecordSchema],
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
      default: null    // null by default — only set when user actually uploads a result
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
    // Quality Control Admin assigned for review
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    // Immutable Audit Trail for Quality Control
    assignmentHistory: [assignmentHistoryRecordSchema],
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
  // Cancellation & Expert Disruption Management
  cancellationDetails: {
    cancelledBy: {
      type: String,
      enum: ['USER', 'VENDOR', 'ADMIN', null],
      default: null
    },
    cancellationType: {
      type: String,
      enum: ['EXPERT_SAME_DAY', 'EXPERT_ADVANCE', 'USER_VOLUNTARY', 'ADMIN_INTERVENTION', null],
      default: null
    },
    reason: {
      type: String,
      default: null
    },
    reasonCategory: {
      type: String,
      default: null
    },
    isSameDay: {
      type: Boolean,
      default: false
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellingVendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null
    },
    userResolution: {
      status: {
        type: String,
        enum: ['PENDING', 'REASSIGNED', 'REFUNDED', null],
        default: null
      },
      resolvedAt: Date,
      replacementVendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        default: null
      },
      refundAmount: {
        type: Number,
        default: 0
      },
      notes: String
    }
  },
  // On-Site Survey Infeasibility (Expert arrived but survey could not be completed)
  unableToCompleteDetails: {
    reported: {
      type: Boolean,
      default: false
    },
    reportedAt: Date,
    reasonCategory: {
      type: String,
      enum: ['LAND_ACCESS_DENIED', 'EXTREME_WEATHER_FLOODING', 'BOUNDARY_DISPUTE', 'CUSTOMER_ABSENT', 'DANGEROUS_TERRAIN', 'OTHER', null],
      default: null
    },
    reasonDescription: String,
    photos: [{
      url: String,
      publicId: String
    }],
    coordinates: {
      lat: Number,
      lng: Number
    },
    adminReview: {
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'DISPUTED'],
        default: 'PENDING'
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      },
      reviewedAt: Date,
      notes: String,
      travelFeePayableToVendor: {
        type: Boolean,
        default: true
      },
      userRefundPercentage: {
        type: Number,
        default: 100
      }
    }
  },
  // Reschedule Management
  isRescheduled: {
    type: Boolean,
    default: false
  },
  rescheduleCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  rescheduleHistory: [{
    requestedBy: {
      type: String,
      enum: ['USER', 'VENDOR', 'ADMIN'],
      required: true
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'rescheduleHistory.requesterModel'
    },
    requesterModel: {
      type: String,
      enum: ['User', 'Vendor', 'Admin'],
      default: 'User'
    },
    previousDate: {
      type: Date,
      required: true
    },
    previousTime: {
      type: String,
      required: true
    },
    newDate: {
      type: Date,
      required: true
    },
    newTime: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      trim: true
    },
    previousVendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    newVendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    vendorReassigned: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['APPLIED', 'PENDING_CONFIRMATION', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
      default: 'APPLIED'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Timestamps
  assignedAt: Date,
  acceptedAt: Date,
  enRouteAt: Date,
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

