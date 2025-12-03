const { getVendorWalletBalance, createWithdrawalRequest } = require('../../services/walletService');
const WalletTransaction = require('../../models/WalletTransaction');
const Vendor = require('../../models/Vendor');

/**
 * Get vendor wallet balance and summary
 */
const getWalletBalance = async (req, res) => {
  try {
    const vendorId = req.userId;

    const walletInfo = await getVendorWalletBalance(vendorId);

    // Get recent transactions
    const transactions = await WalletTransaction.find({ vendor: vendorId })
      .populate('booking', 'service')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      message: 'Wallet balance retrieved successfully',
      data: {
        walletBalance: walletInfo.walletBalance,
        totalCredited: walletInfo.totalCredited,
        totalDeducted: walletInfo.totalDeducted,
        thisMonthEarnings: walletInfo.thisMonthEarnings,
        withdrawalRequests: walletInfo.withdrawalRequests,
        recentTransactions: transactions
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve wallet balance',
      error: error.message
    });
  }
};

/**
 * Get wallet transaction history
 */
const getWalletTransactions = async (req, res) => {
  try {
    const vendorId = req.userId;
    const { page = 1, limit = 20, type } = req.query;

    const query = { vendor: vendorId };
    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .populate('booking', 'service')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      WalletTransaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalTransactions: total
        }
      }
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: error.message
    });
  }
};

/**
 * Create withdrawal request
 */
const createWithdrawRequest = async (req, res) => {
  try {
    const vendorId = req.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid withdrawal amount is required'
      });
    }

    const result = await createWithdrawalRequest(vendorId, amount);

    res.json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: {
        withdrawalRequest: result.withdrawalRequest
      }
    });
  } catch (error) {
    console.error('Create withdrawal request error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create withdrawal request',
      error: error.message
    });
  }
};

/**
 * Get withdrawal requests for vendor
 */
const getWithdrawalRequests = async (req, res) => {
  try {
    const vendorId = req.userId;
    const vendor = await Vendor.findById(vendorId).select('paymentCollection.withdrawalRequests');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      message: 'Withdrawal requests retrieved successfully',
      data: {
        withdrawalRequests: vendor.paymentCollection.withdrawalRequests || []
      }
    });
  } catch (error) {
    console.error('Get withdrawal requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve withdrawal requests',
      error: error.message
    });
  }
};

module.exports = {
  getWalletBalance,
  getWalletTransactions,
  createWithdrawRequest,
  getWithdrawalRequests
};

