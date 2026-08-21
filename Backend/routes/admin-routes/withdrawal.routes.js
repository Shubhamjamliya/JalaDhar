const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isFinanceAdmin, canApproveDisbursals } = require('../../middleware/roleMiddleware');
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
router.put('/:vendorId/:requestId/approve', canApproveDisbursals, approveWithdrawalRequest);
router.put('/:vendorId/:requestId/reject', canApproveDisbursals, rejectWithdrawalRequest);
router.put('/:vendorId/:requestId/process', canApproveDisbursals, processWithdrawal);
router.post('/:vendorId/:requestId/create-payment', canApproveDisbursals, createWithdrawalPayment);

module.exports = router;

