const LanguageConfig = require('../models/LanguageConfig');
const Translation = require('../models/Translation');
const translationService = require('../services/translationService');
const { getIO } = require('../sockets');

// Broadcast language config updates instantly via WebSocket to all connected clients
const broadcastLanguageConfigUpdate = (config) => {
  try {
    const io = getIO();
    if (io) {
      const enabledLanguages = (config.supportedLanguages || []).filter(l => l.isEnabled);
      const payload = {
        isLanguageEnabled: config.isLanguageEnabled,
        defaultLanguage: config.defaultLanguage || 'en',
        supportedLanguages: enabledLanguages
      };
      io.emit('LANGUAGE_CONFIG_UPDATED', payload);
      io.emit('language_config_updated', payload);
    }
  } catch (e) {
    // Socket might not be initialized yet in tests
  }
};

// Seed data with default vocabulary
const DEFAULT_TRANSLATIONS_SEED = [
  // Auth
  { key: 'userLogin', category: 'auth', en: 'User Login', description: 'Header for user login page' },
  { key: 'createAccount', category: 'auth', en: 'Create Account', description: 'Signup page title and buttons' },
  { key: 'welcomeBackLogin', category: 'auth', en: 'Welcome back! Please login to your account.', description: 'Login subheader' },
  { key: 'createAccountHeader', category: 'auth', en: 'Create your account to book professional groundwater surveys.', description: 'Signup subheader' },
  { key: 'mobileNumber', category: 'auth', en: 'Mobile Number', description: 'Mobile input label' },
  { key: 'fullName', category: 'auth', en: 'Full Name', description: 'Name input label' },
  { key: 'emailOptional', category: 'auth', en: 'Email Address (Optional)', description: 'Email input placeholder' },
  { key: 'sendOtp', category: 'auth', en: 'Send OTP', description: 'Button text to send OTP' },
  { key: 'continue', category: 'common', en: 'Continue', description: 'General continue action' },
  { key: 'agreeTerms', category: 'auth', en: 'I agree to the Terms & Conditions and Privacy Policy', description: 'Terms checkbox text' },
  { key: 'verifyMobileOtp', category: 'auth', en: 'Verify Mobile OTP', description: 'OTP screen header' },
  { key: 'verifyLogin', category: 'auth', en: 'Verify & Login', description: 'OTP verify button for login' },
  { key: 'verifyAndCreateAccount', category: 'auth', en: 'Verify & Create Account', description: 'OTP verify button for registration' },
  { key: 'alreadyHaveAccount', category: 'auth', en: 'Already have an account?', description: 'Link to login' },
  { key: 'dontHaveAccount', category: 'auth', en: "Don't have an account?", description: 'Link to signup' },
  { key: 'backToLogin', category: 'auth', en: 'Back to Login', description: 'Back button text' },
  { key: 'editDetails', category: 'auth', en: 'Edit Details', description: 'Edit phone number button' },
  { key: 'signUp', category: 'auth', en: 'Sign Up', description: 'Sign up text' },
  { key: 'login', category: 'auth', en: 'Log In', description: 'Login action text' },
  { key: 'resendOtp', category: 'auth', en: 'Resend OTP', description: 'Resend OTP button' },
  { key: 'resendIn', category: 'auth', en: 'Resend in', description: 'Countdown timer text' },
  { key: 'loginOtpSentTo', category: 'auth', en: 'Login OTP sent to', description: 'Sent OTP alert' },
  { key: 'verificationOtpSentTo', category: 'auth', en: 'Verification OTP sent to', description: 'Sent OTP verification alert' },

  // Navigation
  { key: 'home', category: 'nav', en: 'Home', description: 'Navbar home tab' },
  { key: 'bookings', category: 'nav', en: 'Bookings', description: 'Navbar bookings tab' },
  { key: 'book', category: 'nav', en: 'Book', description: 'Action to book survey' },
  { key: 'wallet', category: 'nav', en: 'Wallet', description: 'Wallet balance tab' },
  { key: 'profile', category: 'nav', en: 'Profile', description: 'Profile tab' },
  { key: 'settings', category: 'nav', en: 'Settings', description: 'Settings tab' },
  { key: 'notifications', category: 'nav', en: 'Notifications', description: 'Notifications header' },
  { key: 'helpSupport', category: 'nav', en: 'Help & Support', description: 'Support menu item' },
  { key: 'logout', category: 'nav', en: 'Logout', description: 'Sign out action' },

  // Dashboard & Booking
  { key: 'welcomeBack', category: 'dashboard', en: 'Welcome back', description: 'Greeting on dashboard' },
  { key: 'indiaFirstPlatform', category: 'dashboard', en: "India's 1st Groundwater Survey Booking Platform", description: 'Platform tagline' },
  { key: 'findExpertsDesc', category: 'dashboard', en: 'Find verified groundwater survey experts and book your survey.', description: 'Dashboard hero subtitle' },
  { key: 'surveyPurpose', category: 'booking', en: 'Survey Purpose', description: 'Category selection title' },
  { key: 'selectSiteCategory', category: 'booking', en: 'Select your site category to begin survey booking.', description: 'Category selection subtitle' },
  { key: 'agriculture', category: 'booking', en: 'Agriculture', description: 'Survey category: agriculture' },
  { key: 'household', category: 'booking', en: 'Household', description: 'Survey category: household' },
  { key: 'commercial', category: 'booking', en: 'Commercial', description: 'Survey category: commercial' },
  { key: 'industrial', category: 'booking', en: 'Industrial', description: 'Survey category: industrial' },
  { key: 'quickAccess', category: 'dashboard', en: 'Quick Access', description: 'Quick access card section' },
  { key: 'bookingStatus', category: 'booking', en: 'Booking Status', description: 'Status card header' },
  { key: 'currentBooking', category: 'booking', en: 'Current Booking', description: 'Active booking label' },
  { key: 'pendingPayments', category: 'payment', en: 'Pending Payments', description: 'Payments section' },
  { key: 'surveyReports', category: 'booking', en: 'Survey Reports', description: 'Survey reports download section' },
  { key: 'updateProfile', category: 'dashboard', en: 'Update Profile', description: 'Profile update button' },
  { key: 'topExpertsNearYou', category: 'dashboard', en: 'Top "Verified" Groundwater Experts Near You', description: 'Nearby experts header' },
  { key: 'certifiedSpecialists', category: 'dashboard', en: 'Certified groundwater survey specialists available for dispatch.', description: 'Experts section subtitle' },
  { key: 'bookNow', category: 'booking', en: 'Book Survey Now', description: 'Primary CTA button' },
  { key: 'viewDetails', category: 'common', en: 'View Details', description: 'Button to view item details' },
  { key: 'cancel', category: 'common', en: 'Cancel', description: 'Cancel action' },
  { key: 'saveChanges', category: 'common', en: 'Save Changes', description: 'Save button' },
  { key: 'advancePayment', category: 'payment', en: 'Advance Payment', description: 'First installment payment' },
  { key: 'finalPayment', category: 'payment', en: 'Final Payment', description: 'Second installment payment' },
  { key: 'payNow', category: 'payment', en: 'Pay Now', description: 'Pay action button' },
  { key: 'borewellPoints', category: 'booking', en: 'Borewell Drilling Points', description: 'Identified borewell locations' },
  { key: 'expectedWaterYield', category: 'booking', en: 'Expected Water Yield', description: 'Water yield measurement' },
  { key: 'estimatedDepth', category: 'booking', en: 'Estimated Depth (feet)', description: 'Estimated drilling depth' },
  { key: 'downloadReport', category: 'booking', en: 'Download Survey Report', description: 'PDF report download button' },
  { key: 'rateExpert', category: 'booking', en: 'Rate & Review Expert', description: 'Rating prompt' },
  { key: 'disputeRaise', category: 'dispute', en: 'Raise a Dispute', description: 'Dispute button' },
  { key: 'language', category: 'common', en: 'Language', description: 'Language picker title' },
  { key: 'changeLanguage', category: 'common', en: 'Change Language', description: 'Language selector trigger' },
  { key: 'selectLanguage', category: 'common', en: 'Select Language', description: 'Language modal title' }
];

