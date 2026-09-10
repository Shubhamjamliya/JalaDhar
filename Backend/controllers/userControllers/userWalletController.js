const { getUserWalletBalance, createWithdrawalRequest } = require('../../services/userWalletService');
const UserWalletTransaction = require('../../models/UserWalletTransaction');
const User = require('../../models/User');

/**
 * Get user wallet balance and summary
 */
const getWalletBalance = async (req, res) => {
  try {
    const userId = req.userId;

    const walletInfo = await getUserWalletBalance(userId);

    // Get recent transactions
    const transactions = await UserWalletTransaction.find({ user: userId })
      .populate('booking', 'service')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      message: 'Wallet balance retrieved successfully',
      data: {
        walletBalance: walletInfo.walletBalance,
        totalCredited: walletInfo.totalCredited,
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
    const userId = req.userId;
    const { page = 1, limit = 10, type = 'ALL', status = 'ALL', search = '' } = req.query;

    const query = { user: userId };

    if (type && type !== 'ALL') {
      if (type === 'REFUND') {
        query.type = 'REFUND';
      } else if (type === 'WITHDRAWAL') {
        query.type = { $in: ['WITHDRAWAL_REQUEST', 'WITHDRAWAL_PROCESSED', 'WITHDRAWAL_REJECTED'] };
      } else {
        query.type = type;
      }
    }

    if (status && status !== 'ALL') {
      if (status === 'REJECTED' || status === 'FAILED') {
        query.$or = [{ status: 'FAILED' }, { type: 'WITHDRAWAL_REJECTED' }];
      } else {
        query.status = status;
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchCondition = [
        { description: searchRegex },
        { errorMessage: searchRegex }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchCondition }];
        delete query.$or;
      } else {
        query.$or = searchCondition;
      }
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      UserWalletTransaction.find(query)
        .populate('booking', 'service')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      UserWalletTransaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: {
        transactions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum) || 1,
          totalTransactions: total,
          limit: limitNum
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
    const userId = req.userId;
    const { amount, payoutType, upiId, accountDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid withdrawal amount is required'
      });
    }

    const result = await createWithdrawalRequest(userId, amount, { payoutType, upiId, accountDetails });

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
 * Get withdrawal requests for user
 */
const getWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('wallet.withdrawalRequests');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Withdrawal requests retrieved successfully',
      data: {
        withdrawalRequests: user.wallet.withdrawalRequests || []
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
