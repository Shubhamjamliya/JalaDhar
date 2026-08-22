const { sendEmail, sendOTPEmail, sendPaymentConfirmationEmail, sendBookingStatusUpdateEmail } = require('./emailService');
const { sendSMS, sendSMSOTP, sendBookingConfirmationSMS, sendSurveyReportSMS, sendSurveyOTPSMS } = require('./smsService');
const { 
  sendWhatsAppMessage, 
  sendWhatsAppOTP, 
  sendWhatsAppBookingConfirmation, 
  sendWhatsAppSurveyReportAlert,
  sendWhatsAppBookingAccepted,
  sendWhatsAppOnTheWay,
  sendWhatsAppScheduleConfirmation,
  sendWhatsAppNeedLocation,
  sendWhatsAppCustomerNotReachable,
  sendWhatsAppDelayNotification
} = require('./whatsappService');
const { sendNotification } = require('./notificationService');
const { getSetting } = require('./settingsService');

/**
 * Enterprise Multi-Channel Notification Orchestrator
 * Dispatches notifications across Email, SMS Text, WhatsApp, and In-App Push concurrently.
 */

/**
 * Send OTP across Email, SMS, and WhatsApp concurrently
 */
const dispatchOTP = async ({ email, phone, name, otp, type = 'verification' }) => {
  console.log('🚀 [Multi-Channel Notification] Dispatching OTP:', { email, phone, type });

  const tasks = [];

  // 1. Email Channel
  if (email) {
    tasks.push(
      sendOTPEmail({ email, name, otp, type })
        .catch(err => console.error('Email OTP dispatch error:', err))
    );
  }

  // 2. SMS Text Channel
  if (phone) {
    tasks.push(
      sendSMSOTP({ phone, otp, type })
        .catch(err => console.error('SMS OTP dispatch error:', err))
    );
  }

  // 3. WhatsApp Channel
  if (phone) {
    tasks.push(
      sendWhatsAppOTP({ phone, otp, name })
        .catch(err => console.error('WhatsApp OTP dispatch error:', err))
    );
  }

  const results = await Promise.allSettled(tasks);
  return { success: true, dispatches: results };
};

/**
 * Send Survey OTP (Start or End) across SMS Text and WhatsApp concurrently
 */
const dispatchSurveyOTP = async ({ phone, email, name, otp, stage = 'Start', bookingId, vendorName }) => {
  console.log(`🚀 [Multi-Channel Notification] Dispatching ${stage} Survey OTP:`, { phone, otp, bookingId });

  const tasks = [];

  // 1. SMS Text Channel
  if (phone) {
    tasks.push(
      sendSurveyOTPSMS({ phone, otp, stage, bookingId, vendorName })
        .catch(err => console.error(`SMS ${stage} Survey OTP dispatch error:`, err))
    );
  }

  // 2. WhatsApp Channel
  if (phone) {
    tasks.push(
      sendWhatsAppOTP({ phone, otp, name: name || 'Valued Customer' })
        .catch(err => console.error(`WhatsApp ${stage} Survey OTP dispatch error:`, err))
    );
  }

  const results = await Promise.allSettled(tasks);
  return { success: true, dispatches: results };
};

/**
 * Send Booking Confirmation across Email, SMS, WhatsApp, and In-App Push
 */