/**
 * Initialize default language configuration and seed dictionary in MongoDB
 */
const initializeLanguageSystem = async () => {
  try {
    let config = await LanguageConfig.findOne({ configKey: 'PRIMARY_LANGUAGE_CONFIG' });
    if (!config) {
      config = await LanguageConfig.create({
        configKey: 'PRIMARY_LANGUAGE_CONFIG',
        isLanguageEnabled: true,
        defaultLanguage: 'en',
        translationProvider: 'auto',
        googleApiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyC2UW5-Nt9KidxOfBRrZImeBRh9SOMGluo'
      });
      console.log('[LanguageSystem] Initialized primary language config');
    }

    // Seed default translation dictionary if missing
    for (const item of DEFAULT_TRANSLATIONS_SEED) {
      const exists = await Translation.findOne({ key: item.key });
      if (!exists) {
        const transMap = new Map();
        transMap.set('en', item.en);
        
        await Translation.create({
          key: item.key,
          category: item.category || 'general',
          description: item.description || '',
          translations: transMap,
          lastTranslatedBy: { en: 'default' }
        });
      }
    }
    console.log(`[LanguageSystem] Verified ${DEFAULT_TRANSLATIONS_SEED.length} core translation keys`);
  } catch (err) {
    console.error('[LanguageSystem] Initialization error:', err.message);
  }
};

