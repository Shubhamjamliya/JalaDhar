const Notification = require('../models/Notification');

/**
 * Create a notification in the database
 */
const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Send notification (create in DB and emit via Socket.io)
 * @param {Object} notificationData - Notification data
 * @param {Object} io - Socket.io instance (optional, for real-time emission)
 */
const sendNotification = async (notificationData, io = null) => {
  try {
    // Create notification in database
    const notification = await createNotification(notificationData);

    // Emit via Socket.io if available
    if (io) {
      try {
        const room = getRoomName(notificationData.recipientModel, notificationData.recipient.toString());
        io.to(room).emit('new_notification', {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          relatedEntity: notification.relatedEntity,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          metadata: notification.metadata
        });
      } catch (socketError) {
        console.error('Socket.io emission error:', socketError);
        // Continue even if Socket.io fails - notification is still saved in DB
      }
    }

    return notification;
  } catch (error) {
    console.error('Send notification error:', error);
    throw error;
  }
};

/**
 * Get room name for Socket.io
 */
const getRoomName = (recipientModel, recipientId) => {
  const modelPrefix = recipientModel.toLowerCase();
  return `${modelPrefix}:${recipientId}`;
};

/**
 * Get notifications for a user/vendor/admin
 */
const getUserNotifications = async (recipientId, recipientModel, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      isRead = null // null = all, true = read only, false = unread only
    } = options;

    const query = {
      recipient: recipientId,
      recipientModel: recipientModel
    };

    if (isRead !== null) {
      query.isRead = isRead;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query)
    ]);

    return {
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalNotifications: total
      }
    };
  } catch (error) {
    console.error('Get user notifications error:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, recipientId, recipientModel) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: recipientId,
      recipientModel: recipientModel
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  } catch (error) {
    console.error('Mark as read error:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (recipientId, recipientModel) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: recipientId,
        recipientModel: recipientModel,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    return result;
  } catch (error) {
    console.error('Mark all as read error:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (recipientId, recipientModel) => {
  try {
    const count = await Notification.countDocuments({
      recipient: recipientId,
      recipientModel: recipientModel,
      isRead: false
    });

    return count;
  } catch (error) {
    console.error('Get unread count error:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getRoomName
};

