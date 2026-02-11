const mongoose = require('mongoose');

const vendorDocumentSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor is required'],
    index: true
  },
  documentType: {
    type: String,
    enum: ['AADHAR', 'PAN', 'CERTIFICATE', 'CHEQUE', 'PROFILE_PICTURE', 'GROUNDWATER_REG', 'TRAINING_CERTIFICATE'],
    required: [true, 'Document type is required'],
    index: true
  },
  url: {
    type: String,
    required: [true, 'Document URL is required']
  },
  publicId: {
    type: String,
    required: [true, 'Public ID is required']
  },
  name: {
    type: String,
    trim: true,
    default: null // For certificates, profile pictures
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING',
    index: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
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
  expiresAt: {
    type: Date,
    default: null // For time-sensitive documents
  },
  version: {
    type: Number,
    default: 1 // Track document updates
  },
  isActive: {
    type: Boolean,
    default: true // For soft delete
  },
  // For certificates - additional info
  certificateName: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
vendorDocumentSchema.index({ vendor: 1, documentType: 1 });
vendorDocumentSchema.index({ vendor: 1, status: 1 });
vendorDocumentSchema.index({ status: 1, documentType: 1 });
vendorDocumentSchema.index({ expiresAt: 1 }); // For finding expired documents

// Compound index for finding active documents by vendor and type
vendorDocumentSchema.index({ vendor: 1, documentType: 1, isActive: 1, status: 1 });

module.exports = mongoose.model('VendorDocument', vendorDocumentSchema);

