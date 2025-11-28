const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  // Rating scores (1-5)
  ratings: {
    accuracy: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    behavior: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    visitTiming: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  // Overall rating (average)
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Review text
  review: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Success/failure impact
  isSuccess: {
    type: Boolean,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
ratingSchema.index({ vendor: 1, createdAt: -1 });
ratingSchema.index({ user: 1 });
// Note: booking field already has unique: true which creates an index automatically

// Calculate overall rating before saving
ratingSchema.pre('save', function(next) {
  const { accuracy, professionalism, behavior, visitTiming } = this.ratings;
  this.overallRating = Math.round(
    ((accuracy + professionalism + behavior + visitTiming) / 4) * 10
  ) / 10; // Round to 1 decimal place
  next();
});

module.exports = mongoose.model('Rating', ratingSchema);

