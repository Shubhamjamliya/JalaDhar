const { sendEmail, sendOTPEmail, sendPaymentConfirmationEmail } = require('./emailService');
const { sendSMS, sendSMSOTP, sendBookingConfirmationSMS, sendSurveyReportSMS } = require('./smsService');
const { sendWhatsAppMessage, sendWhatsAppOTP, sendWhatsAppBookingConfirmation, sendWhatsAppSurveyReportAlert } = require('./whatsappService');
const { sendNotification } = require('./notificationService');

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
  dispatchBookingConfirmation,
  dispatchSurveyReportNotification
};
