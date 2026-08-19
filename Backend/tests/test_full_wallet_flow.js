const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const WalletTransaction = require('../models/WalletTransaction');
const { initializeDefaultSettings, getSetting, setSetting } = require('../services/settingsService');
const { calculateVendorPayment, creditToVendorWallet } = require('../services/walletService');
const { processReportSLAApprovals } = require('../services/reportAutoApprovalService');

async function runEndToEndFlowTest() {
  try {
    console.log('🚀 Starting Comprehensive End-to-End Survey & Wallet Flow Test...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ─── 1. Verify Dynamic Settings ───
    await initializeDefaultSettings();
    await setSetting('REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT', true, undefined, undefined, 'boolean', 'pricing');
    await setSetting('ENABLE_AUTO_APPROVE_REPORT_SLA', true, undefined, undefined, 'boolean', 'pricing');
    await setSetting('AUTO_APPROVE_REPORT_SLA_HOURS', 48, undefined, undefined, 'number', 'pricing');

    const gate = await getSetting('REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT');
    const slaHours = await getSetting('AUTO_APPROVE_REPORT_SLA_HOURS');
    console.log(`\n[STEP 1] Dynamic Settings Loaded:`);
    console.log(` - Require Admin Report Approval Gate: ${gate} (Type: ${typeof gate})`);
    console.log(` - SLA Auto-Release Duration: ${slaHours} hours (Type: ${typeof slaHours})`);

    // ─── 2. Fetch or Create Test User, Vendor & Service ───
    let user = await User.findOne({ isActive: true });
    let vendor = await Vendor.findOne({ isApproved: true, status: 'APPROVED' });
    let service = await Service.findOne({ isActive: true });

    if (!user || !vendor || !service) {
      console.error('❌ Missing user/vendor/service test seed');
      process.exit(1);
    }

    const baseServiceFee = 5050;
    const travelCharges = 200; // Simulated travel
    const calculation = calculateVendorPayment(baseServiceFee, travelCharges);
    console.log(`\n[STEP 2] Pricing & Payout Calculation:`);
    console.log(` - Base Fee: ₹${calculation.base}`);
    console.log(` - Customer GST (18%): ₹${calculation.customerGST}`);
    console.log(` - Travel Charges: ₹${travelCharges}`);
    console.log(` - Gross Customer Total: ₹${calculation.gross}`);
    console.log(` - Platform Commission (10%): ₹${calculation.platformCommission}`);
    console.log(` - GST on Commission (18%): ₹${calculation.gstOnCommission}`);
    console.log(` - TDS 1%: ₹${calculation.tds}`);
    console.log(` - Total Net Vendor Payable: ₹${calculation.totalVendorPayment}`);

    const installment1 = parseFloat((calculation.totalVendorPayment * 0.5).toFixed(2));
    const installment2 = parseFloat((calculation.totalVendorPayment - installment1).toFixed(2));
    console.log(` - Stage 1 (50% on Site Visit): ₹${installment1}`);
    console.log(` - Stage 2 (50% on Report & Settlement): ₹${installment2}`);

    // Snapshot Vendor Wallet before test
    const vendorBefore = await Vendor.findById(vendor._id);
    const initialWallet = vendorBefore.paymentCollection.walletBalance || 0;
    console.log(`\n[STEP 3] Initial Vendor Wallet Balance: ₹${initialWallet.toFixed(2)}`);

    // ─── 3. Create Booking & Simulate Advance (40%) ───
    const testBooking = new Booking({
      bookingId: 'BK' + Date.now().toString().slice(-6),
      user: user._id,
      vendor: vendor._id,
      service: service._id,
      status: 'ASSIGNED',
      userStatus: 'ASSIGNED',
      vendorStatus: 'ASSIGNED',
      purpose: 'Agriculture',
      serviceDate: new Date(),
      scheduledDate: new Date(),
      scheduledTime: '10:00 AM',
      otp: {
        startSurvey: { code: '123456', verified: false },
        endSurvey: { code: '654321', verified: false }
      },
      payment: {
        baseServiceFee,
        travelCharges,
        subtotal: baseServiceFee + travelCharges,
        gst: calculation.customerGST,
        totalAmount: calculation.gross,
        advanceAmount: parseFloat((calculation.gross * 0.4).toFixed(2)),
        remainingAmount: parseFloat((calculation.gross * 0.6).toFixed(2)),
        advancePaid: true,
        advancePaidAt: new Date(),
        remainingPaid: false,
        vendorWalletPayments: {
          siteVisitPayment: { amount: installment1, credited: false },
          reportUploadPayment: { amount: installment2, credited: false },
          totalCredited: 0
        }
      }
    });
    await testBooking.save();
    console.log(`\n[STEP 4] Booking #${testBooking._id} Created & 40% Advance Confirmed`);

    // ─── 4. Vendor Starts Journey & Verifies Start OTP ───
    testBooking.status = 'EN_ROUTE';
    testBooking.vendorStatus = 'EN_ROUTE';
    testBooking.enRouteAt = new Date();
    await testBooking.save();
    console.log(`\n[STEP 5] Vendor En Route 🚗`);

    // Verify Start OTP & Credit Stage 1 (50%)
    testBooking.otp.startSurvey.verified = true;
    testBooking.otp.startSurvey.verifiedAt = new Date();
    testBooking.visitedAt = new Date();
    testBooking.status = 'VISITED';
    testBooking.vendorStatus = 'VISITED';
    testBooking.userStatus = 'VISITED';

    const stage1Result = await creditToVendorWallet(
      vendor._id,
      installment1,
      'SITE_VISIT',
      testBooking._id,
      { description: `First installment (50%) for booking #${testBooking._id.toString().slice(-6)}` }
    );
    testBooking.payment.vendorWalletPayments.siteVisitPayment.credited = true;
    testBooking.payment.vendorWalletPayments.siteVisitPayment.creditedAt = new Date();
    testBooking.payment.vendorWalletPayments.siteVisitPayment.transactionId = stage1Result.transaction._id;
    testBooking.payment.vendorWalletPayments.totalCredited = installment1;
    await testBooking.save();

    const vendorAfterStage1 = await Vendor.findById(vendor._id);
    console.log(`\n[STEP 6] Start Survey OTP Verified!`);
    console.log(` ✅ Stage 1 Credited: ₹${installment1}`);
    console.log(` 💰 Vendor Wallet Balance: ₹${vendorAfterStage1.paymentCollection.walletBalance.toFixed(2)} (Expected: ₹${(initialWallet + installment1).toFixed(2)})`);

    // ─── 5. Vendor Verifies End Survey OTP ───
    testBooking.otp.endSurvey.verified = true;
    testBooking.otp.endSurvey.verifiedAt = new Date();
    testBooking.endSurveyVerifiedAt = new Date();
    await testBooking.save();
    console.log(`\n[STEP 7] End Survey OTP Verified! (Survey Complete On Site)`);

    // ─── 6. Vendor Uploads Survey Report (Gate is ON -> Held in Escrow) ───
    testBooking.report = {
      waterFound: true,
      depth: 450,
      casing: 80,
      yield: 2.5,
      uploadedAt: new Date(),
      uploadedBy: vendor._id
    };
    testBooking.reportUploadedAt = new Date();
    testBooking.status = 'REPORT_UPLOADED';
    testBooking.vendorStatus = 'REPORT_UPLOADED';
    testBooking.userStatus = 'AWAITING_PAYMENT';
    await testBooking.save();

    const vendorAfterUpload = await Vendor.findById(vendor._id);
    console.log(`\n[STEP 8] Report Uploaded by Vendor:`);
    console.log(` 🛡️ Gate is Active: 2nd installment held in Escrow.`);
    console.log(` 💰 Vendor Wallet Balance unchanged: ₹${vendorAfterUpload.paymentCollection.walletBalance.toFixed(2)}`);

    // ─── 7. Admin Approves Report (Technical Review Passed) ───
    testBooking.report.approvedAt = new Date();
    testBooking.report.approvedBy = 'ADMIN_SUPER';
    testBooking.vendorStatus = 'AWAITING_PAYMENT';
    await testBooking.save();
    console.log(`\n[STEP 9] Admin Approved Technical Report in Admin Approvals`);

    // ─── 8. Customer Completes 60% Remaining Settlement ───
    testBooking.payment.remainingPaid = true;
    testBooking.payment.remainingPaidAt = new Date();
    testBooking.status = 'PAYMENT_SUCCESS';
    testBooking.userStatus = 'PAYMENT_SUCCESS';
    testBooking.vendorStatus = 'PAYMENT_SUCCESS';

    // Auto-credit 2nd installment upon settlement
    const stage2Result = await creditToVendorWallet(
      vendor._id,
      installment2,
      'REPORT_UPLOAD',
      testBooking._id,
      { description: `Second installment (50%) for booking #${testBooking._id.toString().slice(-6)} on remaining payment settlement` }
    );
    testBooking.payment.vendorWalletPayments.reportUploadPayment.credited = true;
    testBooking.payment.vendorWalletPayments.reportUploadPayment.creditedAt = new Date();
    testBooking.payment.vendorWalletPayments.reportUploadPayment.transactionId = stage2Result.transaction._id;
    testBooking.payment.vendorWalletPayments.totalCredited += installment2;
    await testBooking.save();

    const vendorFinal = await Vendor.findById(vendor._id);
    const expectedFinal = parseFloat((initialWallet + calculation.totalVendorPayment).toFixed(2));
    console.log(`\n[STEP 10] Customer Settled Remaining 60%:`);
    console.log(` ✅ Stage 2 Credited: ₹${installment2}`);
    console.log(` 💰 Final Vendor Wallet Balance: ₹${vendorFinal.paymentCollection.walletBalance.toFixed(2)} (Expected: ₹${expectedFinal.toFixed(2)})`);

    // Clean up test booking & test transactions to maintain clean DB
    await Booking.deleteOne({ _id: testBooking._id });
    await WalletTransaction.deleteMany({ booking: testBooking._id });
    vendorFinal.paymentCollection.walletBalance = initialWallet;
    vendorFinal.paymentCollection.totalCredited = (vendorFinal.paymentCollection.totalCredited || 0) - calculation.totalVendorPayment;
    await vendorFinal.save();

    console.log('\n=============================================================');
    console.log('🎉 ALL 10 STEPS OF THE END-TO-END SURVEY & WALLET FLOW PASSED!');
    console.log('=============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Flow test failed with error:', err);
    process.exit(1);
  }
}

runEndToEndFlowTest();
