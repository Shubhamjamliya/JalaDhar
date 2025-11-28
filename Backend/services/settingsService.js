const Settings = require('../models/Settings');

/**
 * Get setting value by key
 */
const getSetting = async (key, defaultValue = null) => {
  try {
    const setting = await Settings.findOne({ key });
    if (!setting) {
      return defaultValue;
    }
    return setting.value;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Get multiple settings
 */
const getSettings = async (keys = []) => {
  try {
    const settings = await Settings.find({ key: { $in: keys } });
    const result = {};
    keys.forEach(key => {
      const setting = settings.find(s => s.key === key);
      result[key] = setting ? setting.value : null;
    });
    return result;
  } catch (error) {
    console.error('Error getting settings:', error);
    return {};
  }
};

/**
 * Set setting value
 */
const setSetting = async (key, value, label, description, type = 'string', category = 'general', updatedBy = null) => {
  try {
    const setting = await Settings.findOneAndUpdate(
      { key },
      {
        value,
        label: label || key,
        description: description || '',
        type,
        category,
        updatedBy
      },
      { upsert: true, new: true }
    );
    return setting;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
};

/**
 * Initialize default settings
 */
const initializeDefaultSettings = async () => {
  const defaultSettings = [
    {
      key: 'TRAVEL_CHARGE_PER_KM',
      value: 10,
      label: 'Travel Charge Per Kilometer',
      description: 'Charge per km beyond base radius (in ₹)',
      type: 'number',
      category: 'pricing'
    },
    {
      key: 'BASE_RADIUS_KM',
      value: 30,
      label: 'Base Radius (km)',
      description: 'Distance within which no travel charges apply',
      type: 'number',
      category: 'pricing'
    },
    {
      key: 'GST_PERCENTAGE',
      value: 18,
      label: 'GST Percentage',
      description: 'GST percentage applied on total amount',
      type: 'number',
      category: 'pricing'
    }
  ];

  for (const setting of defaultSettings) {
    const exists = await Settings.findOne({ key: setting.key });
    if (!exists) {
      await Settings.create(setting);
      console.log(`Initialized default setting: ${setting.key}`);
    }
  }
};

module.exports = {
  getSetting,
  getSettings,
  setSetting,
  initializeDefaultSettings
};

