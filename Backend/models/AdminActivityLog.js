const mongoose = require('mongoose');

const adminActivityLogSchema = new mongoose.Schema(
  {
    // WHO: Staff member details
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true
    },
    adminName: {
      type: String,
      required: true,
      trim: true
    },
    adminEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    adminRole: {
      type: String,
      required: true,
      index: true
    },

    // WHAT: Action descriptor
    action: {
      type: String,
      required: true,
      index: true
    },

    // Category / Module for fast aggregation & filtering
    module: {
      type: String,
      enum: ['OPERATIONS', 'FINANCE', 'QC', 'VERIFICATION', 'SUPPORT', 'SECURITY', 'SETTINGS'],
      required: true,
      index: true
    },

    // TARGET: The entity that was modified
    targetEntity: {
      type: String, // 'Booking', 'Vendor', 'User', 'Payment', 'Admin', 'Settings', 'Dispute', etc.
      required: true,
      index: true
    },
    targetId: {
      type: String,
      required: true,
      index: true
    },
    targetLabel: {
      type: String,
      trim: true
    },

    // BEFORE & AFTER STATE (Audit snapshot & diff)
    previousState: {
      type: mongoose.Schema.Types.Mixed
    },
    newState: {
      type: mongoose.Schema.Types.Mixed
    },

    // Context / Rejection Reason / Custom note
    notes: {
      type: String,
      trim: true
    },

    // AUDIT METRICS
    ipAddress: {
      type: String,
      default: 'Unknown'
    },
    userAgent: {
      type: String,
      default: 'Unknown'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast timeline queries and date range filters
adminActivityLogSchema.index({ createdAt: -1, module: 1 });
adminActivityLogSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminActivityLog', adminActivityLogSchema);
