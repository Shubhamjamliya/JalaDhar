#!/usr/bin/env node

/**
 * Standalone Test Script for BhashSMS WhatsApp Business API
 * Usage:
 *   node scripts/test-bhash-whatsapp.js --phone 9876543210
 *   node scripts/test-bhash-whatsapp.js --phone 9876543210 --name "Somil Kumar" --id "BK-1001"
 */

const path = require('path');
// Load Backend .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const {
  formatBhashPhoneNumber,
  sendBookingConfirmedWhatsApp,
  sendBookingCancelledWhatsApp,
  sendBookingAcceptedWhatsApp,
  sendExpertOnWayWhatsApp,
  sendFinalPaymentWhatsApp,
  sendReportReadyWhatsApp
} = require('../services/bhashWhatsappService');

// Parse CLI flags
const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
    return args[idx + 1];
  }
  return fallback;
};

const rawPhone = getArg('--phone', process.env.TEST_PHONE || '9876543210');
const templateName = getArg('--template', 'booking_confirmed');
const customerName = getArg('--name', 'Somil Kumar');
const expertName = getArg('--expert', 'Rajesh Hydrogeologist');
const bookingId = getArg('--id', 'JD-' + Math.floor(1000 + Math.random() * 9000));
const bookingDate = getArg('--date', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
const bookingTime = getArg('--time', '10:30 AM');
const remainingAmount = getArg('--amount', '4500');
const details = getArg('--details', 'Schedule conflict resolved');
const reportLink = getArg('--link', 'https://jaladhar.com/user/bookings');

console.log('====================================================');
console.log('🚀 BhashSMS WhatsApp Business API — Test Runner');
console.log('====================================================');

const bhashUser = process.env.BHASH_USER || 'Jaladhaara_1';
const bhashPass = process.env.BHASH_PASSWORD;
const bhashSender = process.env.BHASH_SENDER || 'BUZWAP';
const bhashUrl = process.env.BHASH_WA_UTILITY_API_URL || process.env.BHASH_API_URL || 'http://bhashsms.com/api/sendmsg.php';

console.log('📋 Environment Configuration:');
console.log(` • BHASH_USER:    ${bhashUser}`);
console.log(` • BHASH_PASSWORD:${bhashPass ? ' [Configured, ' + bhashPass.length + ' chars]' : ' ⚠️ [NOT SET in Backend/.env]'}`);
console.log(` • BHASH_SENDER:  ${bhashSender}`);
console.log(` • BHASH_API_URL: ${bhashUrl}${process.env.BHASH_WA_UTILITY_API_URL ? ' [Overridden via BHASH_WA_UTILITY_API_URL]' : ''}`);
console.log(` • Template:      ${templateName}`);
console.log('----------------------------------------------------');

const formattedPhone = formatBhashPhoneNumber(rawPhone);
console.log('📱 Phone Number Sanitization Test:');
console.log(` • Input:         "${rawPhone}"`);
console.log(` • Formatted:     "${formattedPhone}" (must be 10 digits without +91)`);
console.log(` • Valid:         ${formattedPhone ? '✅ YES' : '❌ NO'}`);
console.log('----------------------------------------------------');

if (!formattedPhone) {
  console.error('\n❌ Test aborted: Please provide a valid 10-digit Indian phone number via --phone <number>.');
  process.exit(1);
}

(async () => {
  try {
    let result;
    switch (templateName) {
      case 'booking_cancelled':
        console.log('📝 Template: booking_cancelled (3 params):', [customerName, bookingId, details]);
        result = await sendBookingCancelledWhatsApp({
          phone: formattedPhone,
          customerName,
          bookingId,
          details
        });
        break;

      case 'booking_accepted':
        console.log('📝 Template: booking_accepted (4 params):', [customerName, expertName, bookingId, `${bookingDate} at ${bookingTime}`]);
        result = await sendBookingAcceptedWhatsApp({
          phone: formattedPhone,
          customerName,
          expertName,
          bookingId,
          scheduledDate: `${bookingDate} at ${bookingTime}`
        });
        break;

      case 'expert_on_way':
        console.log('📝 Template: expert_on_way (3 params):', [customerName, expertName, bookingId]);
        result = await sendExpertOnWayWhatsApp({
          phone: formattedPhone,
          customerName,
          expertName,
          bookingId
        });
        break;

      case 'final_payment':
        console.log('📝 Template: final_payment (3 params):', [customerName, bookingId, remainingAmount]);
        result = await sendFinalPaymentWhatsApp({
          phone: formattedPhone,
          customerName,
          bookingId,
          remainingAmount
        });
        break;

      case 'report_ready':
        console.log('📝 Template: report_ready (4 params):', [customerName, bookingId, expertName, reportLink]);
        result = await sendReportReadyWhatsApp({
          phone: formattedPhone,
          customerName,
          bookingId,
          expertName,
          reportLink
        });
        break;

      case 'booking_confirmed':
      default:
        console.log('📝 Template: booking_confirmed (5 params):', [customerName, bookingId, bookingDate, bookingTime, bookingId]);
        result = await sendBookingConfirmedWhatsApp({
          phone: formattedPhone,
          customerName,
          bookingId,
          bookingDate,
          bookingTime
        });
        break;
    }

    console.log('\n📡 Dispatch Result:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n🎉 SUCCESS: Message accepted by BhashSMS gateway!');
    } else {
      console.error(`\n❌ FAILURE: Gateway rejected dispatch: "${result.error}"`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('\n💥 Unexpected script execution error:', err.message);
    process.exitCode = 1;
  } finally {
    console.log('====================================================\n');
  }
})();