const dispatchBookingConfirmation = async ({ user, booking, vendor, io = null }) => {
  if (!user || !booking) return;

  const phone = user.phone || user.mobile;
  const email = user.email;
  const name = user.name || 'Valued Customer';
  const bookingId = booking.bookingId || booking._id?.toString()?.slice(-8);
  const serviceName = booking.service?.name || 'Groundwater Survey';
  const scheduledDate = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'As scheduled';

  console.log('🚀 [Multi-Channel Notification] Dispatching Booking Confirmation for ID:', bookingId);

  const tasks = [];

  // 1. In-App Notification & FCM Push
  if (user._id) {
    tasks.push(
      sendNotification({
        recipient: user._id,
        recipientModel: 'User',
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed!',
        message: `Your survey for ${serviceName} (ID: ${bookingId}) is confirmed for ${scheduledDate}.`,
        relatedEntity: { entityType: 'Booking', entityId: booking._id },
        metadata: { link: `/user/booking/${booking._id}` }
      }, io).catch(err => console.error('In-App Notification error:', err))
    );
  }

  // 2. SMS Channel
  if (phone) {
    tasks.push(
      sendBookingConfirmationSMS({ phone, bookingId, serviceName, scheduledDate })
        .catch(err => console.error('SMS Confirmation error:', err))
    );
  }

  // 3. WhatsApp Channel
  if (phone) {
    tasks.push(
      sendWhatsAppBookingConfirmation({ phone, name, bookingId, serviceName, scheduledDate })
        .catch(err => console.error('WhatsApp Confirmation error:', err))
    );
  }

  const results = await Promise.allSettled(tasks);
  return { success: true, dispatches: results };
};

/**
 * Helper to interpolate template tokens ({Customer Name}, {Expert Name}, {Booking ID}, {Date}, {Time}, {X})
 */
const interpolateTemplate = (templateString, variables = {}) => {
  if (!templateString) return '';
  return templateString
    .replace(/\{Customer Name\}/gi, variables.customerName || 'Customer')
    .replace(/\{Expert Name\}/gi, variables.expertName || 'Jaladhaara Expert')
    .replace(/\{Booking ID\}/gi, variables.bookingId || 'ORD-JALADHAR')
    .replace(/\{Date\}/gi, variables.date || 'Scheduled Date')
    .replace(/\{Time\}/gi, variables.time || 'Scheduled Time')
    .replace(/\{X\}/gi, String(variables.delayMinutes || '30'));
};

/**
 * Send Booking Accepted Multi-Channel Alert (including Automated WhatsApp)
 */
const dispatchBookingAccepted = async ({ user, booking, vendor, io = null }) => {
  if (!user || !booking) return;

  const phone = user.phone || user.mobile;
  if (!phone) return;

  const isAutoWhatsAppEnabled = await getSetting('ENABLE_AUTOMATED_WHATSAPP_NOTIFICATIONS', true);
  if (!isAutoWhatsAppEnabled) return;

  const customerName = user.name || 'Customer';
  const expertName = vendor?.name || 'Jaladhaara Expert';
  const bookingId = booking.bookingId || `ORD-${booking._id?.toString()?.slice(-8).toUpperCase()}`;

  const templatesConfig = await getSetting('WHATSAPP_TEMPLATES_CONFIG', null);
  const tmpl = templatesConfig?.booking_accepted;

  if (tmpl && tmpl.enabled === false) {
    console.log('ℹ️ [Multi-Channel] Booking Accepted WhatsApp template disabled by Admin');
    return;
  }

  const text = tmpl?.template
    ? interpolateTemplate(tmpl.template, { customerName, expertName, bookingId })
    : `Hello ${customerName}, This is ${expertName}, your assigned Jaladhaara Expert.\nI have accepted your Groundwater Survey booking (Booking ID: ${bookingId}). I will contact you shortly to confirm the survey schedule. Thank you.`;

  sendWhatsAppMessage({ phone, text })
    .catch(err => console.error('Automated WhatsApp Booking Accepted error:', err));
};

/**
 * Send On The Way (En Route) Multi-Channel Alert (including Automated WhatsApp)
 */
const dispatchOnTheWay = async ({ user, booking, vendor, io = null, expectedTime = 'shortly' }) => {
  if (!user || !booking) return;

  const phone = user.phone || user.mobile;
  if (!phone) return;

  const isAutoWhatsAppEnabled = await getSetting('ENABLE_AUTOMATED_WHATSAPP_NOTIFICATIONS', true);
  if (!isAutoWhatsAppEnabled) return;

  const customerName = user.name || 'Customer';
  const expertName = vendor?.name || 'Jaladhaara Expert';

  const templatesConfig = await getSetting('WHATSAPP_TEMPLATES_CONFIG', null);
  const tmpl = templatesConfig?.on_the_way;

  if (tmpl && tmpl.enabled === false) {
    console.log('ℹ️ [Multi-Channel] On The Way WhatsApp template disabled by Admin');
    return;
  }

  const text = tmpl?.template
    ? interpolateTemplate(tmpl.template, { customerName, expertName, time: expectedTime })
    : `Hello ${customerName},\nI am on my way to your survey location and expect to arrive at approximately ${expectedTime}. Please keep the site accessible. Thank you.`;

  sendWhatsAppMessage({ phone, text })
    .catch(err => console.error('Automated WhatsApp On The Way error:', err));
};

