const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const {
  createDispute,
  getMyDisputes,
  getDisputeDetails,
  addComment
} = require('../../controllers/vendorControllers/disputeController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// Validation rules
const createDisputeValidation = [
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('type')
    .isIn(['PAYMENT_ISSUE', 'SERVICE_QUALITY', 'VENDOR_BEHAVIOR', 'REPORT_ISSUE', 'CANCELLATION', 'REFUND', 'OTHER'])
    .withMessage('Invalid dispute type'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority level'),
  body('bookingId')
    .optional()
    .isMongoId()
    .withMessage('Invalid booking ID')
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
router.post('/', authenticate, isVendor, upload.array('attachments', 5), createDisputeValidation, createDispute);
router.get('/', authenticate, isVendor, getMyDisputes);
router.get('/:disputeId', authenticate, isVendor, getDisputeDetails);
router.post('/:disputeId/comment', authenticate, isVendor, addCommentValidation, addComment);

module.exports = router;

