const { sendNotification, getUserNotifications, markAsRead, markAllAsRead, getUnreadCount } = require('../../services/notificationService');

/**
 * Get notifications for authenticated user
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole; // USER, VENDOR, or ADMIN
    const { page = 1, limit = 20, isRead } = req.query;

    // Map role to model name
    const recipientModel = userRole === 'USER' ? 'User' : userRole === 'VENDOR' ? 'Vendor' : 'Admin';

    const result = await getUserNotifications(userId, recipientModel, {
      page: parseInt(page),
      limit: parseInt(limit),
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : null
    });

    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;
    const recipientModel = userRole === 'USER' ? 'User' : userRole === 'VENDOR' ? 'Vendor' : 'Admin';

    const notification = await markAsRead(id, userId, recipientModel);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or you do not have permission to mark it as read'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const recipientModel = userRole === 'USER' ? 'User' : userRole === 'VENDOR' ? 'Vendor' : 'Admin';

    const result = await markAllAsRead(userId, recipientModel);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

/**
 * Get unread notification count
 */
const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const recipientModel = userRole === 'USER' ? 'User' : userRole === 'VENDOR' ? 'Vendor' : 'Admin';

    const count = await getUnreadCount(userId, recipientModel);

    res.json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount
};

