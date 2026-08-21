const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserDetails,
  deactivateUser,
  activateUser
} = require('../../controllers/adminControllers/userManagementController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/roleMiddleware');
const { ROLES } = require('../../utils/constants');

// Routes (Requires users permission or Operations / Support role)
const isUserAdmin = requirePermission('users', ROLES.OPERATIONS_ADMIN, ROLES.SUPPORT_ADMIN);

// Get all users
router.get('/users', authenticate, isUserAdmin, getAllUsers);

// Get user details
router.get('/users/:userId', authenticate, isUserAdmin, getUserDetails);

// Deactivate user
router.patch('/users/:userId/deactivate', authenticate, isUserAdmin, deactivateUser);

// Activate user
router.patch('/users/:userId/activate', authenticate, isUserAdmin, activateUser);

module.exports = router;

