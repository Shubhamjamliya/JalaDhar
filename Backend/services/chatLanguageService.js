/**
 * chatLanguageService.js
 *
 * Dynamic language configuration loader for the support chatbot.
 *
 * Instead of reading hardcoded maps, this service fetches ChatLanguage documents
 * from MongoDB and builds all runtime structures the chatbot needs:
 *   - Language metadata  (name, native name, enabled state)
 *   - Script detection regex (auto-detects typed language from Unicode ranges)
 *   - Greeting word sets  (per language)
 *   - i18n template functions  (greeting, activeBooking, historyCount, etc.)
 *   - Button label maps  (localized button chips)
 *   - Card translations  (per action card, per language)
 *   - Synonym maps  (fuzzy keyword → card key matching)
 *   - Inference keywords  (context-based card suggestion)
 *   - Date/history/booking query keywords
 *
 * All data is cached in-process with a configurable TTL so that DB reads happen
 * infrequently (default: 5 minutes) and the chatbot stays fast.
 * Call invalidateCache() after any admin language edit to force an immediate reload.
 */

const ChatLanguage = require('../models/ChatLanguage');

// ── Cache ─────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _cache = null;
let _cacheExpiry = 0;

/**
 * Force the cache to be cleared on the next read.
 * Call this from the admin language controller after any update.
 */
const invalidateCache = () => {
  _cache = null;
  _cacheExpiry = 0;
  console.log('[ChatLanguageService] Cache invalidated — will reload on next request.');
};

// ── Template interpolation ────────────────────────────────────────────────────

/**
 * Converts a DB template string into a callable function.
 *
 * Template tokens:
 *   {name}  → replaced with the user's name (or '' if absent)
 *   {count} → replaced with a numeric count string
 *
 * The DB stores: "Hello{name}! How can I help?"
 * The function call interpolates at runtime.
 */
const buildTemplate = (template = '') => {
  return (name, count) => {
    let result = template;
    // Insert name with a leading space if it is non-empty
    result = result.replace('{name}', name ? ` ${name}` : '');
    if (count !== undefined) {
      result = result.replace('{count}', String(count));
    }
    return result;
  };
};

// ── Script detection cache ────────────────────────────────────────────────────

/**
 * Build an ordered list of { code, regex } pairs from DB scriptRange values.
 * Languages with empty scriptRange are skipped (they share a script with another).
 */
const buildScriptDetectors = (languages) => {
  const detectors = [];
  for (const lang of languages) {
    if (!lang.scriptRange || !lang.isEnabled) continue;
    try {
      // scriptRange stored as e.g. "\\u0C00-\\u0C7F"  →  need to unescape
      const rangeStr = lang.scriptRange.replace(/\\u/g, '\\u');
      const regex = new RegExp(`[${rangeStr}]`);
      detectors.push({ code: lang.code, regex });
    } catch (e) {
      console.warn(`[ChatLanguageService] Invalid scriptRange for ${lang.code}:`, lang.scriptRange);
    }
  }
  return detectors;
};

// ── Main loader ───────────────────────────────────────────────────────────────

/**
 * Load all enabled ChatLanguage documents and assemble runtime structures.
 * Returns a fully built config object that replaces all hardcoded maps.
 */
