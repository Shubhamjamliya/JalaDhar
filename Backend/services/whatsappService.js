const axios = require('axios');

/**
 * Enterprise WhatsApp Service supporting Meta WhatsApp Cloud API & Twilio WhatsApp API.
 * Handles templates, rich text, and document link notifications.
 */

/**
 * Format phone number to standard E.164 format (+91XXXXXXXXXX)
 */
const formatWhatsAppNumber = (phone) => {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
};

/**
 * Get active WhatsApp configuration & provider status
 */
const getWhatsAppProviderStatus = () => {
  const isEnabled = process.env.ENABLE_WHATSAPP === 'true';
  const hasMeta = Boolean(process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER);

  let activeProvider = 'mock_sandbox';
  if (hasMeta) activeProvider = 'meta_cloud';
  else if (hasTwilio) activeProvider = 'twilio_whatsapp';

  return {
    isEnabled,
    activeProvider,
    hasMeta,
    hasTwilio,
    metaPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? `***${String(process.env.WHATSAPP_PHONE_NUMBER_ID).slice(-4)}` : null,
    statusText: !isEnabled
      ? 'Disabled in .env (Set ENABLE_WHATSAPP=true to activate)'
      : (hasMeta ? 'Meta WhatsApp Cloud API Active' : (hasTwilio ? 'Twilio WhatsApp Active' : 'Sandbox / Mock Mode (Console Logging)'))
  };
};

/**
 * Send WhatsApp Message
 * @param {Object} params - { phone, text, templateName, components }
 */
const sendWhatsAppMessage = async ({ phone, text, templateName = null, components = [] }) => {
  const formattedPhone = formatWhatsAppNumber(phone);
  const isEnabled = process.env.ENABLE_WHATSAPP === 'true';

  console.log('💬 [WhatsApp Service] Outbound Request:', {
    phone: formattedPhone,
    textLength: text?.length,
    templateName,
    enabled: isEnabled
  });

  if (!formattedPhone) {
    return { success: false, error: 'Invalid or missing phone number' };
  }

  if (!isEnabled) {
    console.log('ℹ️ [WhatsApp Service] WhatsApp messaging is running in sandbox/mock mode (ENABLE_WHATSAPP != true).');
    return { success: true, mocked: true, message: 'WhatsApp message logged in sandbox mode', text };
  }

  try {
    // 1. Meta WhatsApp Cloud API Driver Integration (Option A)
    if (process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const apiToken = process.env.WHATSAPP_CLOUD_API_TOKEN;

      const payload = templateName
        ? {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en_US' },
              components
            }
          }
        : {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'text',
            text: { preview_url: true, body: text }
          };

      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const messageId = response.data?.messages?.[0]?.id;
      console.log('✅ [WhatsApp Service] Sent via Meta Cloud API successfully. MessageId:', messageId);
      return { success: true, provider: 'meta_cloud', messageId, data: response.data };
    }

    // 2. Twilio WhatsApp API Driver Integration (Option B)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
        ? process.env.TWILIO_WHATSAPP_NUMBER
        : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', `whatsapp:+${formattedPhone}`);
      params.append('From', fromNumber);
      params.append('Body', text);

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        params,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000
        }
      );

      console.log('✅ [WhatsApp Service] Sent via Twilio WhatsApp successfully:', response.data.sid);
      return { success: true, provider: 'twilio_whatsapp', messageId: response.data.sid };
    }

    // Default Fallback: Sandbox Log
    console.log('⚠️ [WhatsApp Service] No active Meta or Twilio credentials found. Message logged in sandbox.');
    return { success: true, mocked: true, text };
  } catch (error) {
    const metaError = error.response?.data?.error;
    const errorMessage = metaError?.message || metaError?.error_user_msg || error.message || 'Unknown WhatsApp dispatch error';
    const errorCode = metaError?.code;

    console.error('❌ [WhatsApp Service] Failed to send WhatsApp message:', {
      error: errorMessage,
      code: errorCode,
      details: metaError?.error_data?.details || metaError?.error_subcode
    });

    return { 
      success: false, 
      error: errorMessage,
      code: errorCode,
      details: metaError?.error_data?.details
    };
  }
};

/**
 * Diagnostic Test Method for Admin
 */
const testSendWhatsAppMessage = async ({ phone, customMessage }) => {
  const text = customMessage || `🌊 *Jaladhaara WhatsApp Diagnostics Test*\n\nThis is a test notification from Jaladhaara Hydrogeological Services to verify Meta Cloud API connectivity. Timestamp: ${new Date().toLocaleTimeString('en-IN')}`;
  return await sendWhatsAppMessage({ phone, text });
};

/**
 * Send WhatsApp OTP
 */
