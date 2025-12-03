const Vendor = require('../models/Vendor');
const WalletTransaction = require('../models/WalletTransaction');
const VendorWithdrawalRequest = require('../models/VendorWithdrawalRequest');

/**
 * Calculate vendor payment breakdown
 * Formula: base = service + travel, GST = 18% of base, Platform fee = 15% of base
 * Total vendor payment = (base - platform fee) + GST
 */
const calculateVendorPayment = (baseServiceFee, travelCharges) => {
  const base = baseServiceFee + travelCharges;
  const gst = base * 0.18; // 18% of base
  const platformFee = base * 0.15; // 15% of base
  const totalVendorPayment = (base - platformFee) + gst;

  return {
    base: parseFloat(base.toFixed(2)),
    gst: parseFloat(gst.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    totalVendorPayment: parseFloat(totalVendorPayment.toFixed(2))
  };
};

/**
 * Credit amount to vendor wallet
 * @param {String} vendorId - Vendor ID
 * @param {Number} amount - Amount to credit
 * @param {String} type - Transaction type (SITE_VISIT, REPORT_UPLOAD)
 * @param {String} bookingId - Booking ID (optional)
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Transaction result
 */
const creditToVendorWallet = async (vendorId, amount, type, bookingId = null, metadata = {}) => {
  const session = await Vendor.startSession();
  session.startTransaction();

  try {
    const vendor = await Vendor.findById(vendorId).session(session);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const balanceBefore = vendor.paymentCollection.walletBalance || 0;
    const balanceAfter = balanceBefore + amount;

    // Update vendor wallet
    vendor.paymentCollection.walletBalance = balanceAfter;
    vendor.paymentCollection.totalCredited = (vendor.paymentCollection.totalCredited || 0) + amount;
    await vendor.save({ session });

    // Create transaction record
    const transaction = await WalletTransaction.create([{
      vendor: vendorId,
      booking: bookingId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      status: 'SUCCESS',
      description: metadata.description || metadata.bookingId ? `Payment for booking #${(metadata.bookingId || bookingId?.toString() || '').slice(-6)}` : '',
      metadata
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
    console.error('Credit to vendor wallet error:', error);

    // Create failed transaction record for retry
    try {
      const vendor = await Vendor.findById(vendorId);
      if (vendor) {
        const balanceBefore = vendor.paymentCollection.walletBalance || 0;
        await WalletTransaction.create({
          vendor: vendorId,
          booking: bookingId,
          type,
          amount,
          balanceBefore,
          balanceAfter: balanceBefore,
          status: 'FAILED',
          errorMessage: error.message,
          metadata
        });
      }
    } catch (recordError) {
      console.error('Failed to record failed transaction:', recordError);
    }

    return {
      success: false,
      error: error.message
    };
  } finally {
    session.endSession();
  }
};

/**
 * Deduct platform fee from vendor wallet
 * @param {String} vendorId - Vendor ID
 * @param {Number} amount - Amount to deduct
 * @param {String} bookingId - Booking ID (optional)
 * @param {String} description - Transaction description
 * @returns {Object} - Deduction result
 */
const deductPlatformFee = async (vendorId, amount, bookingId = null, description = '') => {
  const session = await Vendor.startSession();
  session.startTransaction();

  try {
    const vendor = await Vendor.findById(vendorId).session(session);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const balanceBefore = vendor.paymentCollection.walletBalance || 0;
    if (balanceBefore < amount) {
      throw new Error('Insufficient wallet balance for platform fee deduction');
    }

    const balanceAfter = balanceBefore - amount;

    // Update vendor wallet
    vendor.paymentCollection.walletBalance = balanceAfter;
    await vendor.save({ session });

    // Create transaction record
    const transaction = await WalletTransaction.create([{
      vendor: vendorId,
      booking: bookingId,
      type: 'PLATFORM_FEE_DEDUCTION',
      amount: -amount, // Negative for deduction
      balanceBefore,
      balanceAfter,
      status: 'SUCCESS',
      description: description || `Platform fee deduction${bookingId ? ` for booking #${bookingId.toString().slice(-6)}` : ''}`,
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
    console.error('Deduct platform fee error:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Debit amount from vendor wallet (for penalties, deductions, etc.)
 * @param {String} vendorId - Vendor ID
 * @param {Number} amount - Amount to debit
 * @param {String} type - Transaction type (e.g., 'FINAL_SETTLEMENT_PENALTY')
 * @param {String} bookingId - Booking ID (optional)
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Transaction result
 */
const debitFromVendorWallet = async (vendorId, amount, type, bookingId = null, metadata = {}) => {
  const session = await Vendor.startSession();
  session.startTransaction();

  try {
    const vendor = await Vendor.findById(vendorId).session(session);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const balanceBefore = vendor.paymentCollection.walletBalance || 0;
    const balanceAfter = Math.max(0, balanceBefore - amount); // Ensure balance doesn't go negative

    // Update vendor wallet
    vendor.paymentCollection.walletBalance = balanceAfter;
    vendor.paymentCollection.totalDeducted = (vendor.paymentCollection.totalDeducted || 0) + amount;
    await vendor.save({ session });

    // Create transaction record
    const transaction = await WalletTransaction.create([{
      vendor: vendorId,
      booking: bookingId,
      type,
      amount: -amount, // Negative for debit
      balanceBefore,
      balanceAfter,
      status: 'SUCCESS',
      description: metadata.description || `Deduction for booking #${(metadata.bookingId || bookingId?.toString() || '').slice(-6)}`,
      metadata
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
    console.error('Debit from vendor wallet error:', error);

    // Create failed transaction record
    try {
      const vendor = await Vendor.findById(vendorId);
      if (vendor) {
        const balanceBefore = vendor.paymentCollection.walletBalance || 0;
        await WalletTransaction.create({
          vendor: vendorId,
          booking: bookingId,
          type,
          amount: -amount,
          balanceBefore,
          balanceAfter: balanceBefore,
          status: 'FAILED',
          errorMessage: error.message,
          metadata
        });
      }
    } catch (recordError) {
      console.error('Failed to record failed transaction:', recordError);
    }

    return {
      success: false,
      error: error.message
    };
  } finally {
    session.endSession();
  }
};

/**
 * Retry failed wallet credits
 * @param {String} transactionId - Failed transaction ID
 * @returns {Object} - Retry result
 */
const retryFailedCredit = async (transactionId) => {
  try {
    const failedTransaction = await WalletTransaction.findById(transactionId);
    if (!failedTransaction || failedTransaction.status !== 'FAILED') {
      return {
        success: false,
        message: 'Transaction not found or not failed'
      };
    }

    // Check retry count (max 3 retries)
    if (failedTransaction.retryCount >= 3) {
      return {
        success: false,
        message: 'Max retry attempts reached'
      };
    }

    // Retry the credit
    const result = await creditToVendorWallet(
      failedTransaction.vendor,
      failedTransaction.amount,
      failedTransaction.type,
      failedTransaction.booking,
      failedTransaction.metadata
    );

    if (result.success) {
      // Update failed transaction
      failedTransaction.retryCount += 1;
      await failedTransaction.save();
    }

    return result;
  } catch (error) {
    console.error('Retry failed credit error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get vendor wallet balance
 * @param {String} vendorId - Vendor ID
 * @returns {Object} - Wallet balance info
 */
const getVendorWalletBalance = async (vendorId) => {
  try {
    const vendor = await Vendor.findById(vendorId).select('paymentCollection');
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Calculate total credited from all credit transactions
    const totalCreditedResult = await WalletTransaction.aggregate([
      { 
        $match: { 
          vendor: vendor._id, 
          type: { $in: ['TRAVEL_CHARGES', 'SITE_VISIT', 'REPORT_UPLOAD'] },
          status: 'SUCCESS',
          amount: { $gt: 0 }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Calculate total deducted from platform fee and withdrawal transactions
    const totalDeductedResult = await WalletTransaction.aggregate([
      { 
        $match: { 
          vendor: vendor._id, 
          type: { $in: ['PLATFORM_FEE_DEDUCTION', 'WITHDRAWAL_PROCESSED'] },
          status: 'SUCCESS'
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Use vendor's walletBalance field directly (most accurate)
    // This is updated in real-time when transactions occur
    const walletBalance = vendor.paymentCollection.walletBalance || 0;
    
    // Calculate totals from transactions for display purposes
    const credits = totalCreditedResult.length > 0 ? totalCreditedResult[0].total : 0;
    const debits = totalDeductedResult.length > 0 ? Math.abs(totalDeductedResult[0].total) : 0;
    
    // Ensure vendor's walletBalance is in sync with transactions
    // If there's a discrepancy, update it (this handles edge cases)
    const calculatedBalance = credits - debits;
    if (Math.abs(walletBalance - calculatedBalance) > 0.01) {
      // There's a discrepancy - update vendor's walletBalance to match transactions
      vendor.paymentCollection.walletBalance = Math.max(0, calculatedBalance);
      await vendor.save();
      // Use the corrected balance
      const correctedBalance = vendor.paymentCollection.walletBalance;
      return {
        walletBalance: correctedBalance,
        totalCredited: credits,
        totalDeducted: debits,
        thisMonthEarnings: thisMonthEarnings.length > 0 ? thisMonthEarnings[0].total : 0,
        withdrawalRequests: vendor.paymentCollection.withdrawalRequests || []
      };
    }
    
    // Calculate this month earnings (credits only)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEarnings = await WalletTransaction.aggregate([
      { 
        $match: { 
          vendor: vendor._id, 
          type: { $in: ['TRAVEL_CHARGES', 'SITE_VISIT', 'REPORT_UPLOAD'] },
          status: 'SUCCESS',
          amount: { $gt: 0 },
          createdAt: { $gte: startOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get withdrawal requests from separate collection
    const withdrawalRequests = await VendorWithdrawalRequest.find({ vendor: vendorId })
      .sort({ requestedAt: -1 })
      .lean();

    return {
      walletBalance: walletBalance,
      totalCredited: credits,
      totalDeducted: debits,
      thisMonthEarnings: thisMonthEarnings.length > 0 ? thisMonthEarnings[0].total : 0,
      withdrawalRequests: withdrawalRequests
    };
  } catch (error) {
    console.error('Get vendor wallet balance error:', error);
    throw error;
  }
};

/**
 * Create withdrawal request
 * @param {String} vendorId - Vendor ID
 * @param {Number} amount - Withdrawal amount
 * @returns {Object} - Request result
 */
const createWithdrawalRequest = async (vendorId, amount) => {
  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const walletBalance = vendor.paymentCollection.walletBalance || 0;
    if (amount > walletBalance) {
      throw new Error('Insufficient wallet balance');
    }

    if (amount < 1000) {
      throw new Error('Minimum withdrawal amount is ₹1,000');
    }

    // Create withdrawal request in separate collection
    const withdrawalRequest = await VendorWithdrawalRequest.create({
      vendor: vendorId,
      amount,
      status: 'PENDING',
      requestedAt: new Date()
    });

    // Create transaction record
    await WalletTransaction.create({
      vendor: vendorId,
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
 * @param {String} vendorId - Vendor ID
 * @param {String} requestId - Withdrawal request ID
 * @param {String} action - Action: 'APPROVE', 'REJECT', 'PROCESS'
 * @param {String} adminId - Admin ID
 * @param {Object} data - Additional data (razorpayPayoutId, notes, rejectionReason)
 * @returns {Object} - Process result
 */
const processWithdrawalRequest = async (vendorId, requestId, action, adminId, data = {}) => {
  const session = await Vendor.startSession();
  session.startTransaction();

  try {
    const vendor = await Vendor.findById(vendorId).session(session);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Find withdrawal request in separate collection
    const withdrawalRequest = await VendorWithdrawalRequest.findOne({
      _id: requestId,
      vendor: vendorId
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
      const walletBalance = vendor.paymentCollection.walletBalance || 0;
      if (withdrawalRequest.amount > walletBalance) {
        throw new Error('Insufficient wallet balance');
      }

      // Deduct from wallet
      vendor.paymentCollection.walletBalance = walletBalance - withdrawalRequest.amount;
      
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
      await WalletTransaction.create([{
        vendor: vendorId,
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

    await vendor.save({ session });
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
  calculateVendorPayment,
  creditToVendorWallet,
  deductPlatformFee,
  debitFromVendorWallet,
  retryFailedCredit,
  getVendorWalletBalance,
  createWithdrawalRequest,
  processWithdrawalRequest
};

