const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  // Who raised the dispute
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'raisedByModel'
  },
  raisedByModel: {
    type: String,
    required: true,
    enum: ['User', 'Vendor']
  },
  // Related booking (if applicable)
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  // Dispute type
  type: {
    type: String,
    required: true,
    enum: [
      'PAYMENT_ISSUE',
      'SERVICE_QUALITY',
      'VENDOR_BEHAVIOR',
      'REPORT_ISSUE',
      'CANCELLATION',
      'REFUND',
      'OTHER'
    ]
  },
  // Subject/title
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  // Description/details
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'],
    default: 'PENDING'
  },
  // Priority
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  // Admin assigned to handle
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  // Resolution details
  resolution: {
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    resolvedAt: Date,
    actionTaken: {
      type: String,
      enum: [
        'REFUND_PROCESSED',
        'COMPENSATION_PROVIDED',
        'VENDOR_WARNED',
        'VENDOR_SUSPENDED',
        'SERVICE_REDONE',
        'NO_ACTION',
        'OTHER'
      ]
    }
  },
  // Attachments (screenshots, documents, etc.)
  attachments: [{
    url: String,
    publicId: String,
    fileName: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Comments/Updates
  comments: [{
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'commentedByModel'
    },
    commentedByModel: {
      type: String,
      required: true,
      enum: ['User', 'Vendor', 'Admin']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
disputeSchema.index({ raisedBy: 1, raisedByModel: 1, createdAt: -1 });
disputeSchema.index({ booking: 1 });
disputeSchema.index({ status: 1, priority: 1 });
disputeSchema.index({ assignedTo: 1, status: 1 });
disputeSchema.index({ type: 1, status: 1 });

const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = Dispute;

