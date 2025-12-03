const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllDisputes,
  getDisputeDetails,
  updateDisputeStatus,
  assignDispute,
  addComment,
  getDisputeStatistics
} = require('../../controllers/adminControllers/disputeController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

// Validation rules
const updateStatusValidation = [
  body('status')
    .isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'])
    .withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
];

const addCommentValidation = [
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
];

// Routes
router.get('/', authenticate, isAdmin, getAllDisputes);
router.get('/statistics', authenticate, isAdmin, getDisputeStatistics);
router.get('/:disputeId', authenticate, isAdmin, getDisputeDetails);
router.patch('/:disputeId/status', authenticate, isAdmin, updateStatusValidation, updateDisputeStatus);
router.patch('/:disputeId/assign', authenticate, isAdmin, assignDispute);
router.post('/:disputeId/comment', authenticate, isAdmin, addCommentValidation, addComment);

module.exports = router;

