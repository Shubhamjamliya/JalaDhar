const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isFinanceAdmin } = require('../../middleware/roleMiddleware');
const {
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  processWithdrawal,
  createWithdrawalPayment,
  assignWithdrawalRequest
} = require('../../controllers/adminControllers/withdrawalController');

router.use(authenticate);
router.use(isFinanceAdmin);

router.get('/', getAllWithdrawalRequests);
router.put('/:requestId/assign', assignWithdrawalRequest);
router.put('/:vendorId/:requestId/approve', approveWithdrawalRequest);
router.put('/:vendorId/:requestId/reject', rejectWithdrawalRequest);
router.put('/:vendorId/:requestId/process', processWithdrawal);
router.post('/:vendorId/:requestId/create-payment', createWithdrawalPayment);

module.exports = router;

