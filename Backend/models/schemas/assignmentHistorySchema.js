const mongoose = require('mongoose');

const assignmentHistoryRecordSchema = new mongoose.Schema({
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  assignedToName: {
    type: String,
    required: true
  },
  assignedToRole: {
    type: String,
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  reassignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  reassignedByName: {
    type: String,
    default: 'SYSTEM_AUTO_ASSIGN'
  },
  reassignmentReason: {
    type: String,
    default: null
  },
  statusAtAssignment: {
    type: String,
    default: 'PENDING'
  },
  notes: {
    type: String,
    default: ''
  }
}, { _id: true });

module.exports = assignmentHistoryRecordSchema;
