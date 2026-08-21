const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isFinanceAdmin } = require('../../middleware/roleMiddleware');
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
router.patch('/:userId/:requestId/approve', approveWithdrawalRequest);
router.patch('/:userId/:requestId/reject', rejectWithdrawalRequest);
router.patch('/:requestId/process', processWithdrawalRequest); // Updated: userId found from request

module.exports = router;

