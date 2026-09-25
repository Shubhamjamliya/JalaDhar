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
  if (type === 'json') {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        return defaultValue;
      }
    }
    return val;
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
      } else if (['TRAVEL_CHARGE_PER_KM', 'BASE_RADIUS_KM', 'GST_PERCENTAGE', 'PLATFORM_FEE_PERCENTAGE', 'TRAVEL_CHARGE_SLABS', 'TRAVEL_CHARGE_DEFINITION', 'OVERNIGHT_ACCOMMODATION_POLICY', 'ADVANCE_PAYMENT_PERCENTAGE', 'REMAINING_PAYMENT_PERCENTAGE', 'REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT', 'ENABLE_AUTO_APPROVE_REPORT_SLA', 'AUTO_APPROVE_REPORT_SLA_HOURS'].includes(key)) {
        finalCategory = 'pricing';
      } else if (existing && existing.category) {
        finalCategory = existing.category;
      } else if (key.includes('policy') || key.includes('RESCHEDULE') || key.includes('CANCELLATION') || ['ALLOW_CUSTOMER_RESCHEDULE', 'MAX_FREE_RESCHEDULES', 'RESCHEDULE_WINDOW_DAYS'].includes(key)) {
        finalCategory = 'policy';
      } else if (key.startsWith('PLATFORM_ANNOUNCEMENT_')) {
        finalCategory = 'general';
      } else {
        finalCategory = 'general';
      }
    }

    const finalLabel = label || (existing ? existing.label : key);
    const finalDescription = description !== undefined ? description : (existing ? existing.description : '');

    let finalType = type;
    if (key === 'TRAVEL_CHARGE_SLABS' || Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      finalType = 'json';
    } else if (!finalType || finalType === 'string') {
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
    } else if (finalType === 'json') {
      if (typeof value === 'string') {
        try {
          finalValue = JSON.parse(value);
        } catch (e) {
          finalValue = value;
        }
      }
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
      key: 'PLATFORM_FEE_PERCENTAGE',
      value: 15,
      label: 'Platform Fee / Commission Percentage (%)',
      description: 'Platform facilitation fee percentage deducted from base service charges (e.g. 15%). 18% GST on platform fee and 1% Sec 194O TDS apply automatically.',
      type: 'number',
      category: 'pricing'
    },
    {
      key: 'TRAVEL_CHARGE_SLABS',
      value: JSON.stringify([
        { minKm: 0, maxKm: 30, charge: 0 },
        { minKm: 31, maxKm: 50, charge: 1200 },
        { minKm: 51, maxKm: 75, charge: 1800 },
        { minKm: 76, maxKm: 100, charge: 2400 },
        { minKm: 101, maxKm: 150, charge: 3000 },
        { minKm: 151, maxKm: 200, charge: 4000 },
        { minKm: 201, maxKm: 250, charge: 5000 },
        { minKm: 251, maxKm: 300, charge: 6000 },
        { minKm: 301, maxKm: 350, charge: 7000 },
        { minKm: 351, maxKm: 400, charge: 8000 },
        { minKm: 401, maxKm: 500, charge: 10000 }
      ]),
      label: 'Travel Charge Slabs (Two-Way)',
      description: 'Tiered two-way travel charge slabs determined by one-way road distance. Covers two-way travel and applicable toll charges.',
      type: 'json',
      category: 'pricing'
    },
    {
      key: 'TRAVEL_CHARGE_DEFINITION',
      value: "The applicable slab is determined by the one-way road distance between the expert's starting location and the survey site. The corresponding Travel Charge covers two-way travel and applicable toll charges.",
      label: 'Travel Charge Policy Definition',
      description: 'Definition explaining how travel charges and toll coverage are computed.',
      type: 'string',
      category: 'pricing'
    },
    {
      key: 'OVERNIGHT_ACCOMMODATION_POLICY',
      value: "Overnight accommodation is not included in the Travel Charge and will not be provided by Jaladhaara.",
      label: 'Overnight Accommodation Policy',
      description: 'Overnight accommodation policy disclaimer.',
      type: 'string',
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
      value: 'Jaladhaara Groundwater Survey Pvt. Ltd.',
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
        "Travel Charge covers two-way travel and applicable toll charges based on one-way road distance.",
        "Overnight accommodation is not included in the Travel Charge and will not be provided by Jaladhaara.",
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
        "Travel Charge covers two-way travel and applicable toll charges.",
        "Overnight accommodation is not included in the Travel Charge and will not be provided by Jaladhaara.",
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
      value: 1,
      label: 'Max Free Reschedules',
      description: 'Maximum number of voluntary reschedules permitted per booking',
      type: 'number',
      category: 'policy'
    },
    {
      key: 'RESCHEDULE_NOTICE_HOURS',
      value: 24,
      label: 'Minimum Reschedule Notice (Hours)',
      description: 'Minimum hours in advance before the scheduled survey time a customer must request a reschedule (e.g. 24 hours)',
      type: 'number',
      category: 'policy'
    },
    {
      key: 'RESCHEDULE_WINDOW_DAYS',
      value: 30,
      label: 'Reschedule Future Horizon (Days)',
      description: 'Maximum days into the future a customer is allowed to pick a new date',
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
        booking_confirmed: {
          enabled: true,
          title: 'Automated: Booking Confirmed (Customer)',
          template: 'Hi {{1}}, Your booking {{2}} has been confirmed. Date: {{3}} Time: {{4}} Booking ID: {{5}} Thank you for choosing us.'
        },
        booking_accepted: {
          enabled: true,
          title: 'Automated & Chat: Booking Accepted (Customer)',
          template: 'Hello {Customer Name}, This is {Expert Name}, your assigned Jaladhaara Expert.\nI have accepted your Groundwater Survey booking (Booking ID: {Booking ID}). I will contact you shortly to confirm the survey schedule. Thank you.'
        },
        on_the_way: {
          enabled: true,
          title: 'Automated & Chat: Expert On The Way (Customer)',
          template: 'Hello {Customer Name},\nI am on my way to your survey location and expect to arrive at approximately {Time}. Please keep the site accessible. Thank you.'
        },
        final_payment: {
          enabled: true,
          title: 'Automated: Final Payment Due (Customer)',
          template: 'Hello {{1}}, Your groundwater survey for Booking ID: {{2}} has been completed. Remaining Amount: Rs. {{3}}. Please complete the payment to access your survey report. - Jaladhaara'
        },
        report_ready: {
          enabled: true,
          title: 'Automated: Survey Report Ready (Customer)',
          template: 'Hello {{1}}, Great news! Your Groundwater Survey Report for Booking ID: {{2}} has been uploaded by Expert {{3}}. You can view and download your full hydrogeological analysis report in the Jaladhaara app: {{4}} - Team Jaladhaara'
        },
        booking_cancelled: {
          enabled: true,
          title: 'Automated: Booking Cancelled (Customer)',
          template: 'Hello {{1}}, Your groundwater survey booking (ID: {{2}}) has been cancelled. Details: {{3}}. If applicable, your refund has been initiated to the original payment source. - Team Jaladhaara'
        },
        expert_assignment: {
          enabled: true,
          title: 'Automated: Survey Assigned (Expert)',
          template: 'Jaladhaara – Survey Assigned\nBooking {{1}} has been assigned to you.\nLocation: {{2}}\nDate: {{3}}\nTime: {{4}}\nPlease open the Jaladhaara Expert App and confirm the assignment. - Team Jaladhaara'
        },
        expert_report_required: {
          enabled: true,
          title: 'Automated: Report Submission Pending (Expert)',
          template: 'Jaladhaara – Report Submission Pending\nPlease submit the groundwater survey report for booking {{1}} through the Jaladhaara Expert App to unlock settlement. - Team Jaladhaara'
        },
        schedule_confirmation: {
          enabled: true,
          title: 'Chat Quick Message: Schedule Confirmation',
          template: 'Hello {Customer Name},\nYour groundwater survey is scheduled for {Date} at {Time}. Kindly ensure someone is available at the site to assist during the survey.'
        },
        need_location: {
          enabled: true,
          title: 'Chat Quick Message: Need Location',
          template: 'Hello {Customer Name},\nPlease share your live location or the exact survey site location on WhatsApp to help me reach the site without delay. Thank you.'
        },
        customer_not_reachable: {
          enabled: true,
          title: 'Chat Quick Message: Customer Not Reachable',
          template: 'Hello {Customer Name},\nI tried contacting you regarding your Jaladhaara survey booking but could not reach you. Please call or reply at your earliest convenience to avoid delays.'
        },
        delay_notification: {
          enabled: true,
          title: 'Chat Quick Message: Delay Notification',
          template: 'Hello {Customer Name},\nDue to unforeseen circumstances, I may be delayed by approximately {X} minutes. Sorry for the inconvenience, and thank you for your patience.'
        }
      },
      label: 'WhatsApp Message Templates Configuration',
      description: 'Configure active WhatsApp templates and their default text wording',
      type: 'json',
      category: 'notification'
    },
    {
      key: 'ALLOW_EXPERT_AVAILABILITY_TOGGLE',
      value: true,
      label: 'Allow Experts to Toggle Availability',
      description: 'Enable or disable the real-time online/offline toggle switch on the Expert App platform-wide',
      type: 'boolean',
      category: 'policy'
    },
    {
      key: 'ALLOW_REST_OF_TODAY_PAUSE',
      value: true,
      label: 'Allow "Busy for Rest of Today" Break',
      description: 'Allow experts to pause new bookings for today with automatic resumption tomorrow morning',
      type: 'boolean',
      category: 'policy'
    },
    {
      key: 'MAX_PAUSE_DURATION_HOURS',
      value: 4,
      label: 'Max Break Duration (Hours)',
      description: 'Maximum permitted hours for an expert to pause availability during a single shift',
      type: 'number',
      category: 'policy'
    },
    {
      key: 'PLATFORM_ANNOUNCEMENT_ENABLED',
      value: true,
      label: 'Enable Platform Announcement Notice',
      description: 'Toggle the top announcement notice banner across selected platform portals',
      type: 'boolean',
      category: 'general'
    },
    {
      key: 'PLATFORM_ANNOUNCEMENT_TEXT',
      value: 'Survey bookings will be open from 1st  November, 2026 onwards ',
      label: 'Platform Announcement Notice Text',
      description: 'Notice message displayed across the top banner of designated portals',
      type: 'string',
      category: 'general'
    },
    {
      key: 'PLATFORM_ANNOUNCEMENT_SHOW_LANDING',
      value: true,
      label: 'Show Notice on Landing Page',
      description: 'Display top notice banner on public Landing Page',
      type: 'boolean',
      category: 'general'
    },
    {
      key: 'PLATFORM_ANNOUNCEMENT_SHOW_USER',
      value: true,
      label: 'Show Notice on User Portal',
      description: 'Display top notice banner on User Portal dashboard & header',
      type: 'boolean',
      category: 'general'
    },
    {
      key: 'PLATFORM_ANNOUNCEMENT_SHOW_VENDOR',
      value: true,
      label: 'Show Notice on Expert / Vendor Portal',
      description: 'Display top notice banner on Expert Portal dashboard & header',
      type: 'boolean',
      category: 'general'
    },
    {
      key: 'PLATFORM_ANNOUNCEMENT_TYPE',
      value: 'info',
      label: 'Announcement Banner Style',
      description: 'Visual accent theme for the banner (info, warning, or success)',
      type: 'string',
      category: 'general'
    }
  ];

  // Clean up any deprecated platform operating hours keys to ensure single source of truth
  try {
    await Settings.deleteMany({ key: { $in: ['PLATFORM_OPERATING_HOURS_START', 'PLATFORM_OPERATING_HOURS_END'] } });
  } catch (cleanErr) {
    // Ignore cleanup error
  }

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

