const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllVendors,
  getPendingVendors,
  getVendorDetails,
  approveVendor,
  rejectVendor,
  deactivateVendor,
  activateVendor
} = require('../../controllers/adminControllers/vendorManagementController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

// Validation rules
const rejectVendorValidation = [
  body('rejectionReason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters')
];

// Routes
// Get all vendors
router.get('/vendors', authenticate, isAdmin, getAllVendors);

// Get pending vendors
router.get('/vendors/pending', authenticate, isAdmin, getPendingVendors);

// Get vendor details
router.get('/vendors/:vendorId', authenticate, isAdmin, getVendorDetails);

// Approve vendor
router.patch('/vendors/:vendorId/approve', authenticate, isAdmin, approveVendor);

// Reject vendor
router.patch('/vendors/:vendorId/reject', authenticate, isAdmin, rejectVendorValidation, rejectVendor);

// Deactivate vendor
router.patch('/vendors/:vendorId/deactivate', authenticate, isAdmin, deactivateVendor);

// Activate vendor
router.patch('/vendors/:vendorId/activate', authenticate, isAdmin, activateVendor);

module.exports = router;

