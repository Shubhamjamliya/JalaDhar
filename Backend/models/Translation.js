const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    enum: ['common', 'auth', 'nav', 'booking', 'vendor', 'dashboard', 'payment', 'policy', 'dispute', 'general'],
    default: 'general',
    index: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  // Map of language code -> translated text
  // e.g. { en: "Home", hi: "होम", te: "హోమ్", ta: "முகப்பு", kn: "ಹೋಮ್", mr: "होम", or: "ହୋମ୍" }
  translations: {
    type: Map,
    of: String,
    default: {}
  },
  lastTranslatedBy: {
    type: Map,
    of: String, // 'google-api' | 'admin' | 'default'
    default: {}
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Translation', translationSchema);