const loadConfig = async () => {
  const now = Date.now();
  if (_cache && now < _cacheExpiry) {
    return _cache;
  }

  console.log('[ChatLanguageService] Loading language config from DB…');

  let languages = [];
  try {
    languages = await ChatLanguage.find({}).lean();
  } catch (err) {
    console.error('[ChatLanguageService] DB read failed:', err.message);
    // If DB is unavailable and we have a stale cache, keep using it
    if (_cache) {
      console.warn('[ChatLanguageService] Using stale cache due to DB error.');
      return _cache;
    }
    // Otherwise return an empty but safe config
    return buildEmptyConfig();
  }

  if (!languages || languages.length === 0) {
    console.warn('[ChatLanguageService] No ChatLanguage documents found in DB. Using fallback config.');
    if (_cache) return _cache;
    return buildEmptyConfig();
  }

  // ── Assemble structures ───────────────────────────────────────────────────

  // 1. LANGUAGE_CONFIG: { en: { name, native }, te: { name, native }, … }
  const LANGUAGE_CONFIG = {};
  for (const lang of languages) {
    LANGUAGE_CONFIG[lang.code] = { name: lang.name, native: lang.nativeName };
  }

  // 2. Script detectors (ordered, most-specific first)
  const scriptDetectors = buildScriptDetectors(languages);

  // 3. All greetings (flat list for quick exact/includes match)
  const ALL_GREETINGS = new Set([
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'help'
  ]);
  const GREETINGS_BY_LANG = {};
  for (const lang of languages) {
    if (!lang.isEnabled) continue;
    GREETINGS_BY_LANG[lang.code] = new Set((lang.greetings || []).map(g => g.toLowerCase()));
    for (const g of lang.greetings || []) {
      ALL_GREETINGS.add(g.toLowerCase());
    }
  }

  // 4. I18N functions per language
  const I18N = {};
  for (const lang of languages) {
    const raw = lang.i18n || {};
    I18N[lang.code] = {
      greeting:        buildTemplate(raw.greeting        || 'Hello{name}! How can I assist you today?'),
      activeBooking:   buildTemplate(raw.activeBooking   || 'Hello{name}! I found an active booking:'),
      pastBooking:     buildTemplate(raw.pastBooking     || 'Hello{name}! Here is your most recent completed survey:'),
      historyCount:    buildTemplate(raw.historyCount    || 'Hello{name}! You have {count} survey record(s).'),
      zeroBookings:    buildTemplate(raw.zeroBookings    || "Hello{name}! You don't have any surveys booked yet."),
      activeTag:       raw.activeTag       || 'Active Booking',
      completedTag:    raw.completedTag    || 'Completed Survey',
      trackExpertBtn:  raw.trackExpertBtn  || 'Track Expert Live',
      downloadReport:  raw.downloadReport  || 'Download Survey Report',
      bookSurveyTitle: raw.bookSurveyTitle || 'Book a Groundwater Survey',
      bookSurveyDesc:  raw.bookSurveyDesc  || 'Certified hydrogeologists available for your survey.',
      bookSurveyBtn:   raw.bookSurveyBtn   || 'Book Survey Now',
      buttons: lang.buttons || ['My Booking', 'Payment', 'My Report', 'Track Expert'],
      links:   lang.links   || [
        { text: 'View Bookings',   url: '/user/status' },
        { text: 'Survey Reports',  url: '/user/survey-reports' }
      ]
    };
  }
  // Fallback to English if a requested language is not in DB
  if (!I18N.en) {
    I18N.en = buildDefaultEnglishI18N();
  }

  // 5. Card translations: { cardKey: { langCode: { title, description, actionLabel } } }
  //    Structure: CARD_TRANSLATIONS['payment']['te'] = { title, description, actionLabel }
  const CARD_TRANSLATIONS = {};
  for (const lang of languages) {
    for (const ct of lang.cardTranslations || []) {
      if (!CARD_TRANSLATIONS[ct.cardKey]) CARD_TRANSLATIONS[ct.cardKey] = {};
      CARD_TRANSLATIONS[ct.cardKey][lang.code] = {
        title:       ct.title       || '',
        description: ct.description || '',
        actionLabel: ct.actionLabel || ''
      };
    }
  }

  // 6. Button label maps: { langCode: { 'Pay Now': 'ఇప్పుడే చెల్లించండి', … } }
  const BUTTON_LABEL_MAPS = {};
  for (const lang of languages) {
    if (lang.buttonLabelMap && typeof lang.buttonLabelMap === 'object') {
      BUTTON_LABEL_MAPS[lang.code] = Object.fromEntries(
        lang.buttonLabelMap instanceof Map
          ? lang.buttonLabelMap
          : Object.entries(lang.buttonLabelMap)
      );
    } else {
      BUTTON_LABEL_MAPS[lang.code] = {};
    }
  }

  // 7. Synonyms: { cardKey: Set<string> } — merged across ALL languages
  //    (used in findSpecificationCard which checks any language's synonyms)
  const SYNONYMS_BY_CARD = {};
  for (const lang of languages) {
    for (const sg of lang.synonyms || []) {
      if (!SYNONYMS_BY_CARD[sg.cardKey]) SYNONYMS_BY_CARD[sg.cardKey] = new Set();
      for (const kw of sg.keywords || []) {
        SYNONYMS_BY_CARD[sg.cardKey].add(kw.toLowerCase());
      }
    }
  }

  // 8. Inference keywords: { category: Set<string> } — merged across all languages
  const INFERENCE_KEYWORDS = {
    payment:  new Set(['pay', 'invoice', 'bill']),
    track:    new Set(['track', 'expert', 'location']),
    report:   new Set(['report', 'pdf', 'download']),
    booking:  new Set(['booking', 'schedule', 'appointment']),
    dispute:  new Set(['dispute', 'problem', 'issue', 'complaint'])
  };
  for (const lang of languages) {
    const ikMap = lang.inferenceKeywords instanceof Map
      ? lang.inferenceKeywords
      : new Map(Object.entries(lang.inferenceKeywords || {}));
    for (const [cat, kwList] of ikMap.entries()) {
      if (!INFERENCE_KEYWORDS[cat]) INFERENCE_KEYWORDS[cat] = new Set();
      for (const kw of kwList || []) {
        INFERENCE_KEYWORDS[cat].add(kw.toLowerCase());
      }
    }
  }

  // 9. Date context, history, booking keywords — merged across all enabled languages
  const DATE_CONTEXT_KEYWORDS = new Set([
    'january','february','march','april','may','june','july','august',
    'september','october','november','december',
    'jan','feb','mar','apr','jun','jul','aug','sep','oct','nov','dec',
    'this month','last month','this week','today','yesterday'
  ]);
  const HISTORY_KEYWORDS = new Set([
    'history', 'past booking', 'previous booking', 'completed survey'
  ]);
  const BOOKING_KEYWORDS = new Set([
    'my booking', 'current booking', 'active booking', 'booking status',
    'who is my expert', 'my survey', 'view booking'
  ]);

  for (const lang of languages) {
    if (!lang.isEnabled) continue;
    for (const kw of lang.dateContextKeywords  || []) DATE_CONTEXT_KEYWORDS.add(kw.toLowerCase());
    for (const kw of lang.historyKeywords       || []) HISTORY_KEYWORDS.add(kw.toLowerCase());
    for (const kw of lang.bookingKeywords       || []) BOOKING_KEYWORDS.add(kw.toLowerCase());
  }

  _cache = {
    LANGUAGE_CONFIG,
    scriptDetectors,
    ALL_GREETINGS,
    GREETINGS_BY_LANG,
    I18N,
    CARD_TRANSLATIONS,
    BUTTON_LABEL_MAPS,
    SYNONYMS_BY_CARD,
    INFERENCE_KEYWORDS,
    DATE_CONTEXT_KEYWORDS,
    HISTORY_KEYWORDS,
    BOOKING_KEYWORDS,
    enabledLanguageCodes: languages.filter(l => l.isEnabled).map(l => l.code)
  };
  _cacheExpiry = now + CACHE_TTL_MS;

  console.log(`[ChatLanguageService] Loaded ${languages.length} language configs from DB. Cache valid for ${CACHE_TTL_MS / 1000}s.`);
  return _cache;
};

