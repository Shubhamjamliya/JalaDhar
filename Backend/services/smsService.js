const axios = require('axios');

/**
 * Enterprise Dedicated SMS Service for India (SMSIndiaHub / SMS India API).
 * DLT Compliant for Indian Telecom Regulations.
 */

/**
 * Clean and format phone number to 10-digit Indian Mobile Number
 */
const formatIndianPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length > 10 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  }
  return cleaned.length === 10 ? cleaned : phone;
};

/**
 * Send SMS Text message using SMS India API Driver
 * @param {Object} params - { phone, text, templateId, entityId }
 */
const sendSMS = async ({ phone, text, templateId = null, entityId = null }) => {
  const mobileNumber = formatIndianPhoneNumber(phone);
  const isEnabled = process.env.ENABLE_SMS === 'true';

  const dltTemplateId = templateId || process.env.SMS_INDIA_OTP_TEMPLATE_ID || process.env.SMS_INDIA_DEFAULT_DLT_TE_ID || '1077187260026633978';
  const dltEntityId = entityId || process.env.SMS_INDIA_ENTITY_ID || process.env.SMS_INDIA_PE_ID || '1001495841758168605';
  const senderId = process.env.SMS_INDIA_SENDER_ID || 'JALDHR';

  console.log('📱 [SMS India Service] Dispatch Request:', {
    phone: mobileNumber,
    text,
    senderId,
    entityId: dltEntityId,
    templateId: dltTemplateId,
    enabled: isEnabled
  });

  if (!isEnabled) {
    console.log('ℹ️ [SMS India Service] SMS is disabled or in sandbox mode (Set ENABLE_SMS=true in .env to activate).');
    return { success: true, mocked: true, message: 'SMS logged in sandbox mode' };
  }

  try {
    const apiKey = process.env.SMS_INDIA_API_KEY;
    const apiBaseUrl = process.env.SMS_INDIA_API_URL || 'https://cloud.smsindiahub.in/api/mt/SendSMS';

    if (!apiKey) {
      console.log('⚠️ [SMS India Service] SMS_INDIA_API_KEY is not set in .env. Message logged locally.');
      return { success: true, mocked: true, text };
    }

    // Exact parameters expected by SMSIndiaHub / MTController endpoint
    const payload = {
      APIKey: apiKey,
      senderid: senderId,
      channel: process.env.SMS_INDIA_CHANNEL || '2',
      DCS: '0',
      flashsms: '0',
      number: mobileNumber,
      text: text,
      route: process.env.SMS_INDIA_ROUTE || '1',
      EntityId: dltEntityId,
      DltTemplateId: dltTemplateId
    };

    const response = await axios.get(apiBaseUrl, { params: payload });

    const isSuccess = response.data?.ErrorCode === '000' || 
                      (typeof response.data === 'string' && response.data.toLowerCase().includes('success'));

    if (isSuccess || response.data?.JobId) {
      console.log('✅ [SMS India Service] Sent successfully:', response.data);
      return { 
        success: true, 
        provider: 'sms_india', 
        data: response.data 
      };
    } else {
      console.warn('⚠️ [SMS India Service] Gateway response with error:', response.data);
      return {
        success: false,
        provider: 'sms_india',
        error: response.data?.ErrorMessage || 'Failed to dispatch SMS',
        data: response.data
      };
    }
  } catch (error) {
    console.error('❌ [SMS India Service] Dispatch Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP via SMS India
 * Approved DLT Template:
 * "Your Jaladhaara app login OTP is ##var##. It is valid for 10 minutes. Never share this OTP with anyone."
 * Template ID: 1077187260026633978
 * Entity ID: 1001495841758168605
 * Sender ID: JALDHR
 */
const sendSMSOTP = async ({ phone, otp }) => {
  const text = `Your Jaladhaara app login OTP is ${otp}. It is valid for 10 minutes. Never share this OTP with anyone.`;
  return await sendSMS({ 
    phone, 
    text,
    templateId: process.env.SMS_INDIA_OTP_TEMPLATE_ID || '1077187260026633978',
    entityId: process.env.SMS_INDIA_ENTITY_ID || '1001495841758168605'
  });
};

/**
 * Send Booking Confirmation via SMS India
 */
const sendBookingConfirmationSMS = async ({ phone, bookingId, serviceName, scheduledDate }) => {
  const text = `Booking Confirmed! Your groundwater survey for ${serviceName} (Booking ID: ${bookingId}) is scheduled for ${scheduledDate}. Thank you for choosing Jaladhaara.`;
  return await sendSMS({ phone, text });
};

/**
 * Send Survey Report Alert via SMS India
 */
const sendSurveyReportSMS = async ({ phone, bookingId, expertName }) => {
  const text = `Survey Report Ready! Hydrogeological report for Booking ID: ${bookingId} by ${expertName} has been uploaded. Login to Jaladhaara app to view & download.`;
  return await sendSMS({ phone, text });
};

/**
 * Send Survey OTP (Start or End Survey) via SMS India
 */
const sendSurveyOTPSMS = async ({ phone, otp, stage = 'Start', bookingId, vendorName = 'your expert' }) => {
  const shortId = bookingId ? bookingId.toString().slice(-8) : '';
  const actionText = stage === 'Start'
    ? `to share with expert ${vendorName} upon arrival on site to begin your survey.`
    : `to share with expert ${vendorName} to confirm completion of your site survey.`;

  const text = `Your Jaladhaara ${stage} Survey OTP for Booking ID: ${shortId} is: ${otp}. Please provide this code ${actionText}`;
  return await sendSMS({ phone, text });
};

module.exports = {
  sendSMS,
  sendSMSOTP,
  sendBookingConfirmationSMS,
  sendSurveyReportSMS,
  sendSurveyOTPSMS
};

