const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
  clearAllNotifications
} = require('../controllers/notificationControllers/notificationController');

// All routes require authentication
router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadNotificationCount);
router.patch('/:id/read', authenticate, markNotificationAsRead);
router.patch('/read-all', authenticate, markAllNotificationsAsRead);

// Delete routes
router.delete('/clear-all', authenticate, clearAllNotifications);
router.delete('/:id', authenticate, deleteNotification);

module.exports = router;