// ── Runtime helpers ───────────────────────────────────────────────────────────

/**
 * Detect script language from Unicode character ranges stored in DB.
 * Returns language code (e.g. 'te') or null if no match.
 */
const detectScriptLanguage = async (text = '') => {
  if (!text || typeof text !== 'string') return null;
  const config = await loadConfig();
  for (const detector of config.scriptDetectors) {
    if (detector.regex.test(text)) return detector.code;
  }
  return null;
};

/**
 * Detect script language synchronously using the cached config.
 * Falls back to null if cache is empty (first call — use detectScriptLanguage async instead).
 */
const detectScriptLanguageSync = (text = '') => {
  if (!text || typeof text !== 'string') return null;
  if (!_cache) return null;
  for (const detector of _cache.scriptDetectors) {
    if (detector.regex.test(text)) return detector.code;
  }
  return null;
};

/**
 * Check if a message is a greeting in any enabled language.
 */
const isGreeting = (msg, config) => {
  const clean = (msg || '').toLowerCase().trim();
  const stripped = clean.replace(/[!?.,;:]/g, '').trim();
  return config.ALL_GREETINGS.has(clean) || config.ALL_GREETINGS.has(stripped);
};

/**
 * Get i18n strings for a language, falling back to English.
 */
const getI18N = (langKey, config) => {
  return config.I18N[langKey] || config.I18N.en || buildDefaultEnglishI18N();
};

