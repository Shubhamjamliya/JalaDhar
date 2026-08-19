const Booking = require('../models/Booking');
const Dispute = require('../models/Dispute');
const { getSetting } = require('./settingsService');
const { creditToVendorWallet } = require('./walletService');
const { sendNotification } = require('./notificationService');
const { BOOKING_STATUS } = require('../utils/constants');

/**
 * Process bookings that exceeded the SLA grace period for Admin report approval
 */
const processReportSLAApprovals = async () => {
  try {
    const requireApproval = await getSetting('REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT', true);
    const enableSLA = await getSetting('ENABLE_AUTO_APPROVE_REPORT_SLA', true);
    const slaHours = Number(await getSetting('AUTO_APPROVE_REPORT_SLA_HOURS', 48));

    if (!requireApproval || !enableSLA || isNaN(slaHours) || slaHours <= 0) {
      return { success: true, processed: 0, message: 'SLA auto-approval is disabled or instant payout is active' };
    }

    const cutoffDate = new Date(Date.now() - (slaHours * 60 * 60 * 1000));

    // Find all bookings with uploaded reports older than the SLA threshold that haven't been credited/approved
    const pendingBookings = await Booking.find({
      status: { $in: [BOOKING_STATUS.REPORT_UPLOADED, BOOKING_STATUS.AWAITING_PAYMENT, BOOKING_STATUS.VISITED] },
      reportUploadedAt: { $lte: cutoffDate, $ne: null },
      'report.approvedAt': null,
      'payment.vendorWalletPayments.reportUploadPayment.credited': { $ne: true }
    }).populate('vendor', 'name email phone').populate('user', 'name email');

    if (!pendingBookings || pendingBookings.length === 0) {
      return { success: true, processed: 0, message: 'No bookings pending SLA auto-approval' };
    }

    let processedCount = 0;
    let io = null;
    try {
      const { getIO } = require('../sockets');
      io = getIO();
    } catch (e) {}

    for (const booking of pendingBookings) {
      // Safety Check: Verify there are no open user disputes against this survey
      const openDispute = await Dispute.findOne({
        booking: booking._id,
        status: { $in: ['OPEN', 'UNDER_REVIEW', 'PENDING'] }
      });

      if (openDispute) {
        console.log(`[SLA Payout] Skipping booking #${booking._id.toString().slice(-6)} due to open dispute #${openDispute._id}`);
        continue;
      }

      const paymentAmount = booking.payment?.vendorWalletPayments?.reportUploadPayment?.amount || 0;
      const vendorId = booking.vendor?._id || booking.vendor;

      if (paymentAmount > 0 && vendorId) {
        const creditResult = await creditToVendorWallet(
          vendorId,
          paymentAmount,
          'REPORT_UPLOAD',
          booking._id,
          {
            description: `Second installment (50%) Auto-Approved via ${slaHours}h SLA Grace Timer for booking #${booking._id.toString().slice(-6)}`,
            slaHours,
            autoApproved: true
          }
        );

        if (creditResult.success) {
          booking.report.approvedAt = new Date();
          booking.report.approvedBy = 'SYSTEM_SLA_TIMER';
          booking.vendorStatus = BOOKING_STATUS.AWAITING_PAYMENT;

          if (!booking.payment.vendorWalletPayments) {
            booking.payment.vendorWalletPayments = {};
          }
          if (!booking.payment.vendorWalletPayments.reportUploadPayment) {
            booking.payment.vendorWalletPayments.reportUploadPayment = {};
          }

          booking.payment.vendorWalletPayments.reportUploadPayment.credited = true;
          booking.payment.vendorWalletPayments.reportUploadPayment.creditedAt = new Date();
          booking.payment.vendorWalletPayments.reportUploadPayment.transactionId = creditResult.transaction._id;
          booking.payment.vendorWalletPayments.totalCredited =
            (booking.payment.vendorWalletPayments.totalCredited || 0) + paymentAmount;

          await booking.save();
          processedCount++;

          // Send real-time notification to the expert
          try {
            await sendNotification({
              recipient: vendorId,
              recipientModel: 'Vendor',
              type: 'REPORT_APPROVED',
              title: '2nd Installment Auto-Approved (SLA) 💰',
              message: `Your groundwater survey report for booking #${booking._id.toString().slice(-6)} has been automatically approved (${slaHours}h SLA timer). ₹${paymentAmount.toFixed(2)} credited to your wallet.`,
              relatedEntity: { entityType: 'Booking', entityId: booking._id },
              metadata: { bookingId: booking._id.toString(), amount: paymentAmount }
            }, io);
          } catch (notifErr) {
            console.error('[SLA Payout] Notification error:', notifErr);
          }

          // Socket Broadcast
          if (io) {
            const bookingPayload = {
              bookingId: booking._id,
              status: booking.status,
              userStatus: booking.userStatus,
              vendorStatus: booking.vendorStatus,
              booking
            };
            io.to(`booking_${booking._id}`).emit('booking_updated', bookingPayload);
            io.to(`vendor_${vendorId}`).to(`Vendor_${vendorId}`).emit('booking_updated', bookingPayload);
          }
        }
      }
    }

    console.log(`[SLA Payout] Successfully auto-approved ${processedCount} report payouts.`);
    return { success: true, processed: processedCount };
  } catch (error) {
    console.error('[processReportSLAApprovals] Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Start recurring background SLA timer worker (runs every 15 minutes)
 */
let cronInterval = null;
const startAutoApprovalCron = () => {
  if (cronInterval) clearInterval(cronInterval);
  
  // Initial check 30 seconds after server start
  setTimeout(() => {
    processReportSLAApprovals();
  }, 30000);

  // Recurring check every 15 minutes
  cronInterval = setInterval(() => {
    processReportSLAApprovals();
  }, 15 * 60 * 1000);

  console.log('⏱️ Report Auto-Approval SLA worker initialized (15m interval)');
};

module.exports = {
  processReportSLAApprovals,
  startAutoApprovalCron
};