/**
 * GET /api/languages/config
 * Public: Get active languages and platform language enablement
 */
const getPublicConfig = async (req, res) => {
  try {
    let config = await LanguageConfig.findOne({ configKey: 'PRIMARY_LANGUAGE_CONFIG' });
    if (!config) {
      await initializeLanguageSystem();
      config = await LanguageConfig.findOne({ configKey: 'PRIMARY_LANGUAGE_CONFIG' });
    }

    const enabledLanguages = (config.supportedLanguages || []).filter(l => l.isEnabled);

    res.json({
      success: true,
      data: {
        isLanguageEnabled: config.isLanguageEnabled,
        defaultLanguage: config.defaultLanguage || 'en',
        supportedLanguages: enabledLanguages
      }
    });
  } catch (err) {
    console.error('Get public language config error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve language configuration', error: err.message });
  }
};

/**
 * GET /api/languages/translations/:lang
 * Public: Get key-value translations for a specific language
 */
const getLanguageDictionary = async (req, res) => {
  try {
    const lang = (req.params.lang || 'en').toLowerCase().trim();
    let translations = await Translation.find({});

    if (translations.length === 0) {
      await initializeLanguageSystem();
      translations = await Translation.find({});
    }

    const dictionary = {};
    const missingItems = [];

    translations.forEach(item => {
      const trans = item.translations?.get(lang);
      const enText = item.translations?.get('en') || item.key;

      if (trans && trans.trim()) {
        dictionary[item.key] = trans;
      } else if (lang !== 'en' && enText) {
        missingItems.push({ item, enText });
      } else {
        dictionary[item.key] = enText;
      }
    });

    // If there are missing translations for this language, translate them using Google Maps API immediately
    if (missingItems.length > 0 && lang !== 'en') {
      try {
        const textsToTranslate = missingItems.map(m => m.enText);
        const translatedMap = await translationService.batchTranslate(textsToTranslate, lang, 'en');

        for (const { item, enText } of missingItems) {
          const translated = translatedMap[enText] || enText;
          dictionary[item.key] = translated;
          item.translations.set(lang, translated);
          const lastMap = item.lastTranslatedBy || new Map();
          lastMap.set(lang, 'google-api');
          item.lastTranslatedBy = lastMap;
          await item.save();
        }
      } catch (transErr) {
        console.warn(`[getLanguageDictionary] Google translation error for ${lang}:`, transErr.message);
        missingItems.forEach(({ item, enText }) => {
          if (!dictionary[item.key]) dictionary[item.key] = enText;
        });
      }
    }

    res.json({
      success: true,
      data: {
        language: lang,
        translations: dictionary,
        totalKeys: translations.length
      }
    });
  } catch (err) {
    console.error('Get language dictionary error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve translations', error: err.message });
  }
};

/**
 * GET /api/languages/all-translations
 * Public: Get full dictionary mapping for all enabled languages
 */
const getAllTranslations = async (req, res) => {
  try {
    const config = await LanguageConfig.findOne({ configKey: 'PRIMARY_LANGUAGE_CONFIG' });
    const enabledLangs = (config?.supportedLanguages || []).filter(l => l.isEnabled).map(l => l.code);
    if (!enabledLangs.includes('en')) enabledLangs.push('en');

    const translations = await Translation.find({});
    const result = {};

    enabledLangs.forEach(lang => {
      result[lang] = {};
    });

    translations.forEach(item => {
      const enText = item.translations.get('en') || item.key;
      enabledLangs.forEach(lang => {
        const text = item.translations.get(lang);
        result[lang][item.key] = text || enText;
      });
    });

    res.json({
      success: true,
      data: {
        translations: result,
        supportedLanguages: config?.supportedLanguages || []
      }
    });
  } catch (err) {
    console.error('Get all translations error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve all translations', error: err.message });
  }
};

