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
    
    // Determine category: explicitly passed > existing category > key prefix > general
    let finalCategory = category;
    if (!finalCategory || finalCategory === 'general') {
      if (key.startsWith('BILLING_')) {
        finalCategory = 'billing';
      } else if (existing && existing.category) {
        finalCategory = existing.category;
      } else if (key.includes('policy')) {
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
      value: 'Jaladhaara Hydrogeological Services Pvt. Ltd.',
      label: 'Company Name',
      description: 'Business name shown on invoices',
      type: 'string',
      category: 'billing'
    },
    {
      key: 'BILLING_ADDRESS',
      value: '123, Water Tower Complex, Near Borewell Circle, Civil Lines, Raipur, Chhattisgarh - 492001',
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
      key: 'BILLING_PAN',
      value: 'AAACJ1234F',
      label: 'PAN Number',
      description: 'Permanent Account Number shown on invoices',
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
      value: 'info@jaladhaaraapp.com',
      label: 'Billing Email',
      description: 'Email address shown on invoices',
      type: 'string',
      category: 'billing'
    },
    {
      key: 'BILLING_WEBSITE',
      value: 'https://jaladhaaraapp.in',
      label: 'Billing Website',
      description: 'Website URL shown on invoices',
      type: 'string',
      category: 'billing'
    },
    {
      key: 'BILLING_SAC_CODE',
      value: '998341',
      label: 'SAC Code',
      description: 'Service Accounting Code for Groundwater Hydrogeological Survey (998341)',
      type: 'string',
      category: 'billing'
    },
    {
      key: 'BILLING_PLACE_OF_SUPPLY',
      value: 'Chhattisgarh (State Code: 22)',
      label: 'Place of Supply',
      description: 'Place of supply state and code for GST tax compliance',
      type: 'string',
      category: 'billing'
    },
    {
      key: 'BILLING_DECLARATION',
      value: 'This is a computer-generated Tax Invoice and does not require a physical signature.',
      label: 'Invoice Declaration',
      description: 'Legal disclaimer shown on footer of invoices',
      type: 'string',
      category: 'billing'
    },
    {
      key: 'BILLING_TERMS_AND_CONDITIONS',
      value: JSON.stringify([
        "Terms & Conditions issued for groundwater survey services booked through Jaladhaara.",
        "Groundwater availability and borewell success depend on site-specific geological conditions & geophysical investigations and cannot be guaranteed.",
        "Please retain this invoice for future reference.",
        "Booking is confirmed upon receipt of the advance payment.",
        "Final payment is required to unlock the survey report.",
        "Travel charges are non-refundable once the expert begins the journey.",
        "Disputes must be raised within 10 days of the survey report submission."
      ]),
      label: 'Terms & Conditions',
      description: 'JSON stringified array of terms and conditions shown on invoices',
      type: 'json',
      category: 'billing'
    },
    {
      key: 'BILLING_EXPERT_TERMS',
      value: JSON.stringify([
        "This invoice is issued by the Platform for facilitation services provided to the Expert.",
        "Platform fees and applicable statutory deductions are calculated as per applicable laws.",
        "Net payout is subject to successful settlement and platform policies.",
        "Any refund, dispute, or chargeback may be adjusted against future payouts.",
        "This is a computer-generated invoice and does not require a signature."
      ]),
      label: 'Expert Invoice Terms & Declarations',
      description: 'JSON stringified array of terms and declarations shown on Expert invoices',
      type: 'json',
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
    },
    {
      key: 'CANCELLATION_FULL_REFUND_HOURS',
      value: 24,
      label: 'Full Refund Threshold (Hours)',
      description: 'Hours before scheduled visit to get 100% full refund',
      type: 'number',
      category: 'policy'
    },
    {
      key: 'CANCELLATION_FULL_REFUND_PERCENT',
      value: 100,
      label: 'Full Refund Percentage (%)',
      description: 'Percentage of advance payment refunded if cancelled early',
      type: 'number',
      category: 'policy'
    },
    {
      key: 'CANCELLATION_FULL_REFUND_TEXT',
      value: '100% Full Refund of advance payment if cancelled at least 24 hours prior.',
      label: 'Full Refund Policy Text',
      description: 'Text explanation for full refund policy rule',
      type: 'string',
      category: 'policy'
    },
    {
      key: 'CANCELLATION_PARTIAL_REFUND_HOURS',
      value: 12,
      label: 'Partial Refund Threshold (Hours)',
      description: 'Hours before scheduled visit to get partial refund',
      type: 'number',
      category: 'policy'
    },
    {
      key: 'CANCELLATION_PARTIAL_REFUND_PERCENT',
      value: 50,
      label: 'Partial Refund Percentage (%)',
      description: 'Percentage of advance payment refunded if cancelled between partial and full window',
      type: 'number',
      category: 'policy'
    },
    {
      key: 'CANCELLATION_PARTIAL_REFUND_TEXT',
      value: '50% Refund of advance payment.',
      label: 'Partial Refund Policy Text',
      description: 'Text explanation for partial refund policy rule',
      type: 'string',
      category: 'policy'
    },
    {
      key: 'CANCELLATION_LATE_REFUND_PERCENT',
      value: 0,
      label: 'Late Cancellation Refund Percentage (%)',
      description: 'Percentage of advance payment refunded if cancelled within late window',
      type: 'number',
      category: 'policy'
    },
    {
      key: 'CANCELLATION_LATE_REFUND_TEXT',
      value: 'Advance payment is non-refundable due to reserved expert availability.',
      label: 'Late Refund Policy Text',
      description: 'Text explanation for late cancellation policy rule',
      type: 'string',
      category: 'policy'
    },
    {
      key: 'CANCELLATION_REFUND_SETTLEMENT_TEXT',
      value: 'Processed back to original payment mode within 5-7 business days.',
      label: 'Refund Settlement Time Text',
      description: 'Text explanation for refund processing timeframe',
      type: 'string',
      category: 'policy'
    }
  ];

  for (const setting of defaultSettings) {
    const exists = await Settings.findOne({ key: setting.key });
    if (!exists) {
      await Settings.create(setting);
      console.log(`Initialized default setting: ${setting.key}`);
    } else if (setting.key.startsWith('BILLING_') && exists.category !== 'billing') {
      exists.category = 'billing';
      await exists.save();
      console.log(`Updated category to 'billing' for: ${setting.key}`);
    }
  }

  // Ensure all BILLING_ keys are categorized under billing
  await Settings.updateMany(
    { key: { $regex: /^BILLING_/ } },
    { $set: { category: 'billing' } }
  );
};

module.exports = {
  getSetting,
  getSettings,
  setSetting,
  initializeDefaultSettings
};

