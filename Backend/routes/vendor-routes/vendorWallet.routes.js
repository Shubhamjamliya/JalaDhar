const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');
const {
  getWalletBalance,
  getWalletTransactions,
  createWithdrawRequest,
  getWithdrawalRequests
} = require('../../controllers/vendorControllers/vendorWalletController');

router.use(authenticate);
router.use(isVendor);

router.get('/balance', getWalletBalance);
router.get('/transactions', getWalletTransactions);
router.post('/withdraw-request', createWithdrawRequest);
router.get('/withdrawal-requests', getWithdrawalRequests);

module.exports = router;