/**
 * POST /api/languages/translate-text
 * Public/Auth: Translate runtime dynamic text using Google API
 */
const translateDynamicText = async (req, res) => {
  try {
    const { text, targetLang, sourceLang = 'en' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text to translate is required' });
    }
    if (!targetLang) {
      return res.status(400).json({ success: false, message: 'Target language is required' });
    }

    const translatedText = await translationService.translateText(text, targetLang, sourceLang);

    res.json({
      success: true,
      data: {
        originalText: text,
        translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      }
    });
  } catch (err) {
    console.error('Translate dynamic text error:', err);
    res.status(500).json({ success: false, message: 'Translation failed', error: err.message });
  }
};

/**
 * GET /api/languages/admin/dictionary
 * Admin: Get complete dictionary matrix with translation completeness and metadata
 */
const getAdminDictionary = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }
    if (search && search.trim()) {
      query.$or = [
        { key: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const config = await LanguageConfig.findOne({ configKey: 'PRIMARY_LANGUAGE_CONFIG' });
    const translations = await Translation.find(query).sort({ category: 1, key: 1 });

    const supportedLanguages = config?.supportedLanguages || [];

    // Transform into clean JSON objects with translations map converted to plain object
    const items = translations.map(t => {
      const obj = {
        _id: t._id,
        key: t.key,
        category: t.category,
        description: t.description,
        translations: Object.fromEntries(t.translations || new Map()),
        lastTranslatedBy: Object.fromEntries(t.lastTranslatedBy || new Map()),
        updatedAt: t.updatedAt
      };
      return obj;
    });

    // Calculate completion stats per language
    const stats = {};
    const totalKeys = await Translation.countDocuments();

    for (const lang of supportedLanguages) {
      const count = await Translation.countDocuments({
        [`translations.${lang.code}`]: { $exists: true, $ne: '' }
      });
      stats[lang.code] = {
        translatedCount: count,
        totalKeys,
        percentage: totalKeys > 0 ? Math.round((count / totalKeys) * 100) : 0
      };
    }

    res.json({
      success: true,
      data: {
        dictionary: items,
        totalCount: items.length,
        stats,
        supportedLanguages,
        config
      }
    });
  } catch (err) {
    console.error('Get admin dictionary error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve dictionary', error: err.message });
  }
};

/**
 * POST /api/languages/admin/config
 * Admin: Update language configuration, API keys, provider, and supported languages
 */
const updateLanguageConfig = async (req, res) => {
  try {
    const {
      isLanguageEnabled,
      defaultLanguage,
      supportedLanguages,
      googleApiKey,
      translationProvider,
      autoTranslateMissing
    } = req.body;

    let config = await LanguageConfig.findOne({ configKey: 'PRIMARY_LANGUAGE_CONFIG' });
    if (!config) {
      config = new LanguageConfig({ configKey: 'PRIMARY_LANGUAGE_CONFIG' });
    }

    if (isLanguageEnabled !== undefined) config.isLanguageEnabled = isLanguageEnabled;
    if (defaultLanguage !== undefined) config.defaultLanguage = defaultLanguage;
    if (Array.isArray(supportedLanguages)) config.supportedLanguages = supportedLanguages;
    if (googleApiKey !== undefined) config.googleApiKey = googleApiKey;
    if (translationProvider !== undefined) config.translationProvider = translationProvider;
    if (autoTranslateMissing !== undefined) config.autoTranslateMissing = autoTranslateMissing;
    config.updatedBy = req.userId || req.user?._id;

    await config.save();
    broadcastLanguageConfigUpdate(config);

    res.json({
      success: true,
      message: 'Language configuration updated successfully',
      data: { config }
    });
  } catch (err) {
    console.error('Update language config error:', err);
    res.status(500).json({ success: false, message: 'Failed to update configuration', error: err.message });
  }
};

/**
 * POST /api/languages/admin/test-google-api
 * Admin: Test Google Translation API connection and view latency/sample output
 */
const testGoogleApi = async (req, res) => {
  try {
    const { googleApiKey, translationProvider } = req.body;
    const testResult = await translationService.testGoogleApiConnection(googleApiKey, translationProvider);

    // Save test result status in LanguageConfig
    await LanguageConfig.findOneAndUpdate(
      { configKey: 'PRIMARY_LANGUAGE_CONFIG' },
      {
        lastTestedAt: new Date(),
        lastApiStatus: testResult.status || 'connected',
        lastApiMessage: testResult.message
      }
    );

    res.json({
      success: testResult.success,
      data: testResult
    });
  } catch (err) {
    console.error('Test Google API error:', err);
    res.status(500).json({ success: false, message: 'Test failed', error: err.message });
  }
};

