const Vendor = require('../../models/Vendor');
const VendorWithdrawalRequest = require('../../models/VendorWithdrawalRequest');
const VendorBankDetails = require('../../models/VendorBankDetails');
const { processWithdrawalRequest } = require('../../services/walletService');
const { createOrder } = require('../../services/razorpayService');

/**
 * Get all withdrawal requests (for admin)
 */
const getAllWithdrawalRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get withdrawal requests with vendor info populated
    const [withdrawalRequests, totalRequests] = await Promise.all([
      VendorWithdrawalRequest.find(query)
        .populate('vendor', 'name email phone')
        .populate('processedBy', 'name email')
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VendorWithdrawalRequest.countDocuments(query)
    ]);

    // Get bank details for all vendors
    const vendorIds = withdrawalRequests.map(req => req.vendor._id);
    const bankDetailsMap = {};
    const bankDetailsList = await VendorBankDetails.find({ vendor: { $in: vendorIds }, isActive: true }).lean();
    bankDetailsList.forEach(bd => {
      bankDetailsMap[bd.vendor.toString()] = bd;
    });

    // Format response
    const formattedRequests = withdrawalRequests.map(request => ({
      _id: request._id,
      vendorId: request.vendor._id,
      vendorName: request.vendor.name,
      vendorEmail: request.vendor.email,
      vendorPhone: request.vendor.phone,
      bankDetails: bankDetailsMap[request.vendor._id.toString()] || null,
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
      message: 'Withdrawal requests retrieved successfully',
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
    console.error('Get all withdrawal requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve withdrawal requests',
      error: error.message
    });
  }
};

/**
 * Approve withdrawal request
 */
const approveWithdrawalRequest = async (req, res) => {
  try {
    const { vendorId, requestId } = req.params;
    const adminId = req.userId;
    const { notes } = req.body;

    const result = await processWithdrawalRequest(vendorId, requestId, 'APPROVE', adminId, { notes });

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
 * Reject withdrawal request
 */
const rejectWithdrawalRequest = async (req, res) => {
  try {
    const { vendorId, requestId } = req.params;
    const adminId = req.userId;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const result = await processWithdrawalRequest(vendorId, requestId, 'REJECT', adminId, { rejectionReason });

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
 * Process withdrawal request (mark as processed after manual payment)
 */
const processWithdrawal = async (req, res) => {
  try {
    const { vendorId, requestId } = req.params;
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

    const result = await processWithdrawalRequest(vendorId, requestId, 'PROCESS', adminId, {
      transactionId: finalTransactionId,
      paymentMethod: paymentMethod || null,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes: notes || '',
      razorpayPayoutId: finalTransactionId // Keep for backward compatibility
    });

    res.json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: {
        withdrawalRequest: result.withdrawalRequest
      }
    });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process withdrawal',
      error: error.message
    });
  }
};

/**
 * Create Razorpay payment order for vendor withdrawal
 */
const createWithdrawalPayment = async (req, res) => {
  try {
    const { vendorId, requestId } = req.params;
    const { amount } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const withdrawalRequest = await VendorWithdrawalRequest.findOne({
      _id: requestId,
      vendor: vendorId
    });
    
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Only approved withdrawal requests can be paid'
      });
    }

    // Create Razorpay order
    const order = await createOrder(amount || withdrawalRequest.amount, 'INR', {
      receipt: `withdrawal_${requestId}_${Date.now()}`,
      notes: {
        type: 'VENDOR_WITHDRAWAL',
        vendorId: vendorId.toString(),
        requestId: requestId.toString(),
        vendorName: vendor.name
      }
    });

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Create withdrawal payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order',
      error: error.message
    });
  }
};

module.exports = {
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  processWithdrawal,
  createWithdrawalPayment
};

