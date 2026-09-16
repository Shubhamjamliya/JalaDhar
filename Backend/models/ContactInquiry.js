const mongoose = require('mongoose');

const contactInquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    maxlength: [15, 'Mobile number cannot exceed 15 characters']
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    trim: true,
    lowercase: true,
    maxlength: [120, 'Email cannot exceed 120 characters']
  },
  userType: {
    type: String,
    enum: ['Customer / User', 'Groundwater Expert', 'Business / Organization', 'Other'],
    default: 'Customer / User'
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['NEW', 'CONTACTED', 'RESOLVED'],
    default: 'NEW'
  },
  adminNotes: {
    type: String,
    default: '',
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  respondedAt: {
    type: Date,
    default: null
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for fast searching & filtering
contactInquirySchema.index({ status: 1, createdAt: -1 });
contactInquirySchema.index({ email: 1 });
contactInquirySchema.index({ mobile: 1 });
contactInquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('ContactInquiry', contactInquirySchema);
