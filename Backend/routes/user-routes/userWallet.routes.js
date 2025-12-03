const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isUser } = require('../../middleware/roleMiddleware');
const {
  getWalletBalance,
  getWalletTransactions,
  createWithdrawRequest,
  getWithdrawalRequests
} = require('../../controllers/userControllers/userWalletController');

router.use(authenticate);
router.use(isUser);

router.get('/', getWalletBalance);
router.get('/transactions', getWalletTransactions);
router.post('/withdraw-request', createWithdrawRequest);
router.get('/withdrawal-requests', getWithdrawalRequests);

module.exports = router;

