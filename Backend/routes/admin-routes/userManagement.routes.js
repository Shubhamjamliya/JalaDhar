const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserDetails,
  deactivateUser,
  activateUser
} = require('../../controllers/adminControllers/userManagementController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

// Routes
// Get all users
router.get('/users', authenticate, isAdmin, getAllUsers);

// Get user details
router.get('/users/:userId', authenticate, isAdmin, getUserDetails);

// Deactivate user
router.patch('/users/:userId/deactivate', authenticate, isAdmin, deactivateUser);

// Activate user
router.patch('/users/:userId/activate', authenticate, isAdmin, activateUser);

module.exports = router;

