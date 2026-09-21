const axios = require('axios');

/**
 * Enterprise BhashSMS WhatsApp Business API Service
 * Endpoint: http://bhashsms.com/api/sendmsg.php
 * Format: user, pass, sender, phone, text, priority=wa, stype=normal, Params=param1,param2...
 */

/**
 * Normalizes an Indian phone number to 10 digits WITHOUT +91 or leading zeros.
 * @param {string|number} phone
 * @returns {string|null} 10-digit phone string or null if invalid
 */
const formatBhashPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/\D/g, '');

  // Strip leading 91 if 12 digits (e.g., 919876543210 -> 9876543210)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  }
  // Strip leading 0 if 11 digits (e.g., 09876543210 -> 9876543210)
  else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  return cleaned.length === 10 ? cleaned : null;
};

/**
 * Sanitizes a template parameter string to ensure no unescaped commas disrupt the BhashSMS CSV delimiter.
 * @param {any} val
 * @returns {string}
 */
const sanitizeParam = (val) => {
  if (val === undefined || val === null) return '';
  // Convert to string, trim, and replace internal commas with a space to prevent CSV parameter splitting
  return String(val).trim().replace(/,/g, ' ');
};

/**
 * Dispatches a WhatsApp message using BhashSMS API gateway.
 * @param {Object} options
 * @param {string} options.phone - 10-digit mobile number (or standard phone string to be formatted)
 * @param {string} options.text - Template name (e.g. 'booking_confirmed')
 * @param {Array<string|number>|string} [options.params] - Array of parameter values or pre-formatted comma-separated string
 * @param {string} [options.priority='wa'] - 'wa' for WhatsApp
 * @param {string} [options.stype='normal'] - 'normal'
 * @returns {Promise<{ success: boolean, data?: any, error?: string, phone?: string }>}
 */
