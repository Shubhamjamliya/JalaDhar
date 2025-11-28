const Settings = require('../../models/Settings');
const { setSetting, getSetting, getSettings } = require('../../services/settingsService');

/**
 * Get all settings
 */
const getAllSettings = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    
    const settings = await Settings.find(query).sort({ category: 1, key: 1 });
    
    res.json({
      success: true,
      message: 'Settings retrieved successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings',
      error: error.message
    });
  }
};

/**
 * Get setting by key
 */
const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Settings.findOne({ key });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Setting retrieved successfully',
      data: { setting }
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve setting',
      error: error.message
    });
  }
};

/**
 * Update setting
 */
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, label, description } = req.body;
    const adminId = req.userId;
    
    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }
    
    const setting = await setSetting(
      key,
      value,
      label,
      description,
      undefined,
      undefined,
      adminId
    );
    
    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: { setting }
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
      error: error.message
    });
  }
};

/**
 * Update multiple settings
 */
const updateMultipleSettings = async (req, res) => {
  try {
    const { settings } = req.body; // Array of {key, value}
    const adminId = req.userId;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Settings must be an array'
      });
    }
    
    const updatedSettings = [];
    for (const { key, value } of settings) {
      if (key && value !== undefined) {
        const setting = await setSetting(key, value, undefined, undefined, undefined, undefined, adminId);
        updatedSettings.push(setting);
      }
    }
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings: updatedSettings }
    });
  } catch (error) {
    console.error('Update multiple settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

module.exports = {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  updateMultipleSettings
};

