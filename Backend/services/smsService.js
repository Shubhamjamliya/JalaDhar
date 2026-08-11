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
 * @param {Object} params - { phone, text, templateId }
 */
const sendSMS = async ({ phone, text, templateId = null }) => {
  const mobileNumber = formatIndianPhoneNumber(phone);
  const isEnabled = process.env.ENABLE_SMS === 'true';

  console.log('📱 [SMS India Service] Dispatch Request:', {
    phone: mobileNumber,
    text,
    templateId: templateId || process.env.SMS_INDIA_DEFAULT_DLT_TE_ID || 'N/A',
    enabled: isEnabled
  });

  if (!isEnabled) {
    console.log('ℹ️ [SMS India Service] SMS is disabled or in sandbox mode (Set ENABLE_SMS=true in .env to activate).');
    return { success: true, mocked: true, message: 'SMS logged in sandbox mode' };
  }

  try {
    const apiKey = process.env.SMS_INDIA_API_KEY;
    const senderId = process.env.SMS_INDIA_SENDER_ID || 'JALADH';
    const apiBaseUrl = process.env.SMS_INDIA_API_URL || 'https://api.smsindiahub.in/api/v2/SendSMS';

    if (!apiKey) {
      console.log('⚠️ [SMS India Service] SMS_INDIA_API_KEY is not set in .env. Message logged locally.');
      return { success: true, mocked: true, text };
    }

    const payload = {
      ApiKey: apiKey,
      SenderId: senderId,
      mobile: mobileNumber,
      message: text
    };

    if (templateId || process.env.SMS_INDIA_DEFAULT_DLT_TE_ID) {
      payload.dltTemplateId = templateId || process.env.SMS_INDIA_DEFAULT_DLT_TE_ID;
    }

    const response = await axios.get(apiBaseUrl, { params: payload });

    console.log('✅ [SMS India Service] Sent successfully:', response.data);
    return { 
      success: true, 
      provider: 'sms_india', 
      data: response.data 
    };
  } catch (error) {
    console.error('❌ [SMS India Service] Dispatch Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP via SMS India
 */
const sendSMSOTP = async ({ phone, otp, type = 'verification' }) => {
  const text = `Your Jaladhaara ${type === 'password_reset' ? 'Password Reset' : 'Verification'} OTP is: ${otp}. Valid for 10 minutes. Do not share it with anyone.`;
  return await sendSMS({ phone, text });
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

