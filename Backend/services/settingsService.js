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
const setSetting = async (key, value, label, description, type = 'string', category = null, updatedBy = null) => {
  try {
    const existing = await Settings.findOne({ key });
    
    // Determine category: explicitly passed > existing category > key-based detection ('policy' for policy keys) > 'general'
    let finalCategory = category;
    if (!finalCategory || finalCategory === 'general') {
      if (existing && existing.category) {
        finalCategory = existing.category;
      } else if (key.includes('policy') || key.includes('terms')) {
        finalCategory = 'policy';
      } else {
        finalCategory = 'general';
      }
    }

    const finalLabel = label || (existing ? existing.label : key);
    const finalDescription = description !== undefined ? description : (existing ? existing.description : '');

    const setting = await Settings.findOneAndUpdate(
      { key },
      {
        value,
        label: finalLabel,
        description: finalDescription,
        type: type || (existing ? existing.type : 'string'),
        category: finalCategory,
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
      description: 'GST percentage applied on base service fee',
      type: 'number',
      category: 'pricing'
    },
    {
      key: 'ADVANCE_PAYMENT_PERCENTAGE',
      value: 40,
      label: 'Advance Payment Percentage (%)',
      description: 'Percentage of total amount required as advance payment',
      type: 'number',
      category: 'pricing'
    },
    {
      key: 'REMAINING_PAYMENT_PERCENTAGE',
      value: 60,
      label: 'Remaining Payment Percentage (%)',
      description: 'Percentage of total amount required as remaining payment',
      type: 'number',
      category: 'pricing'
    },
    {
      key: 'BILLING_COMPANY_NAME',
      value: 'JalaDhar Tech Pvt Ltd',
      label: 'Company Name',
      description: 'Business name shown on invoices',
      type: 'string',
      category: 'billing'
    },
    {
      key: 'BILLING_ADDRESS',
      value: '123, Water Tower Complex,\nNear Borewell Circle, Civil Lines,\nRaipur, Chhattisgarh - 492001',
      label: 'Billing Address',
      description: 'Physical address shown on invoices',
      type: 'string',
      category: 'billing'
    },
    {
      key: 'BILLING_GSTIN',
      value: '22AAAAA0000A1Z5',
      label: 'GSTIN',
      description: 'Goods and Services Tax Identification Number',
      type: 'string',
      category: 'billing'
    },
    {
      key: 'BILLING_PHONE',
      value: '+91 98765 43210',
      label: 'Billing Phone',
      description: 'Contact number shown on invoices',
      type: 'string',
      category: 'billing'
    },
    {
      key: 'BILLING_EMAIL',
      value: 'billing@jaladhar.com',
      label: 'Billing Email',
      description: 'Email address shown on invoices',
      type: 'string',
      category: 'billing'
    },
    {
      key: 'DISPUTE_TYPES',
      value: [
        'Expert did not arrive',
        'Expert arrived late',
        'Survey not completed',
        'Incorrect survey location',
        'Payment issue',
        'Refund issue',
        'Travel charges issue',
        'Survey report issue',
        'Expert behaviour',
        'Requested offline payment',
        'Safety concern',
        'Other'
      ],
      label: 'Dispute Types',
      description: 'Configurable list of dispute category options',
      type: 'json',
      category: 'general'
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

