const User = require('../models/User');
const UserWalletTransaction = require('../models/UserWalletTransaction');
const UserWithdrawalRequest = require('../models/UserWithdrawalRequest');

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
const createWithdrawalRequest = async (userId, amount) => {
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

    // Create withdrawal request in separate collection
    const withdrawalRequest = await UserWithdrawalRequest.create({
      user: userId,
      amount,
      status: 'PENDING',
      requestedAt: new Date()
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
