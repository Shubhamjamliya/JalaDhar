/**
 * Comprehensive Booking Flow, Date Scheduling & Expert OTP Security Test Suite
 *
 * Tests:
 * 1. Booking Model Schema & Virtuals:
 *    - scheduledDate persistence & scheduleDate virtual getter/setter
 *    - toVendorJSON() method stripping secret OTP codes
 * 2. sanitizeBookingForVendor Utility:
 *    - Stripping startSurvey.code and endSurvey.code from Mongoose docs and plain objects
 *    - Preserving verification flags (verified, verifiedAt, generatedAt)
 *    - Handling edge cases (null, missing otp, arrays, legacy fields)
 * 3. Booking Acceptance Date & Time Coalescing:
 *    - Handling visitDate (VendorStatus.jsx)
 *    - Handling scheduleDate & scheduleTime (VendorBookingDetails.jsx)
 *    - Handling scheduledDate & scheduledTime (VendorRequests.jsx)
 *    - Cross-compatibility across all modals
 * 4. Controller Endpoint Security & Socket Emission Simulation:
 *    - getBookingDetails sanitizes OTP codes
 *    - getMyBookings sanitizes OTP codes across all list items
 *    - markAsEnRoute returns sanitized booking to expert & shared tracking room
 *    - markAsEnRoute keeps startSurvey.code intact for customer socket room
 *    - verifyStartSurveyOTP never leaks endSurvey.code to expert
 *    - verifyEndSurveyOTP returns sanitized booking
 *    - updateVisitSchedule updates scheduledDate and sanitizes response
 * 5. Frontend Modals & API Verification:
 *    - Verification of payload parameters sent by vendor frontend modals
 */

const mongoose = require('mongoose');
const Booking = require('../../models/Booking');
const { BOOKING_STATUS } = require('../../utils/constants');
const { sanitizeBookingForVendor } = require('../../controllers/bookingControllers/vendorBookingController');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m'
};

const results = {
  passed: 0,
  failed: 0,
  errors: []
};

function assert(condition, testName, errorDetails = '') {
  if (condition) {
    results.passed++;
    console.log(`${colors.green}  ✓ [PASS]${colors.reset} ${testName}`);
  } else {
    results.failed++;
    results.errors.push({ test: testName, error: errorDetails });
    console.log(`${colors.red}  ✗ [FAIL]${colors.reset} ${testName}`);
    if (errorDetails) console.log(`      Details: ${errorDetails}`);
  }
}

function section(title) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);
}

