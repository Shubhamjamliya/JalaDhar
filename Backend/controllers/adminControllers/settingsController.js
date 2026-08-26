const Settings = require('../../models/Settings');
const { setSetting, getSetting, getSettings } = require('../../services/settingsService');
const { logAdminActivity } = require('../../services/auditLogger');

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
    for (const item of settings) {
      const { key, value, label, description, type, category } = item || {};
      if (key && value !== undefined) {
        const setting = await setSetting(key, value, label, description, type, category, adminId);
        updatedSettings.push(setting);
      }
    }

    // Log admin audit action asynchronously
    const settingKeys = settings.map(s => s?.key).filter(Boolean).join(', ');
    logAdminActivity({
      req,
      adminId,
      action: 'PLATFORM_SETTINGS_UPDATED',
      module: 'SETTINGS',
      targetEntity: 'Settings',
      targetId: 'SYSTEM_SETTINGS',
      targetLabel: `Updated: ${settingKeys}`,
      notes: `Updated settings keys: ${settingKeys}`
    }).catch(err => console.error('Error recording settings audit log:', err));

    // Real-time broadcast to all connected apps (Expert, User, Admin)
    try {
      const { getIO } = require('../../sockets');
      const io = getIO();
      if (io) {
        io.emit('platform_settings_updated', {
          settings: updatedSettings,
          keys: settings.map(s => s?.key).filter(Boolean),
          timestamp: new Date()
        });
      }
    } catch (socketErr) {
      console.warn('[Socket] Could not broadcast settings update:', socketErr.message);
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

/**
 * Get WhatsApp Service Status & Diagnostics
 */
const getWhatsAppStatus = async (req, res) => {
  try {
    const { getWhatsAppProviderStatus } = require('../../services/whatsappService');
    const status = getWhatsAppProviderStatus();
    res.json({
      success: true,
      data: { status }
    });
  } catch (error) {
    console.error('getWhatsAppStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve WhatsApp status',
      error: error.message
    });
  }
};

/**
 * Send WhatsApp Test Message (Admin Diagnostics)
 */
const testSendWhatsApp = async (req, res) => {
  try {
    const { phone, customMessage } = req.body;
    const adminId = req.userId;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Recipient phone number is required'
      });
    }

    const { testSendWhatsAppMessage } = require('../../services/whatsappService');
    const result = await testSendWhatsAppMessage({ phone, customMessage });

    // Record audit log for test dispatch
    logAdminActivity({
      req,
      adminId,
      action: 'WHATSAPP_TEST_DISPATCHED',
      module: 'SETTINGS',
      targetEntity: 'Settings',
      targetId: 'WHATSAPP_TEST',
      targetLabel: `WhatsApp test sent to ${phone}`,
      notes: `Dispatch result: ${JSON.stringify(result)}`
    }).catch(err => console.error('Error recording WhatsApp test audit log:', err));

    if (result.success) {
      res.json({
        success: true,
        message: result.mocked ? 'Test message logged in sandbox mode' : 'Test message sent to WhatsApp successfully!',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to send test message',
        data: result
      });
    }
  } catch (error) {
    console.error('testSendWhatsApp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp test',
      error: error.message
    });
  }
};

module.exports = {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  updateMultipleSettings,
  getWhatsAppStatus,
  testSendWhatsApp
};

