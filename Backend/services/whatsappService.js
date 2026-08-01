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
 * Send WhatsApp Message
 * @param {Object} params - { phone, text, templateName, components }
 */
const sendWhatsAppMessage = async ({ phone, text, templateName = null, components = [] }) => {
  const formattedPhone = formatWhatsAppNumber(phone);
  const isEnabled = process.env.ENABLE_WHATSAPP === 'true';

  console.log('💬 [WhatsApp Service] Request:', {
    phone: formattedPhone,
    text,
    templateName,
    enabled: isEnabled
  });

  if (!isEnabled) {
    console.log('ℹ️ [WhatsApp Service] WhatsApp messaging is disabled or in sandbox mode (Set ENABLE_WHATSAPP=true in .env to activate).');
    return { success: true, mocked: true, message: 'WhatsApp message logged in sandbox mode' };
  }

  try {
    // 1. Meta WhatsApp Cloud API Driver Integration
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
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ [WhatsApp Service] Sent via Meta Cloud API successfully:', response.data);
      return { success: true, provider: 'meta_cloud', data: response.data };
    }

    // 2. Twilio WhatsApp API Driver Integration
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
          }
        }
      );

      console.log('✅ [WhatsApp Service] Sent via Twilio WhatsApp successfully:', response.data.sid);
      return { success: true, provider: 'twilio_whatsapp', messageId: response.data.sid };
    }

    // Default Fallback
    console.log('⚠️ [WhatsApp Service] No active WhatsApp credentials configured. Message logged locally.');
    return { success: true, mocked: true, text };
  } catch (error) {
    console.error('❌ [WhatsApp Service] Failed to send WhatsApp message:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
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

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppOTP,
  sendWhatsAppBookingConfirmation,
  sendWhatsAppSurveyReportAlert
};