const sendWhatsAppOTP = async ({ phone, otp, name = 'Valued Customer' }) => {
  const text = `🌊 *Jaladhaara Groundwater Survey*\n\nHello ${name},\n\nYour Verification OTP is *${otp}*.\nValid for 10 minutes. Please do not share this code with anyone for safety.`;
  return await sendWhatsAppMessage({ phone, text });
};

/**
 * Send WhatsApp Booking Confirmation
 */
const sendWhatsAppBookingConfirmation = async ({ phone, name, bookingId, serviceName, scheduledDate }) => {
  const text = `🌊 *Booking Confirmed - Jaladhaara*\n\nDear ${name},\n\nYour groundwater survey booking has been confirmed successfully!\n\n📋 *Booking ID:* ${bookingId}\n🛠️ *Service:* ${serviceName}\n📅 *Date:* ${scheduledDate}\n\nOur hydrogeological expert will reach your survey site on the scheduled time.`;
  return await sendWhatsAppMessage({ phone, text });
};

/**
 * Send WhatsApp Survey Report Ready Alert
 */
const sendWhatsAppSurveyReportAlert = async ({ phone, name, bookingId, expertName, reportUrl }) => {
  const text = `📄 *Survey Report Uploaded - Jaladhaara*\n\nHello ${name},\n\nYour hydrogeological survey report for *Booking ID: ${bookingId}* by expert *${expertName}* is now available!\n\nView or download your official PDF report in the Jaladhaara app under *Survey Reports*.${reportUrl ? `\n\nDirect Link: ${reportUrl}` : ''}`;
  return await sendWhatsAppMessage({ phone, text });
};

/**
 * 1. Send WhatsApp Booking Accepted Alert
 */
const sendWhatsAppBookingAccepted = async ({ phone, customerName = 'Customer', expertName = 'Expert', bookingId }) => {
  const text = `Hello ${customerName}, This is ${expertName}, your assigned Jaladhaara Expert.\nI have accepted your Groundwater Survey booking (Booking ID: ${bookingId}). I will contact you shortly to confirm the survey schedule. Thank you.`;
  return await sendWhatsAppMessage({ phone, text });
};

/**
 * 2. Send WhatsApp On The Way Alert
 */
const sendWhatsAppOnTheWay = async ({ phone, customerName = 'Customer', expectedTime = 'shortly' }) => {
  const text = `Hello ${customerName},\nI am on my way to your survey location and expect to arrive at approximately ${expectedTime}. Please keep the site accessible. Thank you.`;
  return await sendWhatsAppMessage({ phone, text });
};

/**
 * 3. Send WhatsApp Schedule Confirmation Alert
 */
const sendWhatsAppScheduleConfirmation = async ({ phone, customerName = 'Customer', date, time }) => {
  const text = `Hello ${customerName},\nYour groundwater survey is scheduled for ${date} at ${time}. Kindly ensure someone is available at the site to assist during the survey.`;
  return await sendWhatsAppMessage({ phone, text });
};

/**
 * 4. Send WhatsApp Need Location Alert
 */
const sendWhatsAppNeedLocation = async ({ phone, customerName = 'Customer' }) => {
  const text = `Hello ${customerName},\nPlease share your live location or the exact survey site location on WhatsApp to help me reach the site without delay. Thank you.`;
  return await sendWhatsAppMessage({ phone, text });
};

/**
 * 5. Send WhatsApp Customer Not Reachable Alert
 */
const sendWhatsAppCustomerNotReachable = async ({ phone, customerName = 'Customer' }) => {
  const text = `Hello ${customerName},\nI tried contacting you regarding your Jaladhaara survey booking but could not reach you. Please call or reply at your earliest convenience to avoid delays.`;
  return await sendWhatsAppMessage({ phone, text });
};

/**
 * 6. Send WhatsApp Delay Notification Alert
 */
const sendWhatsAppDelayNotification = async ({ phone, customerName = 'Customer', delayMinutes = 30 }) => {
  const text = `Hello ${customerName},\nDue to unforeseen circumstances, I may be delayed by approximately ${delayMinutes} minutes. Sorry for the inconvenience, and thank you for your patience.`;
  return await sendWhatsAppMessage({ phone, text });
};

module.exports = {
  getWhatsAppProviderStatus,
  sendWhatsAppMessage,
  testSendWhatsAppMessage,
  sendWhatsAppOTP,
  sendWhatsAppBookingConfirmation,
  sendWhatsAppSurveyReportAlert,
  sendWhatsAppBookingAccepted,
  sendWhatsAppOnTheWay,
  sendWhatsAppScheduleConfirmation,
  sendWhatsAppNeedLocation,
  sendWhatsAppCustomerNotReachable,
  sendWhatsAppDelayNotification
};
