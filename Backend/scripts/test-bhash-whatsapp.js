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
  sendBookingConfirmedWhatsApp
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
const customerName = getArg('--name', 'Somil Kumar');
const bookingId = getArg('--id', 'JD-' + Math.floor(1000 + Math.random() * 9000));
const bookingDate = getArg('--date', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
const bookingTime = getArg('--time', '10:30 AM');

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
console.log(` • Priority/Stype:${process.env.BHASH_WA_PRIORITY || 'wa'} / ${process.env.BHASH_WA_STYPE || 'normal'}`);
console.log('----------------------------------------------------');

const formattedPhone = formatBhashPhoneNumber(rawPhone);
console.log('📱 Phone Number Sanitization Test:');
console.log(` • Input:         "${rawPhone}"`);
console.log(` • Formatted:     "${formattedPhone}" (must be 10 digits without +91)`);
console.log(` • Valid:         ${formattedPhone ? '✅ YES' : '❌ NO'}`);
console.log('----------------------------------------------------');

console.log('📝 Template Test Data (booking_confirmed):');
console.log(` • {{1}} Customer Name: "${customerName}"`);
console.log(` • {{2}} Booking ID:    "${bookingId}"`);
console.log(` • {{3}} Booking Date:  "${bookingDate}"`);
console.log(` • {{4}} Booking Time:  "${bookingTime}"`);
console.log(` • {{5}} Booking ID:    "${bookingId}"`);
console.log('====================================================');

if (!formattedPhone) {
  console.error('\n❌ Test aborted: Please provide a valid 10-digit Indian phone number via --phone <number>.');
  process.exit(1);
}

if (!bhashPass) {
  console.log('\n⚠️ Notice: BHASH_PASSWORD is not set in Backend/.env.');
  console.log('To send a real WhatsApp message to an active device:');
  console.log('  1. Open Backend/.env');
  console.log('  2. Set BHASH_PASSWORD=your_actual_password');
  console.log('  3. Re-run: node scripts/test-bhash-whatsapp.js --phone <your_10_digit_number>\n');
  console.log('Simulating call without password...');
}

(async () => {
  try {
    const result = await sendBookingConfirmedWhatsApp({
      phone: formattedPhone,
      customerName,
      bookingId,
      bookingDate,
      bookingTime
    });

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
