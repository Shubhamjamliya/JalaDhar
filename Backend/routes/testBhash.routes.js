const express = require('express');
const router = express.Router();
const {
  formatBhashPhoneNumber,
  sendBookingConfirmedWhatsApp
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
    template: 'booking_confirmed',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * POST /api/test/bhash-whatsapp
 * Safely trigger a test booking_confirmed WhatsApp notification
 * Body: { phone, customerName, bookingId, bookingDate, bookingTime }
 */
router.post('/bhash-whatsapp', devOnly, async (req, res) => {
  try {
    const {
      phone,
      customerName = 'Valued Customer',
      bookingId = 'JD-' + Math.floor(1000 + Math.random() * 9000),
      bookingDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      bookingTime = '10:00 AM'
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

    const result = await sendBookingConfirmedWhatsApp({
      phone: formattedPhone,
      customerName,
      bookingId,
      bookingDate,
      bookingTime
    });

    return res.json({
      success: result.success,
      phone: formattedPhone,
      template: 'booking_confirmed',
      parameters: {
        customerName,
        bookingId,
        bookingDate,
        bookingTime
      },
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