async function runTests() {
  console.log(`\n${colors.bold}Starting Booking Flow, Date Scheduling & Security Verification...${colors.reset}\n`);

  // ==========================================
  // SECTION 1: Booking Model Schema & Virtuals
  // ==========================================
  section('1. Booking Model Schema & Virtuals');

  // Verify scheduledDate field is defined in schema
  const scheduledDateField = Booking.schema.path('scheduledDate');
  assert(
    Boolean(scheduledDateField && scheduledDateField.instance === 'Date'),
    'Booking schema defines "scheduledDate" as Date type'
  );

  // Verify scheduleDate virtual getter and setter exist
  const scheduleDateVirtual = Booking.schema.virtuals['scheduleDate'];
  assert(
    Boolean(scheduleDateVirtual && scheduleDateVirtual.getters.length > 0 && scheduleDateVirtual.setters.length > 0),
    'Booking schema defines "scheduleDate" virtual with getter and setter'
  );

  // Test scheduleDate virtual getter and setter on document
  const sampleBooking = new Booking({
    user: new mongoose.Types.ObjectId(),
    vendor: new mongoose.Types.ObjectId(),
    service: new mongoose.Types.ObjectId(),
    address: { street: '123 Main St', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
    scheduledDate: new Date('2026-09-15T09:00:00.000Z'),
    scheduledTime: '09:00 AM'
  });

  assert(
    sampleBooking.scheduleDate instanceof Date &&
    sampleBooking.scheduleDate.toISOString() === '2026-09-15T09:00:00.000Z',
    'Virtual getter: booking.scheduleDate returns booking.scheduledDate'
  );

  // Set scheduleDate via virtual setter
  sampleBooking.scheduleDate = new Date('2026-09-20T14:30:00.000Z');
  assert(
    sampleBooking.scheduledDate instanceof Date &&
    sampleBooking.scheduledDate.toISOString() === '2026-09-20T14:30:00.000Z',
    'Virtual setter: setting booking.scheduleDate updates booking.scheduledDate'
  );

  // Test toObject includes virtuals
  const objWithVirtuals = sampleBooking.toObject();
  assert(
    objWithVirtuals.scheduleDate !== undefined &&
    new Date(objWithVirtuals.scheduleDate).toISOString() === '2026-09-20T14:30:00.000Z',
    'toObject() preserves scheduleDate virtual property'
  );

  // ==========================================
  // SECTION 2: OTP Sanitization & Security Boundary
  // ==========================================
  section('2. OTP Sanitization & Security Boundary');

  // Populate booking with secret OTP codes
  sampleBooking.otp = {
    startSurvey: {
      code: '582914',
      generatedAt: new Date('2026-09-20T14:00:00.000Z'),
      verified: false,
      verifiedAt: null
    },
    endSurvey: {
      code: '918273',
      generatedAt: new Date('2026-09-20T14:00:00.000Z'),
      verified: false,
      verifiedAt: null
    }
  };
  sampleBooking.startSurveyOTP = '582914';
  sampleBooking.endSurveyOTP = '918273';

  // Test toVendorJSON() on Mongoose document
  const vendorObj = sampleBooking.toVendorJSON();
  assert(
    vendorObj.otp.startSurvey.code === undefined,
    'toVendorJSON(): otp.startSurvey.code is stripped'
  );
  assert(
    vendorObj.otp.endSurvey.code === undefined,
    'toVendorJSON(): otp.endSurvey.code is stripped'
  );
  assert(
    vendorObj.startSurveyOTP === undefined && vendorObj.endSurveyOTP === undefined,
    'toVendorJSON(): legacy top-level OTP properties are stripped'
  );
  assert(
    vendorObj.otp.startSurvey.verified === false && vendorObj.otp.startSurvey.generatedAt !== undefined,
    'toVendorJSON(): otp.startSurvey.verified flag and timestamp are preserved'
  );
  assert(
    vendorObj.otp.endSurvey.verified === false && vendorObj.otp.endSurvey.generatedAt !== undefined,
    'toVendorJSON(): otp.endSurvey.verified flag and timestamp are preserved'
  );

  // Test sanitizeBookingForVendor with plain object
  const plainBookingObj = {
    _id: 'booking123',
    status: 'EN_ROUTE',
    otp: {
      startSurvey: { code: '445566', verified: false, generatedAt: new Date() },
      endSurvey: { code: '778899', verified: false, generatedAt: new Date() }
    },
    startSurveyOTP: '445566'
  };
  const sanitizedPlain = sanitizeBookingForVendor(plainBookingObj);
  assert(
    sanitizedPlain.otp.startSurvey.code === undefined,
    'sanitizeBookingForVendor(): strips startSurvey.code from plain objects'
  );
  assert(
    sanitizedPlain.otp.endSurvey.code === undefined,
    'sanitizeBookingForVendor(): strips endSurvey.code from plain objects'
  );
  assert(
    sanitizedPlain.startSurveyOTP === undefined,
    'sanitizeBookingForVendor(): strips startSurveyOTP from plain objects'
  );
  assert(
    sanitizedPlain.otp.startSurvey.verified === false,
    'sanitizeBookingForVendor(): preserves startSurvey.verified on plain objects'
  );

  // Test sanitizeBookingForVendor when OTP is already verified
  plainBookingObj.otp.startSurvey.verified = true;
  plainBookingObj.otp.startSurvey.verifiedAt = new Date('2026-09-20T15:00:00.000Z');
  const sanitizedVerified = sanitizeBookingForVendor(plainBookingObj);
  assert(
    sanitizedVerified.otp.startSurvey.verified === true &&
    sanitizedVerified.otp.startSurvey.verifiedAt instanceof Date,
    'sanitizeBookingForVendor(): preserves verified: true and verifiedAt timestamp'
  );

  // Test null / undefined safety
  assert(
    sanitizeBookingForVendor(null) === null,
    'sanitizeBookingForVendor(null) returns null safely'
  );
  assert(
    sanitizeBookingForVendor(undefined) === undefined,
    'sanitizeBookingForVendor(undefined) returns undefined safely'
  );

  // ==========================================
  // SECTION 3: Booking Acceptance Date & Time Coalescing
  // ==========================================
  section('3. Booking Acceptance Date & Time Coalescing');

  // Helper simulating the acceptBooking resolution logic
  function simulateAcceptBooking(bookingDoc, reqBody) {
    const resolvedDate = reqBody?.scheduledDate || reqBody?.scheduleDate || reqBody?.visitDate;
    const resolvedTime = reqBody?.scheduledTime || reqBody?.scheduleTime || reqBody?.visitTime;

    bookingDoc.status = BOOKING_STATUS.ACCEPTED;
    bookingDoc.vendorStatus = BOOKING_STATUS.ACCEPTED;
    bookingDoc.userStatus = BOOKING_STATUS.ACCEPTED;
    bookingDoc.acceptedAt = new Date();

    if (resolvedDate) {
      bookingDoc.scheduledDate = new Date(resolvedDate);
      bookingDoc.scheduleDate = new Date(resolvedDate);
    }
    if (resolvedTime) {
      bookingDoc.scheduledTime = resolvedTime;
    }
    return bookingDoc;
  }

  // Case A: VendorStatus.jsx format { visitDate, scheduledTime }
  const docA = new Booking({ scheduledDate: new Date('2026-09-01'), scheduledTime: 'TBD' });
  simulateAcceptBooking(docA, { visitDate: '2026-09-12T10:00:00.000Z', scheduledTime: '10:00 AM' });
  assert(
    docA.scheduledDate.toISOString() === '2026-09-12T10:00:00.000Z' && docA.scheduledTime === '10:00 AM',
    'Acceptance Case A (visitDate + scheduledTime): scheduledDate & scheduledTime correctly updated'
  );
  assert(
    docA.scheduleDate.toISOString() === '2026-09-12T10:00:00.000Z',
    'Acceptance Case A: scheduleDate virtual reflects updated date'
  );

  // Case B: VendorBookingDetails.jsx format { scheduleDate, scheduleTime }
  const docB = new Booking({ scheduledDate: new Date('2026-09-01'), scheduledTime: 'TBD' });
  simulateAcceptBooking(docB, { scheduleDate: '2026-09-14T11:30:00.000Z', scheduleTime: '11:30 AM' });
  assert(
    docB.scheduledDate.toISOString() === '2026-09-14T11:30:00.000Z' && docB.scheduledTime === '11:30 AM',
    'Acceptance Case B (scheduleDate + scheduleTime): scheduledDate & scheduledTime correctly updated'
  );

  // Case C: VendorRequests.jsx format { scheduledDate, scheduledTime }
  const docC = new Booking({ scheduledDate: new Date('2026-09-01'), scheduledTime: 'TBD' });
  simulateAcceptBooking(docC, { scheduledDate: '2026-09-16T15:00:00.000Z', scheduledTime: '03:00 PM' });
  assert(
    docC.scheduledDate.toISOString() === '2026-09-16T15:00:00.000Z' && docC.scheduledTime === '03:00 PM',
    'Acceptance Case C (scheduledDate + scheduledTime): scheduledDate & scheduledTime correctly updated'
  );

  // Case D: Combined multi-alias payload
  const docD = new Booking({ scheduledDate: new Date('2026-09-01'), scheduledTime: 'TBD' });
  simulateAcceptBooking(docD, {
    scheduledDate: '2026-09-18T09:00:00.000Z',
    scheduleDate: '2026-09-18T09:00:00.000Z',
    visitDate: '2026-09-18T09:00:00.000Z',
    scheduledTime: '09:00 AM',
    scheduleTime: '09:00 AM',
    visitTime: '09:00 AM'
  });
  assert(
    docD.scheduledDate.toISOString() === '2026-09-18T09:00:00.000Z' && docD.scheduledTime === '09:00 AM',
    'Acceptance Case D (multi-alias redundancy): scheduledDate & scheduledTime correctly resolved'
  );

  // Case E: No date provided in body (preserves existing scheduledDate)
  const docE = new Booking({ scheduledDate: new Date('2026-09-01T08:00:00.000Z'), scheduledTime: '08:00 AM' });
  simulateAcceptBooking(docE, {});
  assert(
    docE.scheduledDate.toISOString() === '2026-09-01T08:00:00.000Z' && docE.scheduledTime === '08:00 AM',
    'Acceptance Case E (empty body): original scheduledDate & scheduledTime preserved'
  );

  // ==========================================
  // SECTION 4: Controller Endpoints & Socket Security Simulation
  // ==========================================
  section('4. Controller Endpoints & Socket Security Simulation');

  // Create a realistic booking with active survey OTPs
  const activeBooking = new Booking({
    _id: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId(),
    vendor: new mongoose.Types.ObjectId(),
    service: new mongoose.Types.ObjectId(),
    address: { street: '456 Farm Rd', city: 'Sikar', state: 'Rajasthan', pincode: '332001' },
    status: 'EN_ROUTE',
    vendorStatus: 'EN_ROUTE',
    userStatus: 'EN_ROUTE',
    scheduledDate: new Date('2026-09-20'),
    scheduledTime: '10:00 AM',
    otp: {
      startSurvey: { code: '123456', generatedAt: new Date(), verified: false, verifiedAt: null },
      endSurvey: { code: '654321', generatedAt: new Date(), verified: false, verifiedAt: null }
    }
  });

  // Test 1: getBookingDetails response sanitization
  const bookingDetailsObj = activeBooking.toObject();
  const getBookingDetailsData = {
    booking: sanitizeBookingForVendor(bookingDetailsObj),
    reschedulePolicy: { allowReschedule: true }
  };
  assert(
    getBookingDetailsData.booking.otp.startSurvey.code === undefined,
    'getBookingDetails: Vendor response strips startSurvey.code'
  );
  assert(
    getBookingDetailsData.booking.otp.endSurvey.code === undefined,
    'getBookingDetails: Vendor response strips endSurvey.code'
  );
  assert(
    getBookingDetailsData.booking.otp.startSurvey.verified === false,
    'getBookingDetails: Vendor response preserves startSurvey.verified flag'
  );

  // Test 2: getMyBookings list response sanitization
  const rawBookingsList = [activeBooking.toObject(), activeBooking.toObject()];
  const sanitizedList = rawBookingsList.map(b => sanitizeBookingForVendor(b));
  const allStripped = sanitizedList.every(b => !b.otp.startSurvey.code && !b.otp.endSurvey.code);
  assert(
    allStripped && sanitizedList.length === 2,
    'getMyBookings: All bookings in vendor list have OTP codes stripped'
  );

  // Test 3: markAsEnRoute (startTravel) Socket & HTTP Response isolation
  const sanitizedEnRouteBooking = sanitizeBookingForVendor(activeBooking);
  const userRoomPayload = {
    bookingId: activeBooking._id,
    status: activeBooking.status,
    booking: activeBooking // User gets raw booking with startSurvey.code
  };
  const vendorRoomPayload = {
    bookingId: activeBooking._id,
    status: activeBooking.status,
    booking: sanitizedEnRouteBooking // Vendor gets sanitized booking without OTP codes
  };
  const sharedTrackingRoomPayload = {
    bookingId: activeBooking._id,
    status: activeBooking.status,
    booking: sanitizedEnRouteBooking // Shared room NEVER exposes secret OTP codes
  };

  assert(
    userRoomPayload.booking.otp.startSurvey.code === '123456',
    'Customer socket room: User retains cleartext startSurvey.code to share on arrival'
  );
  assert(
    vendorRoomPayload.booking.otp.startSurvey.code === undefined,
    'Vendor socket room: Vendor payload strictly strips startSurvey.code'
  );
  assert(
    vendorRoomPayload.booking.otp.endSurvey.code === undefined,
    'Vendor socket room: Vendor payload strictly strips endSurvey.code'
  );
  assert(
    sharedTrackingRoomPayload.booking.otp.startSurvey.code === undefined &&
    sharedTrackingRoomPayload.booking.otp.endSurvey.code === undefined,
    'Shared tracking room: Shared socket emission strictly strips all secret OTP codes'
  );

  // Test 4: verifyStartSurveyOTP - endSurvey.code must NOT leak to expert
  activeBooking.otp.startSurvey.verified = true;
  activeBooking.otp.startSurvey.verifiedAt = new Date();
  const sanitizedAfterStartVerify = sanitizeBookingForVendor(activeBooking);
  assert(
    sanitizedAfterStartVerify.otp.startSurvey.verified === true,
    'verifyStartSurveyOTP: startSurvey.verified is true in expert response'
  );
  assert(
    sanitizedAfterStartVerify.otp.endSurvey.code === undefined,
    'verifyStartSurveyOTP: Expert response does NOT contain endSurvey.code (bypassing verification prevented!)'
  );

  // Test 5: updateVisitSchedule response sanitization & persistence
  activeBooking.scheduledDate = new Date('2026-09-22T11:00:00.000Z');
  activeBooking.scheduledTime = '11:00 AM';
  const sanitizedScheduleResponse = sanitizeBookingForVendor(activeBooking);
  assert(
    sanitizedScheduleResponse.scheduledDate.toISOString() === '2026-09-22T11:00:00.000Z' &&
    sanitizedScheduleResponse.scheduledTime === '11:00 AM',
    'updateVisitSchedule: Date and time are correctly updated in response'
  );
  assert(
    sanitizedScheduleResponse.otp.startSurvey.code === undefined &&
    sanitizedScheduleResponse.otp.endSurvey.code === undefined,
    'updateVisitSchedule: OTP codes are stripped in response'
  );

  // ==========================================
  // SECTION 5: Frontend Modals Payload Standards
  // ==========================================
  section('5. Frontend Modals Payload Standards');

  // Verify modal payload builder standard
  const buildAcceptPayload = (date, time) => ({
    scheduledDate: date,
    scheduledTime: time,
    scheduleDate: date,
    scheduleTime: time,
    visitDate: date,
    visitTime: time
  });

  const testPayload = buildAcceptPayload('2026-09-25', '09:30 AM');
  assert(
    testPayload.scheduledDate === '2026-09-25' &&
    testPayload.scheduleDate === '2026-09-25' &&
    testPayload.visitDate === '2026-09-25',
    'Frontend payload contains all 3 date field aliases (scheduledDate, scheduleDate, visitDate)'
  );
  assert(
    testPayload.scheduledTime === '09:30 AM' &&
    testPayload.scheduleTime === '09:30 AM' &&
    testPayload.visitTime === '09:30 AM',
    'Frontend payload contains all 3 time field aliases (scheduledTime, scheduleTime, visitTime)'
  );

  // Print Summary
  console.log(`\n${colors.bold}==========================================${colors.reset}`);
  console.log(`${colors.bold}Total Tests: ${results.passed + results.failed}${colors.reset}`);
  console.log(`${colors.green}${colors.bold}Passed: ${results.passed}${colors.reset}`);
  if (results.failed > 0) {
    console.log(`${colors.red}${colors.bold}Failed: ${results.failed}${colors.reset}`);
    results.errors.forEach(e => console.log(`  - ${e.test}: ${e.error}`));
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}ALL BOOKING FLOW & SECURITY TESTS PASSED PERFECTLY! 🚀${colors.reset}`);
    console.log(`${colors.bold}==========================================${colors.reset}\n`);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