/**
 * Get localized card translations for a given cardKey and langKey.
 * Falls back through: langKey → en → empty strings.
 */
const getCardTranslation = (cardKey, langKey, config) => {
  const cardMap = config.CARD_TRANSLATIONS[cardKey] || {};
  return cardMap[langKey] || cardMap.en || { title: '', description: '', actionLabel: '' };
};

/**
 * Translate button labels using the DB-loaded button label map.
 * For unknown languages, returns the original English button label.
 */
const translateButtons = (buttons, langKey, config) => {
  const labelMap = config.BUTTON_LABEL_MAPS[langKey] || {};
  return (buttons || []).map(b => labelMap[b] || b);
};

// ── Fallbacks ─────────────────────────────────────────────────────────────────

const buildDefaultEnglishI18N = () => ({
  greeting:        (name)         => `Hello${name ? ` ${name}` : ''}! How can I assist you with your groundwater survey today?`,
  activeBooking:   (name)         => `Hello${name ? ` ${name}` : ''}! I found an active survey booking scheduled for your account:`,
  pastBooking:     (name)         => `Hello${name ? ` ${name}` : ''}! You do not have an active survey right now, but here is your most recent completed survey:`,
  historyCount:    (name, count)  => `Hello${name ? ` ${name}` : ''}! You have ${count} groundwater survey record(s) in your account. Showing all below:`,
  zeroBookings:    (name)         => `Hello${name ? ` ${name}` : ''}! You don't have any groundwater survey appointments booked yet.`,
  activeTag:       'Active Booking',
  completedTag:    'Completed Survey',
  trackExpertBtn:  'Track Expert Live',
  downloadReport:  'Download Survey Report',
  bookSurveyTitle: 'Book a Groundwater Survey',
  bookSurveyDesc:  'Certified hydrogeologists with advanced geophysical equipment.',
  bookSurveyBtn:   'Book Survey Now',
  buttons: ['My Booking', 'Payment', 'My Report', 'Track Expert'],
  links: [
    { text: 'View Bookings',  url: '/user/status' },
    { text: 'Survey Reports', url: '/user/survey-reports' }
  ]
});

const buildEmptyConfig = () => ({
  LANGUAGE_CONFIG:      { en: { name: 'English', native: 'English' } },
  scriptDetectors:      [],
  ALL_GREETINGS:        new Set(['hello', 'hi', 'hey', 'help']),
  GREETINGS_BY_LANG:    {},
  I18N:                 { en: buildDefaultEnglishI18N() },
  CARD_TRANSLATIONS:    {},
  BUTTON_LABEL_MAPS:    {},
  SYNONYMS_BY_CARD:     {},
  INFERENCE_KEYWORDS:   { payment: new Set(['pay']), track: new Set(['track']), report: new Set(['report']), booking: new Set(['booking']), dispute: new Set(['dispute']) },
  DATE_CONTEXT_KEYWORDS: new Set(['today', 'yesterday', 'this month', 'last month']),
  HISTORY_KEYWORDS:     new Set(['history', 'past booking']),
  BOOKING_KEYWORDS:     new Set(['my booking']),
  enabledLanguageCodes: ['en']
});

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  loadConfig,
  invalidateCache,
  detectScriptLanguage,
  detectScriptLanguageSync,
  isGreeting,
  getI18N,
  getCardTranslation,
  translateButtons,
  buildDefaultEnglishI18N
};
