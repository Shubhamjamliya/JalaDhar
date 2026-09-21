const express = require('express');
const router = express.Router();
const {
  formatBhashPhoneNumber,
  sendBookingConfirmedWhatsApp,
  sendBookingCancelledWhatsApp,
  sendBookingAcceptedWhatsApp,
  sendExpertOnWayWhatsApp,
  sendFinalPaymentWhatsApp,
  sendReportReadyWhatsApp,
  sendExpertAssignmentWhatsApp,
  sendExpertReportRequiredWhatsApp
} = require('../services/bhashWhatsappService');

/**
 * Middleware: Ensure test endpoints only run in development/staging environments
 */
const devOnly = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Test endpoints are disabled in production environment.'
    });
  }
  next();
};

/**
 * GET /api/test/bhash-whatsapp/status
 * Check configuration status without exposing credentials
 */
router.get('/bhash-whatsapp/status', devOnly, (req, res) => {
  const isConfigured = Boolean(process.env.BHASH_PASSWORD);
  res.json({
    success: true,
    provider: 'BhashSMS WhatsApp Business API',
    user: process.env.BHASH_USER || 'Jaladhaara_1',
    sender: process.env.BHASH_SENDER || 'BUZWAP',
    apiUrl: process.env.BHASH_WA_UTILITY_API_URL || process.env.BHASH_API_URL || 'http://bhashsms.com/api/sendmsg.php',
    hasPassword: isConfigured,
    availableTemplates: [
      'booking_confirmed',
      'booking_cancelled',
      'booking_accepted',
      'expert_on_way',
      'final_payment',
      'report_ready',
      'expert_assignment',
      'expert_report_required'
    ],
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * POST /api/test/bhash-whatsapp
 * Safely trigger any approved/test BhashSMS WhatsApp notification
 * Body: { phone, template, customerName, bookingId, expertName, ... }
 */
router.post('/bhash-whatsapp', devOnly, async (req, res) => {
  try {
    const {
      phone,
      template = 'booking_confirmed',
      customerName = 'Valued Customer',
      expertName = 'Ramesh Hydrogeologist',
      bookingId = 'JD-' + Math.floor(1000 + Math.random() * 9000),
      bookingDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      bookingTime = '10:00 AM',
      remainingAmount = '4500',
      details = 'Customer requested cancellation due to schedule change',
      reportLink = 'https://jaladhar.com/user/bookings'
    } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required in request body (e.g. { "phone": "9876543210" })'
      });
    }

    const formattedPhone = formatBhashPhoneNumber(phone);
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        error: `Invalid phone number: "${phone}". Must be a valid 10-digit Indian mobile number.`
      });
    }

    let result;
    switch (template) {
      case 'booking_cancelled':
        result = await sendBookingCancelledWhatsApp({
          phone: formattedPhone,
          customerName,
          bookingId,
          details
        });
        break;

      case 'booking_accepted':
        result = await sendBookingAcceptedWhatsApp({
          phone: formattedPhone,
          customerName,
          expertName,
          bookingId,
          scheduledDate: `${bookingDate} at ${bookingTime}`
        });
        break;

      case 'expert_on_way':
        result = await sendExpertOnWayWhatsApp({
          phone: formattedPhone,
          customerName,
          expertName,
          bookingId
        });
        break;

      case 'final_payment':
        result = await sendFinalPaymentWhatsApp({
          phone: formattedPhone,
          customerName,
          bookingId,
          remainingAmount
        });
        break;

      case 'report_ready':
        result = await sendReportReadyWhatsApp({
          phone: formattedPhone,
          customerName,
          bookingId,
          expertName,
          reportLink
        });
        break;

      case 'expert_assignment':
        result = await sendExpertAssignmentWhatsApp({
          phone: formattedPhone,
          bookingId,
          location: req.body.location || 'Survey Location',
          scheduledDate: bookingDate,
          scheduledTime: bookingTime
        });
        break;

      case 'expert_report_required':
        result = await sendExpertReportRequiredWhatsApp({
          phone: formattedPhone,
          bookingId
        });
        break;

      case 'booking_confirmed':
      default:
        result = await sendBookingConfirmedWhatsApp({
          phone: formattedPhone,
          customerName,
          bookingId,
          bookingDate,
          bookingTime
        });
        break;
    }

    return res.json({
      success: result.success,
      phone: formattedPhone,
      template,
      gatewayResponse: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Test dispatch failed'
    });
  }
});

module.exports = router;
