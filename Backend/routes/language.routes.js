const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin, isSuperAdmin, requirePermission } = require('../middleware/roleMiddleware');
const languageController = require('../controllers/languageController');

const isSettingsAdmin = requirePermission('settings');

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Get platform language configuration (enabled languages, default language)
router.get('/config', languageController.getPublicConfig);

// Get key-value translations for a specific language (e.g. /api/languages/translations/hi)
router.get('/translations/:lang', languageController.getLanguageDictionary);

// Get all translations across all active languages
router.get('/all-translations', languageController.getAllTranslations);

// Translate dynamic runtime text using Google API
router.post('/translate-text', languageController.translateDynamicText);

// ==========================================
// ADMIN PROTECTED ROUTES
// ==========================================

// Full dictionary matrix
router.get('/admin/dictionary', authenticate, isSettingsAdmin, languageController.getAdminDictionary);

// Update configuration & Google API keys (Super Admin only)
router.post('/admin/config', authenticate, isSuperAdmin, languageController.updateLanguageConfig);

// Test Google Translation API connection
router.post('/admin/test-google-api', authenticate, isSettingsAdmin, languageController.testGoogleApi);

// Auto-translate dictionary to a target language with Google API
router.post('/admin/auto-translate-language', authenticate, isSettingsAdmin, languageController.autoTranslateLanguage);

// Add a new supported language
router.post('/admin/add-language', authenticate, isSettingsAdmin, languageController.addSupportedLanguage);

// Delete a supported language (Super Admin only)
router.delete('/admin/delete-language/:code', authenticate, isSuperAdmin, languageController.deleteSupportedLanguage);

// Add / edit translation key
router.post('/admin/upsert-key', authenticate, isSettingsAdmin, languageController.upsertDictionaryKey);

// Bulk save manual translation edits
router.post('/admin/bulk-update', authenticate, isSettingsAdmin, languageController.bulkUpdateTranslations);

// Seed default dictionary
router.post('/admin/seed-defaults', authenticate, isSuperAdmin, languageController.seedDefaultTranslations);

module.exports = router;
