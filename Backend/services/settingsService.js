const Settings = require('../models/Settings');

const normalizeSettingValue = (val, type, defaultValue) => {
  if (val === undefined || val === null) return defaultValue;
  if (type === 'boolean' || typeof defaultValue === 'boolean') {
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true' || val === '1';
    }
    return Boolean(val);
  }
  if (type === 'number' || typeof defaultValue === 'number') {
    const n = Number(val);
    return isNaN(n) ? defaultValue : n;
  }
  return val;
};

/**
 * Get setting value by key
 */
const getSetting = async (key, defaultValue = null) => {
  try {
    const setting = await Settings.findOne({ key });
    if (!setting) {
      return defaultValue;
    }
    return normalizeSettingValue(setting.value, setting.type, defaultValue);
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
      result[key] = setting ? normalizeSettingValue(setting.value, setting.type, null) : null;
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
      } else if (['TRAVEL_CHARGE_PER_KM', 'BASE_RADIUS_KM', 'GST_PERCENTAGE', 'ADVANCE_PAYMENT_PERCENTAGE', 'REMAINING_PAYMENT_PERCENTAGE', 'REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT', 'ENABLE_AUTO_APPROVE_REPORT_SLA', 'AUTO_APPROVE_REPORT_SLA_HOURS'].includes(key)) {
        finalCategory = 'pricing';
      } else if (existing && existing.category) {
        finalCategory = existing.category;
      } else if (key.includes('policy') || key.includes('RESCHEDULE') || key.includes('CANCELLATION') || ['ALLOW_CUSTOMER_RESCHEDULE', 'MAX_FREE_RESCHEDULES', 'RESCHEDULE_WINDOW_DAYS'].includes(key)) {
        finalCategory = 'policy';
      } else {
        finalCategory = 'general';
      }
    }

    const finalLabel = label || (existing ? existing.label : key);
    const finalDescription = description !== undefined ? description : (existing ? existing.description : '');

    let finalType = type;
    if (!finalType || finalType === 'string') {
      if (typeof value === 'boolean' || value === 'true' || value === 'false') {
        finalType = 'boolean';
      } else if (typeof value === 'number') {
        finalType = 'number';
      } else if (existing && existing.type) {
        finalType = existing.type;
      }
    }

    let finalValue = value;
    if (finalType === 'boolean') {
      finalValue = (value === true || value === 'true' || value === 1 || value === '1');
    } else if (finalType === 'number') {
      finalValue = Number(value);
    }

    const setting = await Settings.findOneAndUpdate(
      { key },
      {
        value: finalValue,
        label: finalLabel,
        description: finalDescription,
        type: finalType,
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
      key: 'REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT',
      value: true,
      label: 'Require Admin Approval for 2nd Installment Payout',
      description: 'When enabled, the 2nd installment (50%) is held in escrow until an Admin reviews and approves the technical survey report in Admin Approvals. When disabled, payout is credited automatically to the vendor upon report upload.',
      type: 'boolean',
      category: 'pricing'
    },
    {
      key: 'ENABLE_AUTO_APPROVE_REPORT_SLA',
      value: true,
      label: 'Enable Auto-Approve SLA Timer',
      description: 'Automatically release the 2nd installment to the vendor if Admin takes no action within the configured SLA hours.',
      type: 'boolean',
      category: 'pricing'
    },
    {
      key: 'AUTO_APPROVE_REPORT_SLA_HOURS',
      value: 48,
      label: 'Auto-Approve SLA Grace Period (Hours)',
      description: 'Hours after report upload before payout is automatically released if no dispute is open (e.g. 24, 48, 72).',
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
    },
    {
      key: 'ALLOW_CUSTOMER_RESCHEDULE',
      value: true,
      label: 'Allow Customer Rescheduling',
      description: 'Toggle voluntary survey rescheduling on or off for customers platform-wide',
      type: 'boolean',
      category: 'policy'
    },
    {
      key: 'MAX_FREE_RESCHEDULES',
      value: 2,
      label: 'Max Free Reschedules',
      description: 'Maximum number of voluntary reschedules permitted per booking',
      type: 'number',
      category: 'policy'
    },
    {
      key: 'ENABLE_VENDOR_WHATSAPP_ASSISTANT',
      value: true,
      label: 'Enable Expert WhatsApp Action Button',
      description: 'Show or hide the 1-tap WhatsApp communication button in the Expert App',
      type: 'boolean',
      category: 'notification'
    },
    {
      key: 'ENABLE_AUTOMATED_WHATSAPP_NOTIFICATIONS',
      value: true,
      label: 'Enable Automated WhatsApp Notifications',
      description: 'Automatically dispatch WhatsApp notifications to customers on key booking events',
      type: 'boolean',
      category: 'notification'
    },
    {
      key: 'WHATSAPP_TEMPLATES_CONFIG',
      value: {
        booking_accepted: {
          enabled: true,
          title: 'Booking Accepted',
          template: 'Hello {Customer Name}, This is {Expert Name}, your assigned Jaladhaara Expert.\nI have accepted your Groundwater Survey booking (Booking ID: {Booking ID}). I will contact you shortly to confirm the survey schedule. Thank you.'
        },
        on_the_way: {
          enabled: true,
          title: 'On the Way',
          template: 'Hello {Customer Name},\nI am on my way to your survey location and expect to arrive at approximately {Time}. Please keep the site accessible. Thank you.'
        },
        schedule_confirmation: {
          enabled: true,
          title: 'Schedule Confirmation',
          template: 'Hello {Customer Name},\nYour groundwater survey is scheduled for {Date} at {Time}. Kindly ensure someone is available at the site to assist during the survey.'
        },
        need_location: {
          enabled: true,
          title: 'Need Location',
          template: 'Hello {Customer Name},\nPlease share your live location or the exact survey site location on WhatsApp to help me reach the site without delay. Thank you.'
        },
        customer_not_reachable: {
          enabled: true,
          title: 'Customer Not Reachable',
          template: 'Hello {Customer Name},\nI tried contacting you regarding your Jaladhaara survey booking but could not reach you. Please call or reply at your earliest convenience to avoid delays.'
        },
        delay_notification: {
          enabled: true,
          title: 'Delay Notification',
          template: 'Hello {Customer Name},\nDue to unforeseen circumstances, I may be delayed by approximately {X} minutes. Sorry for the inconvenience, and thank you for your patience.'
        }
      },
      label: 'WhatsApp Message Templates Configuration',
      description: 'Configure active WhatsApp templates and their default text wording',
      type: 'json',
      category: 'notification'
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

