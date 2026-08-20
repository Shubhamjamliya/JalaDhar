const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: [
      'ADMIN',
      'SUPER_ADMIN',
      'EXPERT_VERIFICATION_ADMIN',
      'VERIFIER_ADMIN',
      'OPERATIONS_ADMIN',
      'FINANCE_ADMIN',
      'SUPPORT_ADMIN',
      'QC_ADMIN'
    ],
    default: 'ADMIN'
  },
  department: {
    type: String,
    enum: ['GENERAL', 'VERIFICATION', 'OPERATIONS', 'FINANCE', 'SUPPORT', 'QUALITY_CONTROL', 'SUPER'],
    default: 'GENERAL'
  },
  permissions: {
    type: [String],
    default: ['all']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Workload distribution toggle: Controls whether new requests are auto-assigned to this admin
  isAvailableForAssignment: {
    type: Boolean,
    default: true
  },
  // Active workload counter: Tracks open/in-progress tickets assigned to this admin
  activeTicketsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastAssignedAt: {
    type: Date,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data before sending JSON
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);

