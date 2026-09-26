const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isFinanceAdmin, canAdjustWallets, isSuperAdmin } = require('../../middleware/roleMiddleware');
const { adjustVendorWallet, getVendorWalletTransactions } = require('../../controllers/adminControllers/walletAdjustmentController');

router.use(authenticate);

// GET  /api/admin/wallets/:vendorId/transactions  — Finance / Super Admin (ledger inspection)
router.get('/:vendorId/transactions', isFinanceAdmin, getVendorWalletTransactions);

// POST /api/admin/wallets/:vendorId/adjust        — Finance Admin or admin with can_adjust_wallets clearance
router.post('/:vendorId/adjust', canAdjustWallets, adjustVendorWallet);

module.exports = router;