/**
 * Send Schedule Confirmed Multi-Channel Alert (including Automated WhatsApp)
 */
const dispatchScheduleConfirmed = async ({ user, booking, vendor, io = null, date, time }) => {
  if (!user || !booking) return;

  const phone = user.phone || user.mobile;
  if (!phone) return;

  const isAutoWhatsAppEnabled = await getSetting('ENABLE_AUTOMATED_WHATSAPP_NOTIFICATIONS', true);
  if (!isAutoWhatsAppEnabled) return;

  const customerName = user.name || 'Customer';
  const expertName = vendor?.name || 'Jaladhaara Expert';

  const templatesConfig = await getSetting('WHATSAPP_TEMPLATES_CONFIG', null);
  const tmpl = templatesConfig?.schedule_confirmation;

  if (tmpl && tmpl.enabled === false) {
    console.log('ℹ️ [Multi-Channel] Schedule Confirmation WhatsApp template disabled by Admin');
    return;
  }

  const text = tmpl?.template
    ? interpolateTemplate(tmpl.template, { customerName, expertName, date, time })
    : `Hello ${customerName},\nYour groundwater survey is scheduled for ${date} at ${time}. Kindly ensure someone is available at the site to assist during the survey.`;

  sendWhatsAppMessage({ phone, text })
    .catch(err => console.error('Automated WhatsApp Schedule Confirmation error:', err));
};

/**
 * Send Survey Report Upload Notification across Email, SMS, WhatsApp, and In-App Push
 */
const dispatchSurveyReportNotification = async ({ user, booking, expertName, reportUrl, io = null }) => {
  if (!user || !booking) return;

  const phone = user.phone || user.mobile;
  const email = user.email;
  const name = user.name || 'Valued Customer';
  const bookingId = booking.bookingId || booking._id?.toString()?.slice(-8);

  console.log('🚀 [Multi-Channel Notification] Dispatching Survey Report Alert for ID:', bookingId);

  const tasks = [];

  // 1. In-App Notification & FCM Push
  if (user._id) {
    tasks.push(
      sendNotification({
        recipient: user._id,
        recipientModel: 'User',
        type: 'REPORT_UPLOADED',
        title: 'Survey Report Uploaded!',
        message: `Hydrogeology report for Booking ID: ${bookingId} by ${expertName || 'Expert'} is now available.`,
        relatedEntity: { entityType: 'Booking', entityId: booking._id },
        metadata: { link: `/user/booking/${booking._id}/report` }
      }, io).catch(err => console.error('In-App Report Notification error:', err))
    );
  }

  // 2. SMS Channel
  if (phone) {
    tasks.push(
      sendSurveyReportSMS({ phone, bookingId, expertName })
        .catch(err => console.error('SMS Report Alert error:', err))
    );
  }

  // 3. WhatsApp Channel
  if (phone) {
    tasks.push(
      sendWhatsAppSurveyReportAlert({ phone, name, bookingId, expertName, reportUrl })
        .catch(err => console.error('WhatsApp Report Alert error:', err))
    );
  }

  const results = await Promise.allSettled(tasks);
  return { success: true, dispatches: results };
};

module.exports = {
  dispatchOTP,
  dispatchSurveyOTP,
  dispatchBookingConfirmation,
  dispatchBookingAccepted,
  dispatchOnTheWay,
  dispatchScheduleConfirmed,
  dispatchSurveyReportNotification
};
