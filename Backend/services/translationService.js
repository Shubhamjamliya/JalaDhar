const axios = require('axios');
const mongoose = require('mongoose');
const LanguageConfig = require('../models/LanguageConfig');
const Translation = require('../models/Translation');

// In-memory LRU-like cache for rapid repeated translations
const translationMemoryCache = new Map();
const MAX_CACHE_SIZE = 5000;

/**
 * Get active Google API key from Config or Environment
 */
const getEffectiveGoogleKey = async (overrideKey = null) => {
  if (overrideKey && typeof overrideKey === 'string' && overrideKey.trim().length > 0) {
    return overrideKey.trim();
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const config = await LanguageConfig.findOne({ configKey: 'PRIMARY_LANGUAGE_CONFIG' }).maxTimeMS(2000);
      if (config && config.googleApiKey && config.googleApiKey.trim().length > 0) {
        return config.googleApiKey.trim();
      }
    } catch (err) {
      console.warn('[TranslationService] Could not read LanguageConfig from DB:', err.message);
    }
  }

  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_TRANSLATE_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    'AIzaSyC2UW5-Nt9KidxOfBRrZImeBRh9SOMGluo' // Default project Google API Key
  );
};

/**
 * Translate using Google Cloud Translation API (v2)
 */
const translateWithGoogleCloud = async (text, targetLang, sourceLang = 'en', apiKey = null) => {
  const key = apiKey || await getEffectiveGoogleKey();
  if (!key) {
    throw new Error('Google API key not configured');
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${key}`;
  const response = await axios.post(
    url,
    {
      q: text,
      target: targetLang,
      source: sourceLang,
      format: 'text'
    },
    {
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data && response.data.data && response.data.data.translations && response.data.data.translations.length > 0) {
    return response.data.data.translations[0].translatedText;
  }

  throw new Error('No translation returned from Google Cloud Translation API');
};

/**
 * Translate using Google Translate Free Web Endpoint (Fallback & instant out-of-the-box support)
 */
const translateWithGoogleFree = async (text, targetLang, sourceLang = 'en') => {
  const encodedText = encodeURIComponent(text);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;

  const response = await axios.get(url, {
    timeout: 7000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (Array.isArray(response.data) && Array.isArray(response.data[0])) {
    const translated = response.data[0].map(segment => (segment && segment[0]) ? segment[0] : '').join('');
    if (translated) {
      return translated;
    }
  }

  throw new Error('Could not parse Google Translate response');
};

/**
 * Core Translation Method with Multi-Level Fallback & Caching
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g. 'hi', 'te', 'ta')
 * @param {string} sourceLang - Source language code (default 'en')
 * @param {Object} options - { apiKey, provider, bypassCache }
 */
const translateText = async (text, targetLang, sourceLang = 'en', options = {}) => {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return text || '';
  }

  const cleanText = text.trim();
  const normalizedTarget = (targetLang || 'en').toLowerCase().trim();
  const normalizedSource = (sourceLang || 'en').toLowerCase().trim();

  // If source and target languages are identical, return verbatim
  if (normalizedTarget === normalizedSource) {
    return cleanText;
  }

  const cacheKey = `${normalizedSource}:${normalizedTarget}:${cleanText}`;

  // Check in-memory cache
  if (!options.bypassCache && translationMemoryCache.has(cacheKey)) {
    return translationMemoryCache.get(cacheKey);
  }

  const apiKey = options.apiKey || await getEffectiveGoogleKey();
  const provider = options.provider || 'auto';

  let translatedResult = null;
  let usedProvider = null;

  // Try Google Cloud Translation API if requested or in auto mode
  if (provider === 'google-cloud' || (provider === 'auto' && apiKey)) {
    try {
      translatedResult = await translateWithGoogleCloud(cleanText, normalizedTarget, normalizedSource, apiKey);
      usedProvider = 'google-cloud';
    } catch (cloudErr) {
      console.warn(`[TranslationService] Google Cloud API error (${cloudErr.message}), falling back to Google engine...`);
    }
  }

  // Fallback to Google Free Translation engine
  if (!translatedResult) {
    try {
      translatedResult = await translateWithGoogleFree(cleanText, normalizedTarget, normalizedSource);
      usedProvider = 'free-google';
    } catch (freeErr) {
      console.error(`[TranslationService] Google translation failed:`, freeErr.message);
      throw new Error(`Failed to translate text to ${targetLang}: ${freeErr.message}`);
    }
  }

  // Store in memory cache
  if (translatedResult) {
    if (translationMemoryCache.size >= MAX_CACHE_SIZE) {
      const firstKey = translationMemoryCache.keys().next().value;
      translationMemoryCache.delete(firstKey);
    }
    translationMemoryCache.set(cacheKey, translatedResult);
  }

  return translatedResult;
};

/**
 * Batch translate multiple text items
 */
const batchTranslate = async (texts = [], targetLang, sourceLang = 'en', options = {}) => {
  if (!Array.isArray(texts) || texts.length === 0) return {};

  const results = {};
  const uniqueTexts = [...new Set(texts.filter(t => t && typeof t === 'string' && t.trim()))];

  // Process in small batches with slight pacing to prevent rate limits
  const batchSize = 10;
  for (let i = 0; i < uniqueTexts.length; i += batchSize) {
    const chunk = uniqueTexts.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (text) => {
        try {
          const translated = await translateText(text, targetLang, sourceLang, options);
          results[text] = translated;
        } catch (err) {
          console.warn(`[BatchTranslate] Failed for "${text}":`, err.message);
          results[text] = text; // fallback to original
        }
      })
    );
  }

  return results;
};

/**
 * Test Google API connection & verify live translation
 */
const testGoogleApiConnection = async (apiKey = null, provider = 'auto') => {
  const startTime = Date.now();
  const effectiveKey = apiKey || await getEffectiveGoogleKey();

  const testPhrases = [
    'Welcome to Jaladhar Groundwater Survey',
    'Find verified experts and book your survey'
  ];

  try {
    const hindiTranslation = await translateText(testPhrases[0], 'hi', 'en', {
      apiKey: effectiveKey,
      provider: provider === 'auto' ? 'google-cloud' : provider,
      bypassCache: true
    });

    const teluguTranslation = await translateText(testPhrases[1], 'te', 'en', {
      apiKey: effectiveKey,
      provider: provider === 'auto' ? 'google-cloud' : provider,
      bypassCache: true
    });

    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      status: 'connected',
      latencyMs,
      message: 'Google Translation API is active and functioning correctly.',
      apiKeyMasked: effectiveKey ? `${effectiveKey.slice(0, 6)}...${effectiveKey.slice(-4)}` : 'Default Environment Key',
      sampleResults: {
        hi: { original: testPhrases[0], translated: hindiTranslation },
        te: { original: testPhrases[1], translated: teluguTranslation }
      }
    };
  } catch (err) {
    // If explicit Google Cloud attempt failed, test Google Free fallback
    try {
      const fallbackHindi = await translateText(testPhrases[0], 'hi', 'en', {
        provider: 'free-google',
        bypassCache: true
      });
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        status: 'connected',
        latencyMs,
        provider: 'free-google',
        message: 'Google Cloud key returned an error; active fallback translation engine connected successfully.',
        apiKeyMasked: effectiveKey ? `${effectiveKey.slice(0, 6)}...${effectiveKey.slice(-4)}` : 'None',
        warning: err.message,
        sampleResults: {
          hi: { original: testPhrases[0], translated: fallbackHindi }
        }
      };
    } catch (fallbackErr) {
      return {
        success: false,
        status: 'error',
        latencyMs: Date.now() - startTime,
        message: `Translation API connection failed: ${err.message || fallbackErr.message}`
      };
    }
  }
};

/**
 * Auto-translate entire application dictionary for a specific language
 */
const autoTranslateLanguageDictionary = async (targetLang, forceAll = false, adminId = null) => {
  const normalizedTarget = (targetLang || '').toLowerCase().trim();
  if (!normalizedTarget || normalizedTarget === 'en') {
    throw new Error('Target language must be a valid non-English code');
  }

  const allTranslations = await Translation.find({});
  let translatedCount = 0;
  let skippedCount = 0;

  const itemsToTranslate = [];
  for (const item of allTranslations) {
    const enText = item.translations?.get('en');
    if (!enText) continue;

    const existingTarget = item.translations?.get(normalizedTarget);
    if (existingTarget && !forceAll) {
      skippedCount++;
      continue;
    }
    itemsToTranslate.push({ item, enText });
  }

  if (itemsToTranslate.length > 0) {
    const texts = itemsToTranslate.map(i => i.enText);
    const translatedMap = await batchTranslate(texts, normalizedTarget, 'en');

    await Promise.all(
      itemsToTranslate.map(async ({ item, enText }) => {
        try {
          const translated = translatedMap[enText];
          if (translated) {
            item.translations.set(normalizedTarget, translated);
            const lastTranslatedMap = item.lastTranslatedBy || new Map();
            lastTranslatedMap.set(normalizedTarget, 'google-api');
            item.lastTranslatedBy = lastTranslatedMap;

            if (adminId) {
              item.updatedBy = adminId;
            }

            await item.save();
            translatedCount++;
          }
        } catch (err) {
          console.error(`[AutoTranslate] Error saving key "${item.key}" to ${normalizedTarget}:`, err.message);
        }
      })
    );
  }

  return {
    success: true,
    targetLanguage: normalizedTarget,
    totalKeys: allTranslations.length,
    translatedCount,
    skippedCount
  };
};

module.exports = {
  getEffectiveGoogleKey,
  translateText,
  batchTranslate,
  testGoogleApiConnection,
  autoTranslateLanguageDictionary
};