const sendBhashWhatsAppMessage = async ({
  phone,
  text,
  params = [],
  priority = 'wa',
  stype = 'normal'
}) => {
  const mobileNumber = formatBhashPhoneNumber(phone);
  if (!mobileNumber) {
    return {
      success: false,
      error: `Invalid phone number: "${phone}". Phone numbers must be a 10-digit Indian mobile number without +91.`
    };
  }

  const user = process.env.BHASH_USER || 'Jaladhaara_1';
  const pass = process.env.BHASH_PASSWORD;
  const sender = process.env.BHASH_SENDER || 'BUZWAP';
  const apiUrl =
    process.env.BHASH_WA_UTILITY_API_URL ||
    process.env.BHASH_API_URL ||
    'http://bhashsms.com/api/sendmsgutil.php';
  const activePriority = priority || process.env.BHASH_WA_PRIORITY || 'wa';
  const activeStype = stype || process.env.BHASH_WA_STYPE || 'normal';

  // Format comma-separated Params string
  let formattedParams = '';
  if (Array.isArray(params)) {
    formattedParams = params.map(sanitizeParam).join(',');
  } else if (typeof params === 'string') {
    formattedParams = params;
  }

  // Safe logging (NEVER log the password)
  console.log('💬 [BhashSMS WhatsApp] Outbound Request:', {
    user,
    sender,
    phone: mobileNumber,
    template: text,
    priority: activePriority,
    stype: activeStype,
    apiUrl,
    paramsCount: Array.isArray(params) ? params.length : (formattedParams ? formattedParams.split(',').length : 0),
    pass: pass ? '***CONFIGURED***' : '***MISSING***'
  });

  if (!pass) {
    console.warn('⚠️ [BhashSMS WhatsApp] BHASH_PASSWORD is not configured in .env. Request aborted.');
    return {
      success: false,
      error: 'BHASH_PASSWORD is not configured in backend environment variables (.env)',
      mocked: true
    };
  }

  try {
    const queryParams = {
      user,
      pass,
      sender,
      phone: mobileNumber,
      text,
      priority: activePriority,
      stype: activeStype
    };

    // Only attach Params if present
    if (formattedParams) {
      queryParams.Params = formattedParams;
    }

    const response = await axios.get(apiUrl, {
      params: queryParams,
      timeout: 15000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const rawData = response.data;
    const responseString = typeof rawData === 'string' ? rawData.trim() : JSON.stringify(rawData);
    const lower = (responseString || '').toLowerCase();

    // BhashSMS error indicators: "No Sufficient Credits", "Error: ...", "Username/Password Incorrect", etc.
    const isError =
      !responseString ||
      lower.includes('no sufficient') ||
      lower.includes('sufficient') ||
      lower.includes('credit') ||
      lower.includes('error') ||
      lower.includes('invalid') ||
      lower.includes('fail') ||
      lower.includes('incorrect') ||
      lower.includes('deactivated') ||
      lower.includes('insufficient') ||
      lower.includes('not allowed') ||
      lower.includes('denied') ||
      lower.includes('mismatch') ||
      lower.includes('missing');

    if (isError) {
      console.warn('⚠️ [BhashSMS WhatsApp] Gateway rejected request:', responseString || '(Empty response)');
      return {
        success: false,
        error: responseString || 'Empty response received from BhashSMS gateway',
        phone: mobileNumber,
        template: text
      };
    }

    console.log('✅ [BhashSMS WhatsApp] Gateway Success Response:', responseString);
    return {
      success: true,
      data: responseString,
      phone: mobileNumber,
      template: text
    };
  } catch (err) {
    // Sanitize any error logs so password is never printed in stack trace or URL
    const sanitizedErrorMessage = err.message ? err.message.replace(new RegExp(pass, 'g'), '***') : 'Unknown HTTP dispatch error';
    console.error('❌ [BhashSMS WhatsApp] Dispatch Error:', sanitizedErrorMessage);

    return {
      success: false,
      error: sanitizedErrorMessage
    };
  }
};

/**
 * Send the approved `booking_confirmed` WhatsApp template via BhashSMS.
 * Template: booking_confirmed (APPROVED)
 * Parameters mapping:
 * {{1}} customer name
 * {{2}} booking ID
 * {{3}} booking date
 * {{4}} booking time
 * {{5}} booking ID
 */
const sendBookingConfirmedWhatsApp = async ({
  phone,
  customerName = 'Customer',
  bookingId = 'N/A',
  bookingDate = 'N/A',
  bookingTime = 'N/A'
}) => {
  const params = [
    customerName,
    bookingId,
    bookingDate,
    bookingTime,
    bookingId
  ];

  return await sendBhashWhatsAppMessage({
    phone,
    text: 'booking_confirmed',
    params
  });
};

/**
 * Send the approved `booking_cancelled` WhatsApp template via BhashSMS.
 * Template: booking_cancelled (APPROVED)
 * Parameters mapping:
 * {{1}} customer name
 * {{2}} booking ID
 * {{3}} details / refund notice
 */
const sendBookingCancelledWhatsApp = async ({
  phone,
  customerName = 'Customer',
  bookingId = 'N/A',
  details = 'As per request / policy'
}) => {
  const params = [
    customerName,
    bookingId,
    details
  ];

  return await sendBhashWhatsAppMessage({
    phone,
    text: 'booking_cancelled',
    params
  });
};

/**
 * Send the `booking_accepted` WhatsApp template via BhashSMS.
 * Template: booking_accepted
 * Parameters mapping:
 * {{1}} customer name
 * {{2}} expert name
 * {{3}} booking ID
 * {{4}} scheduled date & time
 */
const sendBookingAcceptedWhatsApp = async ({
  phone,
  customerName = 'Customer',
  expertName = 'Jaladhaara Expert',
  bookingId = 'N/A',
  scheduledDate = 'As scheduled'
}) => {
  const params = [
    customerName,
    expertName,
    bookingId,
    scheduledDate
  ];

  return await sendBhashWhatsAppMessage({
    phone,
    text: 'booking_accepted',
    params
  });
};

/**
 * Send the `expert_on_way` WhatsApp template via BhashSMS.
 * Template: expert_on_way
 * Parameters mapping:
 * {{1}} customer name
 * {{2}} expert name
 * {{3}} booking ID
 */
const sendExpertOnWayWhatsApp = async ({
  phone,
  customerName = 'Customer',
  expertName = 'Jaladhaara Expert',
  bookingId = 'N/A'
}) => {
  const params = [
    customerName,
    expertName,
    bookingId
  ];

  return await sendBhashWhatsAppMessage({
    phone,
    text: 'expert_on_way',
    params
  });
};

/**
 * Send the `final_payment` WhatsApp template via BhashSMS.
 * Template: final_payment
 * Parameters mapping:
 * {{1}} customer name
 * {{2}} booking ID
 * {{3}} remaining amount
 */
const sendFinalPaymentWhatsApp = async ({
  phone,
  customerName = 'Customer',
  bookingId = 'N/A',
  remainingAmount = '0'
}) => {
  const params = [
    customerName,
    bookingId,
    remainingAmount
  ];

  return await sendBhashWhatsAppMessage({
    phone,
    text: 'final_payment',
    params
  });
};

/**
 * Send the `report_ready` WhatsApp template via BhashSMS.
 * Template: report_ready
 * Parameters mapping:
 * {{1}} customer name
 * {{2}} booking ID
 * {{3}} expert name
 * {{4}} report link / app link
 */
const sendReportReadyWhatsApp = async ({
  phone,
  customerName = 'Customer',
  bookingId = 'N/A',
  expertName = 'Jaladhaara Expert',
  reportLink = 'https://jaladhar.com/user/bookings'
}) => {
  const params = [
    customerName,
    bookingId,
    expertName,
    reportLink
  ];

  return await sendBhashWhatsAppMessage({
    phone,
    text: 'report_ready',
    params
  });
};

module.exports = {
  formatBhashPhoneNumber,
  sanitizeParam,
  sendBhashWhatsAppMessage,
  sendBookingConfirmedWhatsApp,
  sendBookingCancelledWhatsApp,
  sendBookingAcceptedWhatsApp,
  sendExpertOnWayWhatsApp,
  sendFinalPaymentWhatsApp,
  sendReportReadyWhatsApp
};
