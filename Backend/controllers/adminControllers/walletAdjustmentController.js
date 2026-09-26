const Vendor = require('../../models/Vendor');
const WalletTransaction = require('../../models/WalletTransaction');
const { adminAdjustVendorWallet } = require('../../services/walletService');

const ALLOWED_REASONS = [
  'DISPUTE_REFUND',
  'FRAUD_PENALTY',
  'CORRECTION',
  'GOODWILL_CREDIT',
  'BOREWELL_PENALTY',
  'BOREWELL_REWARD',
  'OTHER'
];

/**
 * POST /api/admin/wallets/:vendorId/adjust
 * Admin manually credits or debits a vendor wallet.
 */
const adjustVendorWallet = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { action, amount, reason, notes } = req.body;
    const adminId = req.userId;

    // --- Validation ---
    if (!['CREDIT', 'DEBIT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be CREDIT or DEBIT' });
    }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number' });
    }
    if (!ALLOWED_REASONS.includes(reason)) {
      return res.status(400).json({ success: false, message: `reason must be one of: ${ALLOWED_REASONS.join(', ')}` });
    }
    if (!notes || notes.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'notes are required (min 10 characters)' });
    }

    const vendor = await Vendor.findById(vendorId).select('name email paymentCollection');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const result = await adminAdjustVendorWallet(vendorId, adminId, action, parsedAmount, reason, notes);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.json({
      success: true,
      message: `Wallet ${action === 'CREDIT' ? 'credited' : 'debited'} successfully`,
      data: {
        vendorId,
        vendorName: vendor.name,
        action,
        amount: parsedAmount,
        reason,
        notes: notes.trim(),
        balanceBefore: result.balanceBefore,
        balanceAfter: result.balanceAfter,
        transactionId: result.transaction._id
      }
    });
  } catch (error) {
    console.error('[adjustVendorWallet] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/admin/wallets/:vendorId/transactions
 * Returns all wallet transactions for a vendor (paginated), including admin adjustments.
 */
const getVendorWalletTransactions = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    const query = { vendor: vendorId };
    if (type) {
      if (type.includes(',')) {
        query.type = { $in: type.split(',').map(t => t.trim()).filter(Boolean) };
      } else {
        query.type = type;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('booking', 'status scheduledDate'),
      WalletTransaction.countDocuments(query)
    ]);

    const vendor = await Vendor.findById(vendorId).select('name email paymentCollection');

    return res.json({
      success: true,
      data: {
        vendor: vendor ? {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          walletBalance: vendor.paymentCollection?.walletBalance || 0,
          totalCredited: vendor.paymentCollection?.totalCredited || 0
        } : null,
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('[getVendorWalletTransactions] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

module.exports = { adjustVendorWallet, getVendorWalletTransactions };
