const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['number', 'string', 'boolean', 'json'],
    default: 'string'
  },
  category: {
    type: String,
    enum: ['pricing', 'general', 'payment', 'notification', 'billing', 'policy'],
    default: 'general'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Note: key field already has unique: true which creates an index automatically
// No need to add explicit index here

module.exports = mongoose.model('Settings', settingsSchema);

