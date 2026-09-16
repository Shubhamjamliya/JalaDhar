const express = require('express');
const {
  submitInquiry,
  getInquiries,
  getInquiryStats,
  updateInquiryStatus,
  deleteInquiry
} = require('../controllers/contactInquiryController');
const { authenticate } = require('../middleware/authMiddleware');

// ── Public Router: POST /api/contact ─────────────────────────────────────────
const publicRouter = express.Router();
publicRouter.post('/', submitInquiry);

// ── Admin Router: /api/admin/inquiries ───────────────────────────────────────
const adminRouter = express.Router();
adminRouter.use(authenticate);

adminRouter.get('/', getInquiries);
adminRouter.get('/stats', getInquiryStats);
adminRouter.patch('/:id', updateInquiryStatus);
adminRouter.delete('/:id', deleteInquiry);

module.exports = {
  publicRouter,
  adminRouter
};
