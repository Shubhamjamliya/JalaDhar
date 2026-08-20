const Notification = require('../models/Notification');
const FCMToken = require('../models/FCMToken');
const NotificationLog = require('../models/NotificationLog');
const { sendPushNotification } = require('./firebaseAdmin');

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
 * Send push notification to a specific user/vendor/admin with duplicate prevention (SOP v3.0)
 * @param {string} recipientId - User ID
 * @param {string} recipientModel - 'User', 'Vendor', or 'Admin'
 * @param {Object} payload - { title, body, data, notificationId }
 */
const sendPushNotificationToUser = async (recipientId, recipientModel, payload) => {
  try {
    if (!recipientId || !recipientModel) return null;

    const normalizedModel = recipientModel === 'Expert' ? 'Vendor' : recipientModel;
    const strRecipientId = recipientId.toString();

    // 1. Generate Idempotency Key (notificationId)
    const notificationId = payload.notificationId ||
      `${strRecipientId}_${payload.data?.type || 'general'}_${payload.data?.id || payload.data?.relatedEntityId || Date.now()}`;

    // 2. Prevent Duplicate Delivery (Backend Deduplication Layer 1)
    const existingLog = await NotificationLog.findOne({ notificationId });
    if (existingLog) {
      console.log(`[FCM] Notification ${notificationId} already logged/sent. Skipping duplicate.`);
      return { skipped: true, reason: 'DUPLICATE', notificationId };
    }

    // 3. Fetch device tokens
    const fcmTokens = await FCMToken.getTokensForUser(strRecipientId, normalizedModel);
    const uniqueTokens = [...new Set(fcmTokens || [])];

    if (!uniqueTokens || uniqueTokens.length === 0) {
      // Record log as NO_TOKENS so future duplicate triggers within 24h are also ignored
      await NotificationLog.create({
        notificationId,
        userId: strRecipientId,
        userModel: normalizedModel,
        title: payload.title,
        tokens: [],
        status: 'NO_TOKENS'
      }).catch(err => {
        if (err.code !== 11000) console.error('[FCM] NotificationLog save error:', err.message);
      });
      return { successCount: 0, failureCount: 0, reason: 'NO_TOKENS', notificationId };
    }

    // 4. Send Multicast Notification via Firebase Admin SDK
    const pushResult = await sendPushNotification(uniqueTokens, {
      title: payload.title,
      body: payload.body,
      data: {
        ...(payload.data || {}),
        notificationId
      }
    });

    // 5. Cleanup Invalid / Expired Tokens from Database
    if (pushResult.invalidTokens && pushResult.invalidTokens.length > 0) {
      await FCMToken.removeInvalidTokens(pushResult.invalidTokens);
    }

    // 6. Save NotificationLog (Idempotency Lock)
    await NotificationLog.create({
      notificationId,
      userId: strRecipientId,
      userModel: normalizedModel,
      title: payload.title,
      tokens: uniqueTokens,
      status: pushResult.successCount > 0 ? 'SENT' : 'FAILED'
    }).catch(err => {
      if (err.code !== 11000) console.error('[FCM] NotificationLog save error:', err.message);
    });

    return pushResult;
  } catch (error) {
    console.error('[FCM] Error in sendPushNotificationToUser:', error);
    return { error: error.message };
  }
};

/**
 * Send notification (create in DB, emit via Socket.io, and send push notification)
 * @param {Object} notificationData - Notification data
 * @param {Object} io - Socket.io instance (optional, for real-time emission)
 */
const sendNotification = async (notificationData, io = null) => {
  try {
    // 1. Create notification in database
    const notification = await createNotification(notificationData);

    // 2. Emit via Socket.io if available
    if (io) {
      try {
        const room = getRoomName(notificationData.recipientModel, notificationData.recipient.toString());
        io.to(room).emit('new_notification', {
          id: notification._id,
          recipient: notification.recipient.toString(),
          recipientModel: notification.recipientModel,
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
      }
    }

    // 3. Send Push Notification via FCM (Duplicate-Safe)
    try {
      const recipientId = notificationData.recipient.toString();
      const recipientModel = notificationData.recipientModel; // 'User', 'Vendor', 'Admin'

      if (['User', 'Vendor', 'Admin', 'Expert'].includes(recipientModel)) {
        const notificationId = `${recipientId}_${notification.type || 'alert'}_${notification._id}`;

        await sendPushNotificationToUser(recipientId, recipientModel, {
          notificationId,
          title: notification.title,
          body: notification.message,
          data: {
            id: notification._id.toString(),
            type: notification.type,
            relatedEntityType: notification.relatedEntity?.entityType || '',
            relatedEntityId: notification.relatedEntity?.entityId?.toString() || '',
            link: notification.metadata?.link || '/'
          }
        });
      }
    } catch (pushError) {
      console.error('Push notification sending error:', pushError);
      // Non-critical error, don't fail the whole notification process
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
  const modelPrefix = (recipientModel || 'user').toLowerCase();
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
      recipientModel: recipientModel === 'Expert' ? 'Vendor' : recipientModel
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
      recipientModel: recipientModel === 'Expert' ? 'Vendor' : recipientModel
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
        recipientModel: recipientModel === 'Expert' ? 'Vendor' : recipientModel,
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
      recipientModel: recipientModel === 'Expert' ? 'Vendor' : recipientModel,
      isRead: false
    });

    return count;
  } catch (error) {
    console.error('Get unread count error:', error);
    throw error;
  }
};

/**
 * Delete a single notification for a user
 */
const deleteNotification = async (notificationId, recipientId, recipientModel) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: recipientId,
      recipientModel: recipientModel === 'Expert' ? 'Vendor' : recipientModel
    });
    return deleted;
  } catch (error) {
    console.error('Delete notification error:', error);
    throw error;
  }
};

/**
 * Clear/Delete all notifications for a user
 */
const clearAllNotifications = async (recipientId, recipientModel) => {
  try {
    const result = await Notification.deleteMany({
      recipient: recipientId,
      recipientModel: recipientModel === 'Expert' ? 'Vendor' : recipientModel
    });
    return result;
  } catch (error) {
    console.error('Clear all notifications error:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendNotification,
  sendPushNotificationToUser,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  clearAllNotifications,
  getRoomName
};
