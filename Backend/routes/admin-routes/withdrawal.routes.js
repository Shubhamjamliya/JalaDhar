const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  processWithdrawal,
  createWithdrawalPayment
} = require('../../controllers/adminControllers/withdrawalController');

router.use(authenticate);
router.use(isAdmin);

router.get('/', getAllWithdrawalRequests);
router.put('/:vendorId/:requestId/approve', approveWithdrawalRequest);
router.put('/:vendorId/:requestId/reject', rejectWithdrawalRequest);
router.put('/:vendorId/:requestId/process', processWithdrawal);
router.post('/:vendorId/:requestId/create-payment', createWithdrawalPayment);

module.exports = router;