/**
 * POST /api/languages/admin/auto-translate-language
 * Admin: Batch auto-translate all keys for a target language with Google API
 */
const autoTranslateLanguage = async (req, res) => {
  try {
    const { targetLang, forceAll = false } = req.body;
    if (!targetLang) {
      return res.status(400).json({ success: false, message: 'Target language code is required' });
    }

    const adminId = req.userId || req.user?._id;
    const result = await translationService.autoTranslateLanguageDictionary(targetLang, forceAll, adminId);

    res.json({
      success: true,
      message: `Successfully translated ${result.translatedCount} strings into ${targetLang}`,
      data: result
    });
  } catch (err) {
    console.error('Auto-translate language error:', err);
    res.status(500).json({ success: false, message: 'Auto-translation failed', error: err.message });
  }
};

/**
 * POST /api/languages/admin/upsert-key
 * Admin: Add or update a translation dictionary key
 */
const upsertDictionaryKey = async (req, res) => {
  try {
    const { key, category = 'general', description = '', translations = {} } = req.body;

    if (!key || !key.trim()) {
      return res.status(400).json({ success: false, message: 'Translation key name is required' });
    }

    const cleanKey = key.trim();
    let item = await Translation.findOne({ key: cleanKey });

    if (!item) {
      item = new Translation({
        key: cleanKey,
        category,
        description,
        translations: new Map(),
        lastTranslatedBy: new Map()
      });
    } else {
      item.category = category;
      item.description = description;
    }

    // Set translations
    for (const [langCode, text] of Object.entries(translations)) {
      if (text !== undefined) {
        item.translations.set(langCode, text);
        const lastMap = item.lastTranslatedBy || new Map();
        lastMap.set(langCode, 'admin');
        item.lastTranslatedBy = lastMap;
      }
    }

    item.updatedBy = req.userId || req.user?._id;
    await item.save();

    res.json({
      success: true,
      message: 'Translation key saved successfully',
      data: {
        key: item.key,
        category: item.category,
        description: item.description,
        translations: Object.fromEntries(item.translations)
      }
    });
  } catch (err) {
    console.error('Upsert key error:', err);
    res.status(500).json({ success: false, message: 'Failed to save translation key', error: err.message });
  }
};

/**
 * POST /api/languages/admin/bulk-update
 * Admin: Save modified translations in batch
 */
const bulkUpdateTranslations = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { key, translations }
    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: 'Updates array is required' });
    }

    const adminId = req.userId || req.user?._id;
    let modifiedCount = 0;

    for (const update of updates) {
      if (!update.key) continue;
      const item = await Translation.findOne({ key: update.key });
      if (!item) continue;

      if (update.category) item.category = update.category;
      if (update.description !== undefined) item.description = update.description;

      if (update.translations && typeof update.translations === 'object') {
        for (const [lang, text] of Object.entries(update.translations)) {
          if (text !== undefined) {
            item.translations.set(lang, text);
            const lastMap = item.lastTranslatedBy || new Map();
            lastMap.set(lang, 'admin');
            item.lastTranslatedBy = lastMap;
          }
        }
      }

      item.updatedBy = adminId;
      await item.save();
      modifiedCount++;
    }

    res.json({
      success: true,
      message: `Successfully updated ${modifiedCount} translation items`,
      data: { modifiedCount }
    });
  } catch (err) {
    console.error('Bulk update translations error:', err);
    res.status(500).json({ success: false, message: 'Bulk update failed', error: err.message });
  }
};

/**
 * POST /api/languages/admin/seed-defaults
 * Admin: Re-seed default core dictionary
 */
const seedDefaultTranslations = async (req, res) => {
  try {
    await initializeLanguageSystem();
    const count = await Translation.countDocuments();
    res.json({
      success: true,
      message: `System translations verified (${count} keys total)`,
      data: { totalKeys: count }
    });
  } catch (err) {
    console.error('Seed defaults error:', err);
    res.status(500).json({ success: false, message: 'Seed failed', error: err.message });
  }
};

/**
 * POST /api/languages/admin/add-language
 * Admin: Add a new Indian or regional language to the platform
 */
