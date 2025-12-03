const User = require('../../models/User');
const UserWithdrawalRequest = require('../../models/UserWithdrawalRequest');
const { processWithdrawalRequest } = require('../../services/userWalletService');

/**
 * Get all user withdrawal requests
 */
const getAllWithdrawalRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    // Get withdrawal requests with user info populated
    const [withdrawalRequests, totalRequests] = await Promise.all([
      UserWithdrawalRequest.find(query)
        .populate('user', 'name email phone')
        .populate('processedBy', 'name email')
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      UserWithdrawalRequest.countDocuments(query)
    ]);

    // Format response
    const formattedRequests = withdrawalRequests.map(request => ({
      _id: request._id,
      userId: request.user._id,
      userName: request.user.name,
      userEmail: request.user.email,
      userPhone: request.user.phone,
      amount: request.amount,
      status: request.status,
      requestedAt: request.requestedAt,
      processedAt: request.processedAt,
      processedBy: request.processedBy,
      razorpayPayoutId: request.razorpayPayoutId,
      transactionId: request.transactionId,
      paymentMethod: request.paymentMethod,
      paymentDate: request.paymentDate,
      notes: request.notes,
      rejectionReason: request.rejectionReason
    }));

    res.json({
      success: true,
      message: 'User withdrawal requests retrieved successfully',
      data: {
        withdrawalRequests: formattedRequests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRequests / parseInt(limit)),
          totalRequests
        }
      }
    });
  } catch (error) {
    console.error('Get all user withdrawal requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve withdrawal requests',
      error: error.message
    });
  }
};

/**
 * Approve user withdrawal request
 */
const approveWithdrawalRequest = async (req, res) => {
  try {
    const { userId, requestId } = req.params;
    const adminId = req.userId;
    const { notes } = req.body;

    const result = await processWithdrawalRequest(userId, requestId, 'APPROVE', adminId, { notes });

    res.json({
      success: true,
      message: 'Withdrawal request approved successfully',
      data: {
        withdrawalRequest: result.withdrawalRequest
      }
    });
  } catch (error) {
    console.error('Approve withdrawal request error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve withdrawal request',
      error: error.message
    });
  }
};

/**
 * Reject user withdrawal request
 */
const rejectWithdrawalRequest = async (req, res) => {
  try {
    const { userId, requestId } = req.params;
    const adminId = req.userId;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required and must be at least 10 characters'
      });
    }

    const result = await processWithdrawalRequest(userId, requestId, 'REJECT', adminId, { rejectionReason });

    res.json({
      success: true,
      message: 'Withdrawal request rejected successfully',
      data: {
        withdrawalRequest: result.withdrawalRequest
      }
    });
  } catch (error) {
    console.error('Reject withdrawal request error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject withdrawal request',
      error: error.message
    });
  }
};

/**
 * Process user withdrawal request (mark as processed after Razorpay payout)
 */
const processUserWithdrawal = async (req, res) => {
  try {
    const { requestId } = req.params; // Changed: only requestId needed, userId will be found from request
    const adminId = req.userId;
    const { transactionId, paymentMethod, paymentDate, notes, razorpayPayoutId } = req.body;

    // transactionId is required (can be Razorpay payout ID or other transaction reference)
    if (!transactionId && !razorpayPayoutId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    // Use transactionId if provided, otherwise fall back to razorpayPayoutId for backward compatibility
    const finalTransactionId = transactionId || razorpayPayoutId;

    // Find the withdrawal request
    const withdrawalRequest = await UserWithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    const result = await processWithdrawalRequest(withdrawalRequest.user, requestId, 'PROCESS', adminId, {
      transactionId: finalTransactionId,
      paymentMethod: paymentMethod || null,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes: notes || '',
      razorpayPayoutId: finalTransactionId // Keep for backward compatibility
    });

    res.json({
      success: true,
      message: 'Withdrawal request processed successfully',
      data: {
        withdrawalRequest: result.withdrawalRequest
      }
    });
  } catch (error) {
    console.error('Process withdrawal request error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process withdrawal request',
      error: error.message
    });
  }
};

module.exports = {
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  processWithdrawalRequest: processUserWithdrawal
};

