const User = require('../models/User');
const Admin = require('../models/Admin');
const UserWalletTransaction = require('../models/UserWalletTransaction');
const UserWithdrawalRequest = require('../models/UserWithdrawalRequest');
const { sendNotification } = require('./notificationService');

/**
 * Credit refund amount to user wallet
 * @param {String} userId - User ID
 * @param {Number} amount - Amount to credit
 * @param {String} bookingId - Booking ID (optional)
 * @param {String} description - Transaction description
 * @returns {Object} - Credit result
 */
const creditToUserWallet = async (userId, amount, bookingId = null, description = '') => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    const balanceBefore = user.wallet.walletBalance || 0;
    const balanceAfter = balanceBefore + amount;

    // Update user wallet
    user.wallet.walletBalance = balanceAfter;
    user.wallet.totalCredited = (user.wallet.totalCredited || 0) + amount;
    await user.save({ session });

    // Create transaction record
    const transaction = await UserWalletTransaction.create([{
      user: userId,
      booking: bookingId,
      type: 'REFUND',
      amount,
      balanceBefore,
      balanceAfter,
      status: 'SUCCESS',
      description: description || `Refund for booking #${bookingId?.toString().slice(-6) || ''}`,
      metadata: {
        bookingId: bookingId?.toString()
      }
    }], { session });

    await session.commitTransaction();

    return {
      success: true,
      transaction: transaction[0],
      balanceBefore,
      balanceAfter
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Credit to user wallet error:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get user wallet balance
 * @param {String} userId - User ID
 * @returns {Object} - Wallet balance info
 */
const getUserWalletBalance = async (userId) => {
  try {
    const user = await User.findById(userId).select('wallet');
    if (!user) {
      throw new Error('User not found');
    }

    // Auto-sync & credit any cancelled bookings that had paid advance but haven't been credited to user wallet yet
    try {
      const Booking = require('../models/Booking');
      const Payment = require('../models/Payment');
      
      const cancelledBookings = await Booking.find({
        user: userId,
        status: 'CANCELLED'
      });

      for (const cancelledBooking of cancelledBookings) {
        const isAdvancePaid = cancelledBooking.payment?.advancePaid || false;
        const advanceAmount = cancelledBooking.payment?.advanceAmount || 0;
        
        const completedAdvancePayment = await Payment.findOne({
          booking: cancelledBooking._id,
          paymentType: 'ADVANCE',
          status: 'COMPLETED'
        });

        const refundEligibleAmount = (isAdvancePaid && advanceAmount > 0) 
          ? advanceAmount 
          : (completedAdvancePayment ? completedAdvancePayment.amount : 0);

        if (refundEligibleAmount > 0) {
          const existingRefundTx = await UserWalletTransaction.findOne({
            user: userId,
            booking: cancelledBooking._id,
            type: 'REFUND',
            status: 'SUCCESS'
          });

          if (!existingRefundTx) {
            await creditToUserWallet(
              userId,
              refundEligibleAmount,
              cancelledBooking._id,
              `Refund for cancelled booking #${cancelledBooking._id.toString().slice(-6).toUpperCase()}`
            );
          }
        }
      }
    } catch (syncErr) {
      console.error('Error auto-syncing cancelled booking refunds for wallet:', syncErr);
    }

    // Auto-sync any orphaned PENDING transactions where withdrawal request was REJECTED
    try {
      const rejectedRequests = await UserWithdrawalRequest.find({
        user: userId,
        status: 'REJECTED'
      }).select('_id rejectionReason');

      for (const req of rejectedRequests) {
        await UserWalletTransaction.updateMany(
          {
            user: userId,
            status: 'PENDING',
            $or: [
              { 'metadata.withdrawalRequestId': req._id },
              { type: 'WITHDRAWAL_REQUEST' }
            ]
          },
          {
            $set: {
              status: 'FAILED',
              errorMessage: req.rejectionReason || 'Withdrawal request rejected by admin'
            }
          }
        );
      }
    } catch (syncErr) {
      console.error('Error syncing rejected withdrawal transactions:', syncErr);
    }

    // Calculate total credited from all refund transactions
    const totalCreditedResult = await UserWalletTransaction.aggregate([
      { 
        $match: { 
          user: user._id, 
          type: 'REFUND',
          status: 'SUCCESS',
          amount: { $gt: 0 }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get the latest transaction's balanceAfter as the most accurate balance
    const latestTransaction = await UserWalletTransaction.findOne({ 
      user: user._id, 
      status: 'SUCCESS' 
    }).sort({ createdAt: -1 });
    
    const walletBalance = latestTransaction?.balanceAfter !== undefined 
      ? latestTransaction.balanceAfter 
      : (user.wallet.walletBalance || 0);
    
    // Calculate this month earnings (refunds only)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEarnings = await UserWalletTransaction.aggregate([
      { 
        $match: { 
          user: user._id, 
          type: 'REFUND',
          status: 'SUCCESS',
          amount: { $gt: 0 },
          createdAt: { $gte: startOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get withdrawal requests from separate collection
    const withdrawalRequests = await UserWithdrawalRequest.find({ user: userId })
      .sort({ requestedAt: -1 })
      .lean();
    
    return {
      walletBalance: walletBalance,
      totalCredited: totalCreditedResult.length > 0 ? totalCreditedResult[0].total : 0,
      thisMonthEarnings: thisMonthEarnings.length > 0 ? thisMonthEarnings[0].total : 0,
      withdrawalRequests: withdrawalRequests
    };
  } catch (error) {
    console.error('Get user wallet balance error:', error);
    throw error;
  }
};

/**
 * Create withdrawal request
 * @param {String} userId - User ID
 * @param {Number} amount - Withdrawal amount
 * @returns {Object} - Request result
 */
const createWithdrawalRequest = async (userId, amount, payoutData = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const walletBalance = user.wallet.walletBalance || 0;
    if (amount > walletBalance) {
      throw new Error('Insufficient wallet balance');
    }

    if (amount < 1000) {
      throw new Error('Minimum withdrawal amount is ₹1,000');
    }

    // Extract payout details
    const { payoutType = 'UPI', upiId = null, accountDetails = null } = payoutData;

    // Validate payout details
    if (payoutType === 'UPI' && !upiId) {
      throw new Error('Please provide a valid UPI ID for withdrawal payout');
    }

    if (payoutType === 'BANK_TRANSFER' && (!accountDetails || !accountDetails.accountNumber || !accountDetails.ifscCode)) {
      throw new Error('Please provide Account Number and IFSC Code for bank transfer payout');
    }

    // Auto-assign to available Finance Admin using Least-Active-Load engine
    const { autoAssignRequest } = require('./workloadDistributionService');
    const assignment = await autoAssignRequest({
      department: 'FINANCE',
      statusAtAssignment: 'PENDING',
      notes: 'Auto-assigned user refund withdrawal request'
    });

    // Create withdrawal request in separate collection
    const withdrawalRequest = await UserWithdrawalRequest.create({
      user: userId,
      amount,
      payoutType,
      upiId,
      accountDetails,
      status: 'PENDING',
      requestedAt: new Date(),
      assignedTo: assignment.assignedTo || null,
      assignmentHistory: assignment.auditRecord ? [assignment.auditRecord] : []
    });

    // Create transaction record
    await UserWalletTransaction.create({
      user: userId,
      type: 'WITHDRAWAL_REQUEST',
      amount: -amount, // Negative for withdrawal
      balanceBefore: walletBalance,
      balanceAfter: walletBalance, // Balance doesn't change until approved
      status: 'PENDING',
      description: `Withdrawal request of ₹${amount}`,
      metadata: {
        withdrawalRequestId: withdrawalRequest._id
      }
    });

    // Notify active Finance Admins and Super Admins
    try {
      const admins = await Admin.find({
        isActive: true,
        $or: [
          { role: 'SUPER_ADMIN' },
          { role: 'ADMIN' },
          { role: 'FINANCE_ADMIN' },
          { permissions: { $in: ['finance', 'payments', 'all'] } }
        ]
      }).select('_id');

      const userName = user.name || user.mobile || 'Customer';
      for (const admin of admins) {
        await sendNotification({
          recipient: admin._id,
          recipientModel: 'Admin',
          type: 'WITHDRAWAL_REQUEST',
          title: 'New Refund Withdrawal Request',
          message: `${userName} has requested a wallet refund withdrawal of ₹${Number(amount || 0).toLocaleString('en-IN')}`,
          relatedEntity: {
            entityType: 'UserWithdrawalRequest',
            entityId: withdrawalRequest._id
          },
          actionUrl: '/admin/user-withdrawals',
          metadata: {
            link: '/admin/user-withdrawals',
            amount,
            userId: user._id.toString(),
            withdrawalRequestId: withdrawalRequest._id.toString(),
            payoutType
          }
        });
      }
    } catch (notifErr) {
      console.error('Error sending withdrawal notification to admins:', notifErr);
    }

    return {
      success: true,
      withdrawalRequest
    };
  } catch (error) {
    console.error('Create withdrawal request error:', error);
    throw error;
  }
};

/**
 * Process withdrawal request (approve/reject/process)
 * @param {String} userId - User ID
 * @param {String} requestId - Withdrawal request ID
 * @param {String} action - Action: 'APPROVE', 'REJECT', 'PROCESS'
 * @param {String} adminId - Admin ID
 * @param {Object} data - Additional data (razorpayPayoutId, notes, rejectionReason)
 * @returns {Object} - Process result
 */
const processWithdrawalRequest = async (userId, requestId, action, adminId, data = {}) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    // Find withdrawal request in separate collection
    const withdrawalRequest = await UserWithdrawalRequest.findOne({
      _id: requestId,
      user: userId
    }).session(session);

    if (!withdrawalRequest) {
      throw new Error('Withdrawal request not found');
    }

    if (action === 'APPROVE') {
      if (withdrawalRequest.status !== 'PENDING') {
        throw new Error('Only pending requests can be approved');
      }
      withdrawalRequest.status = 'APPROVED';
      withdrawalRequest.processedBy = adminId;
      withdrawalRequest.notes = data.notes || '';
      await withdrawalRequest.save({ session });
    } else if (action === 'REJECT') {
      if (withdrawalRequest.status !== 'PENDING' && withdrawalRequest.status !== 'APPROVED') {
        throw new Error('Request cannot be rejected');
      }
      withdrawalRequest.status = 'REJECTED';
      withdrawalRequest.processedBy = adminId;
      withdrawalRequest.rejectionReason = data.rejectionReason || 'No reason provided';
      withdrawalRequest.processedAt = new Date();
      await withdrawalRequest.save({ session });

      // Update pending withdrawal transaction to FAILED
      await UserWalletTransaction.updateMany(
        {
          user: userId,
          'metadata.withdrawalRequestId': withdrawalRequest._id,
          status: 'PENDING'
        },
        {
          $set: {
            status: 'FAILED',
            errorMessage: data.rejectionReason || 'Withdrawal request rejected by admin'
          }
        },
        { session }
      );
    } else if (action === 'PROCESS') {
      if (withdrawalRequest.status !== 'APPROVED') {
        throw new Error('Only approved requests can be processed');
      }
      const walletBalance = user.wallet.walletBalance || 0;
      if (withdrawalRequest.amount > walletBalance) {
        throw new Error('Insufficient wallet balance');
      }

      // Deduct from wallet
      user.wallet.walletBalance = walletBalance - withdrawalRequest.amount;
      
      // Update withdrawal request
      withdrawalRequest.status = 'PROCESSED';
      withdrawalRequest.processedBy = adminId;
      withdrawalRequest.transactionId = data.transactionId || data.razorpayPayoutId || '';
      withdrawalRequest.razorpayPayoutId = data.razorpayPayoutId || data.transactionId || ''; // Keep for backward compatibility
      withdrawalRequest.paymentMethod = data.paymentMethod || null;
      withdrawalRequest.paymentDate = data.paymentDate || new Date();
      withdrawalRequest.notes = data.notes || '';
      withdrawalRequest.processedAt = new Date();
      await withdrawalRequest.save({ session });

      // Create transaction record
      const paymentMethodLabel = data.paymentMethod || 'Razorpay';
      await UserWalletTransaction.create([{
        user: userId,
        type: 'WITHDRAWAL_PROCESSED',
        amount: -withdrawalRequest.amount,
        balanceBefore: walletBalance,
        balanceAfter: walletBalance - withdrawalRequest.amount,
        status: 'SUCCESS',
        description: `Withdrawal processed via ${paymentMethodLabel}${data.transactionId ? ` (Transaction ID: ${data.transactionId})` : ''}`,
        metadata: {
          withdrawalRequestId: requestId,
          transactionId: data.transactionId || data.razorpayPayoutId,
          paymentMethod: data.paymentMethod,
          paymentDate: data.paymentDate
        }
      }], { session });
    }

    await user.save({ session });
    await session.commitTransaction();

    // Decrement assigned Finance Admin active workload
    if (['REJECT', 'PROCESS'].includes(action) && withdrawalRequest.assignedTo) {
      const { decrementActiveWorkload } = require('./workloadDistributionService');
      await decrementActiveWorkload(withdrawalRequest.assignedTo);
    }

    // Send notifications and emit real-time socket events to user
    try {
      const { sendNotification } = require('./notificationService');
      const { getIO } = require('../sockets');
      const formattedAmount = (withdrawalRequest.amount || 0).toLocaleString('en-IN');
      const strUserId = userId.toString();

      let notifType = null;
      let notifTitle = '';
      let notifMessage = '';

      if (action === 'REJECT') {
        notifType = 'WITHDRAWAL_REJECTED';
        notifTitle = 'Withdrawal Request Rejected';
        notifMessage = `Your withdrawal request of ₹${formattedAmount} was rejected. Reason: ${withdrawalRequest.rejectionReason || 'No reason provided'}`;
      } else if (action === 'APPROVE') {
        notifType = 'WITHDRAWAL_APPROVED';
        notifTitle = 'Withdrawal Request Approved';
        notifMessage = `Your withdrawal request of ₹${formattedAmount} has been approved and is queued for payout disbursal.`;
      } else if (action === 'PROCESS') {
        notifType = 'WITHDRAWAL_PROCESSED';
        notifTitle = 'Withdrawal Payout Processed';
        const method = withdrawalRequest.paymentMethod || 'bank transfer';
        const refStr = withdrawalRequest.transactionId ? ` (Ref: ${withdrawalRequest.transactionId})` : '';
        notifMessage = `Your withdrawal request of ₹${formattedAmount} has been settled via ${method}${refStr}.`;
      }

      if (notifType) {
        await sendNotification({
          recipient: userId,
          recipientModel: 'User',
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          relatedEntity: {
            entityType: 'UserWithdrawalRequest',
            entityId: withdrawalRequest._id
          },
          metadata: {
            link: '/user/wallet',
            amount: withdrawalRequest.amount,
            status: withdrawalRequest.status,
            rejectionReason: withdrawalRequest.rejectionReason,
            transactionId: withdrawalRequest.transactionId,
            requestId: withdrawalRequest._id.toString()
          }
        });
      }

      // Direct socket emit for real-time wallet UI refresh without manual reload
      const io = typeof getIO === 'function' ? getIO() : null;
      if (io) {
        const updatePayload = {
          type: notifType || `WITHDRAWAL_${action}`,
          status: withdrawalRequest.status,
          requestId: withdrawalRequest._id.toString(),
          amount: withdrawalRequest.amount,
          rejectionReason: withdrawalRequest.rejectionReason,
          transactionId: withdrawalRequest.transactionId,
          timestamp: new Date().toISOString()
        };
        io.to(`user:${strUserId}`).emit('wallet_updated', updatePayload);
        io.to(strUserId).emit('wallet_updated', updatePayload);
        io.to(`user:${strUserId}`).emit('withdrawal_updated', updatePayload);
        io.to(strUserId).emit('withdrawal_updated', updatePayload);
      }

      // Send rejection email if user has email
      if (action === 'REJECT' && user.email) {
        try {
          const { sendEmail } = require('./emailService');
          await sendEmail({
            to: user.email,
            subject: 'Update Regarding Your Withdrawal Request - Jaladhaara',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #e11d48; margin-top: 0;">Withdrawal Request Update</h2>
                <p>Dear <strong>${user.name || 'Customer'}</strong>,</p>
                <p>We are writing to update you on your withdrawal request for <strong>₹${formattedAmount}</strong>.</p>
                <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 14px; margin: 16px 0; border-radius: 6px;">
                  <p style="margin: 0; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #9f1239;">Reason for Rejection:</p>
                  <p style="margin: 6px 0 0; font-size: 14px; color: #881337;">${withdrawalRequest.rejectionReason || 'No reason specified'}</p>
                </div>
                <p>Your funds remain safe in your wallet balance. You can submit a new withdrawal request with updated bank account or UPI details at any time from your wallet dashboard.</p>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                  Need help? Contact our support team directly from the app.
                </div>
              </div>
            `
          });
        } catch (emailErr) {
          console.error('Failed to send rejection email to user:', emailErr);
        }
      }
    } catch (notifErr) {
      console.error('Failed to dispatch user withdrawal notification/socket:', notifErr);
    }

    return {
      success: true,
      withdrawalRequest
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Process withdrawal request error:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  creditToUserWallet,
  getUserWalletBalance,
  createWithdrawalRequest,
  processWithdrawalRequest
};
