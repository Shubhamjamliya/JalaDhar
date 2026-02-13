const Settings = require('../models/Settings');

/**
 * Get public settings (billing info and pricing)
 */
const getPublicSettings = async (req, res) => {
  try {
    const { category } = req.query;

    // Only allow specific categories to be retrieved publicly
    const allowedCategories = ['billing', 'pricing', 'general'];

    if (category && !allowedCategories.includes(category)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this settings category'
      });
    }

    const query = category ? { category } : { category: { $in: allowedCategories } };

    const settings = await Settings.find(query).select('key value category label');

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

module.exports = {
  getPublicSettings
};
