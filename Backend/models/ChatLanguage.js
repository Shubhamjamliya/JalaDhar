const mongoose = require('mongoose');

/**
 * ChatLanguage Model
 *
 * Stores the complete per-language chatbot configuration dynamically.
 * Each document represents ONE language (e.g. te, hi, ta, kn…).
 * The admin can add/edit any language without changing application code.
 *
 * Structure per language:
 *   - meta          : name, native name, unicode script range (for auto-detection)
 *   - greetings     : list of greeting words/phrases in this language
 *   - i18n          : template strings for chatbot replies (greeting, activeBooking, etc.)
 *   - buttons       : localized labels for the quick-action buttons
 *   - links         : localized link text for bottom navigation links
 *   - cards         : per card-key translations (title, description, actionLabel)
 *   - buttonLabels  : card button label translations (Pay Now → ఇప్పుడే చెల్లించండి)
 *   - synonyms      : keyword → [synonym list] for fuzzy card matching
 *   - scriptRange   : Unicode hex range used to auto-detect script (e.g. "0C00-0C7F" for Telugu)
 */

// ── Sub-schemas ──────────────────────────────────────────────────────────────

const i18nStringsSchema = new mongoose.Schema({
  greeting:       { type: String, default: '' },   // Template: use {name} placeholder
  activeBooking:  { type: String, default: '' },
  pastBooking:    { type: String, default: '' },
  historyCount:   { type: String, default: '' },   // Template: use {name} and {count}
  zeroBookings:   { type: String, default: '' },
  activeTag:      { type: String, default: '' },
  completedTag:   { type: String, default: '' },
  trackExpertBtn: { type: String, default: '' },   // Used in booking card primary label
  downloadReport: { type: String, default: '' },   // Used in completed booking card
  bookSurveyTitle:{ type: String, default: '' },   // Zero-booking card title
  bookSurveyDesc: { type: String, default: '' },   // Zero-booking card description
  bookSurveyBtn:  { type: String, default: '' }    // Zero-booking card button label
}, { _id: false });

const cardTranslationSchema = new mongoose.Schema({
  cardKey:     { type: String, required: true },  // e.g. "payment", "my booking"
  title:       { type: String, default: '' },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: '' }
}, { _id: false });

const synonymGroupSchema = new mongoose.Schema({
  cardKey:  { type: String, required: true },  // e.g. "payment"
  keywords: { type: [String], default: [] }    // keywords in this language that map to this card
}, { _id: false });

// ── Main schema ───────────────────────────────────────────────────────────────

const chatLanguageSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
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
  isEnabled: {
    type: Boolean,
    default: true
  },
  isRTL: {
    type: Boolean,
    default: false
  },

  /**
   * Unicode script range used for automatic language detection from typed text.
   * Stored as a regex-compatible string, e.g. "\\u0C00-\\u0C7F"
   * Leave empty for languages that share scripts (e.g. Marathi uses Devanagari like Hindi).
   */
  scriptRange: {
    type: String,
    default: ''
  },

  /**
   * List of greeting words/phrases in this language.
   * The chatbot checks incoming messages against all enabled languages' greeting lists.
   */
  greetings: {
    type: [String],
    default: []
  },

  /**
   * Quick-action button labels shown below chatbot messages.
   * Order matters — these appear as clickable chips.
   */
  buttons: {
    type: [String],
    default: []
  },

  /**
   * Bottom navigation links shown in greeting / booking responses.
   * Each item: { text: String, url: String }
   */
  links: {
    type: [{ text: String, url: String }],
    default: []
  },

  /**
   * Template strings for chatbot reply messages.
   * Use {name} and {count} as interpolation placeholders.
   */
  i18n: {
    type: i18nStringsSchema,
    default: () => ({})
  },

  /**
   * Per-card localized translations: title, description, actionLabel.
   * cardKey must match a key in the static SPECIFICATION_ACTION_CARDS base (e.g. "payment", "my booking").
   */
  cardTranslations: {
    type: [cardTranslationSchema],
    default: []
  },

  /**
   * Localized labels for the shared button set (e.g. "Pay Now" -> localized label).
   * Stored as a plain object map.
   */
  buttonLabelMap: {
    type: Map,
    of: String,
    default: {}
  },

  /**
   * Keyword synonyms per card for fuzzy matching in this language.
   * cardKey -> [list of synonyms in this language]
   */
  synonyms: {
    type: [synonymGroupSchema],
    default: []
  },

  /**
   * Contextual inference keywords (for inferActionCardFromContext).
   * category -> [list of keywords in this language that hint at that category]
   * categories: payment, track, report, booking, dispute
   */
  inferenceKeywords: {
    type: Map,
    of: [String],
    default: {}
  },

  /**
   * History / date-query keywords that trigger Ollama pass-through for this language.
   */
  dateContextKeywords: {
    type: [String],
    default: []
  },

  /**
   * History-query detection keywords in this language.
   */
  historyKeywords: {
    type: [String],
    default: []
  },

  /**
   * Booking-query detection keywords in this language.
   */
  bookingKeywords: {
    type: [String],
    default: []
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatLanguage', chatLanguageSchema);