const addSupportedLanguage = async (req, res) => {
  try {
    const { code, name, nativeName, badge, isEnabled = true, autoTranslateImmediately = true } = req.body;
    const adminId = req.user?._id;

    if (!code || !name || !nativeName) {
      return res.status(400).json({ success: false, message: 'Language code, English name, and native name are required' });
    }

    const cleanCode = code.toLowerCase().trim();
    let config = await LanguageConfig.findOne({ configKey: 'PRIMARY_LANGUAGE_CONFIG' });
    if (!config) {
      await initializeLanguageSystem();
      config = await LanguageConfig.findOne({ configKey: 'PRIMARY_LANGUAGE_CONFIG' });
    }

    // Check if code already exists
    const exists = config.supportedLanguages.some(l => l.code === cleanCode);
    if (exists) {
      return res.status(400).json({ success: false, message: `Language with code '${cleanCode}' already exists in configuration` });
    }

    const newLang = {
      code: cleanCode,
      name: name.trim(),
      nativeName: nativeName.trim(),
      badge: (badge || cleanCode.toUpperCase()).trim(),
      isEnabled: Boolean(isEnabled),
      isDefault: false,
      sortOrder: config.supportedLanguages.length + 1
    };

    config.supportedLanguages.push(newLang);
    config.updatedBy = adminId;
    await config.save();
    broadcastLanguageConfigUpdate(config);

    let autoTranslatedCount = 0;
    if (autoTranslateImmediately && cleanCode !== 'en') {
      try {
        const result = await translationService.autoTranslateLanguageDictionary(cleanCode);
        autoTranslatedCount = result.translatedCount;
      } catch (transErr) {
        console.warn(`[LanguageSystem] Auto-translate after adding ${cleanCode} encountered an issue:`, transErr.message);
      }
    }

    res.json({
      success: true,
      message: `Language '${name} (${nativeName})' added successfully.${autoTranslatedCount > 0 ? ` Translated ${autoTranslatedCount} platform keys using Google Maps API.` : ''}`,
      data: {
        language: newLang,
        autoTranslatedCount,
        allLanguages: config.supportedLanguages
      }
    });
  } catch (err) {
    console.error('Add language error:', err);
    res.status(500).json({ success: false, message: 'Failed to add language', error: err.message });
  }
};

/**
 * DELETE /api/languages/admin/delete-language/:code
 * Admin: Remove a language from platform and delete its dictionary entries
 */
const deleteSupportedLanguage = async (req, res) => {
  try {
    const code = (req.params.code || '').toLowerCase().trim();
    const adminId = req.user?._id;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Language code is required' });
    }

    if (code === 'en') {
      return res.status(400).json({ success: false, message: 'Default English (en) language cannot be deleted' });
    }

    const config = await LanguageConfig.findOne({ configKey: 'PRIMARY_LANGUAGE_CONFIG' });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Language configuration not found' });
    }

    if (config.defaultLanguage === code) {
      return res.status(400).json({ success: false, message: 'Cannot delete the current default language. Change default language first.' });
    }

    const initialCount = config.supportedLanguages.length;
    config.supportedLanguages = config.supportedLanguages.filter(l => l.code !== code);

    if (config.supportedLanguages.length === initialCount) {
      return res.status(404).json({ success: false, message: `Language '${code}' not found in configuration` });
    }

    config.updatedBy = adminId;
    await config.save();
    broadcastLanguageConfigUpdate(config);

    // Clean up translations for this language from all Translation records
    const allTranslations = await Translation.find({});
    for (const item of allTranslations) {
      if (item.translations && item.translations.has(code)) {
        item.translations.delete(code);
        if (item.lastTranslatedBy && typeof item.lastTranslatedBy.delete === 'function') {
          item.lastTranslatedBy.delete(code);
        }
        await item.save();
      }
    }

    res.json({
      success: true,
      message: `Language '${code.toUpperCase()}' deleted successfully`,
      data: {
        deletedCode: code,
        remainingLanguages: config.supportedLanguages
      }
    });
  } catch (err) {
    console.error('Delete language error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete language', error: err.message });
  }
};

module.exports = {
  initializeLanguageSystem,
  getPublicConfig,
  getLanguageDictionary,
  getAllTranslations,
  translateDynamicText,
  getAdminDictionary,
  updateLanguageConfig,
  testGoogleApi,
  autoTranslateLanguage,
  upsertDictionaryKey,
  bulkUpdateTranslations,
  seedDefaultTranslations,
  addSupportedLanguage,
  deleteSupportedLanguage
};
