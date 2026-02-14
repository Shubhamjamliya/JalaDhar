const Settings = require('../models/Settings');

/**
 * Get public settings (billing info and pricing)
 */
const getPublicSettings = async (req, res) => {
  try {
    const { category } = req.query;

    // Only allow specific categories to be retrieved publicly
    const allowedCategories = ['billing', 'pricing', 'general', 'policy'];

    if (category && !allowedCategories.includes(category)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this settings category'
      });
    }

    const query = category ? { category } : { category: { $in: allowedCategories } };

    const settings = await Settings.find(query).select('key value category label description type');

    res.json({
      success: true,
      message: 'Settings retrieved successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings',
      error: error.message
    });
  }
};

/**
 * Update a specific setting (Admin only)
 */
const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Setting key is required'
      });
    }

    const setting = await Settings.findOneAndUpdate(
      { key },
      {
        value,
        updatedBy: req.user._id
      },
      { new: true, upsert: false }
    );

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

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

module.exports = {
  getPublicSettings,
  updateSetting
};
