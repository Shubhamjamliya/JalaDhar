const mongoose = require('mongoose');

const languageItemSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  nativeName: {
    type: String,
    required: true,
    trim: true
  },
  badge: {
    type: String,
    trim: true,
    default: ''
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isRTL: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { _id: false });

const languageConfigSchema = new mongoose.Schema({
  configKey: {
    type: String,
    required: true,
    unique: true,
    default: 'PRIMARY_LANGUAGE_CONFIG'
  },
  isLanguageEnabled: {
    type: Boolean,
    default: true
  },
  defaultLanguage: {
    type: String,
    default: 'en'
  },
  supportedLanguages: {
    type: [languageItemSchema],
    default: [
      { code: 'en', name: 'English', nativeName: 'English', badge: 'EN', isEnabled: true, isDefault: true, sortOrder: 1 },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', badge: 'हिं', isEnabled: true, isDefault: false, sortOrder: 2 },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', badge: 'తె', isEnabled: true, isDefault: false, sortOrder: 3 },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', badge: 'த', isEnabled: true, isDefault: false, sortOrder: 4 },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', badge: 'ಕ', isEnabled: true, isDefault: false, sortOrder: 5 },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', badge: 'म', isEnabled: true, isDefault: false, sortOrder: 6 },
      { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', badge: 'ଓ', isEnabled: true, isDefault: false, sortOrder: 7 },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', badge: 'বা', isEnabled: false, isDefault: false, sortOrder: 8 },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', badge: 'ગુ', isEnabled: false, isDefault: false, sortOrder: 9 },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', badge: 'ਪੰ', isEnabled: false, isDefault: false, sortOrder: 10 },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', badge: 'മ', isEnabled: false, isDefault: false, sortOrder: 11 }
    ]
  },
  translationProvider: {
    type: String,
    enum: ['auto', 'google-cloud', 'free-google', 'custom'],
    default: 'auto'
  },
  googleApiKey: {
    type: String,
    trim: true,
    default: ''
  },
  autoTranslateMissing: {
    type: Boolean,
    default: true
  },
  lastTestedAt: {
    type: Date,
    default: null
  },
  lastApiStatus: {
    type: String,
    enum: ['connected', 'error', 'untested'],
    default: 'untested'
  },
  lastApiMessage: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LanguageConfig', languageConfigSchema);
