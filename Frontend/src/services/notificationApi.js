import api from './api';

/**
 * Get notifications for authenticated user
 * @param {Object} params - { page, limit, isRead }
 * @returns {Promise}
 */
export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise}
 */
export const markAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 * @returns {Promise}
 */
export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

/**
 * Get unread notification count
 * @returns {Promise}
 */
export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

/**
 * Delete a single notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise}
 */
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

/**
 * Clear all notifications for user
 * @returns {Promise}
 */
export const clearAllNotifications = async () => {
  const response = await api.delete('/notifications/clear-all');
  return response.data;
};

