const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isFinanceAdmin, canApproveDisbursals } = require('../../middleware/roleMiddleware');
const {
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  processWithdrawalRequest,
  assignUserWithdrawalRequest
} = require('../../controllers/adminControllers/userWithdrawalController');

router.use(authenticate);
router.use(isFinanceAdmin);

router.get('/', getAllWithdrawalRequests);
router.patch('/:requestId/assign', assignUserWithdrawalRequest);
router.patch('/:userId/:requestId/approve', canApproveDisbursals, approveWithdrawalRequest);
router.patch('/:userId/:requestId/reject', canApproveDisbursals, rejectWithdrawalRequest);
router.patch('/:requestId/process', canApproveDisbursals, processWithdrawalRequest); // Updated: userId found from request

module.exports = router;

