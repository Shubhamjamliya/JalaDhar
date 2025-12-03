import api from './api';

/**
 * User Wallet API functions
 */

/**
 * Get user wallet balance and summary
 * @returns {Promise}
 */
export const getUserWalletBalance = async () => {
  const response = await api.get('/user/wallet');
  return response.data;
};

/**
 * Get user wallet transactions
 * @param {Object} params - { page, limit, type }
 * @returns {Promise}
 */
export const getUserWalletTransactions = async (params = {}) => {
  const response = await api.get('/user/wallet/transactions', { params });
  return response.data;
};

/**
 * Create withdrawal request
 * @param {number} amount - Withdrawal amount
 * @returns {Promise}
 */
export const createUserWithdrawalRequest = async (amount) => {
  const response = await api.post('/user/wallet/withdraw-request', { amount });
  return response.data;
};

/**
 * Get withdrawal requests
 * @returns {Promise}
 */
export const getUserWithdrawalRequests = async () => {
  const response = await api.get('/user/wallet/withdrawal-requests');
  return response.data;
};

/**
 * User Dispute API functions
 */

/**
 * Create a new dispute
 * @param {Object} disputeData - { subject, description, type, priority, bookingId }
 * @param {Array} attachments - Array of files (optional)
 * @returns {Promise}
 */
export const createDispute = async (disputeData, attachments = []) => {
  const formData = new FormData();
  formData.append('subject', disputeData.subject);
  formData.append('description', disputeData.description);
  formData.append('type', disputeData.type);
  if (disputeData.priority) formData.append('priority', disputeData.priority);
  if (disputeData.bookingId) formData.append('bookingId', disputeData.bookingId);
  
  attachments.forEach((file) => {
    formData.append('attachments', file);
  });

  const response = await api.post('/users/disputes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Get user's disputes
 * @param {Object} params - { page, limit, status, type }
 * @returns {Promise}
 */
export const getMyDisputes = async (params = {}) => {
  const response = await api.get('/users/disputes', { params });
  return response.data;
};

/**
 * Get dispute details
 * @param {string} disputeId
 * @returns {Promise}
 */
export const getDisputeDetails = async (disputeId) => {
  const response = await api.get(`/users/disputes/${disputeId}`);
  return response.data;
};

/**
 * Add comment to dispute
 * @param {string} disputeId
 * @param {Object} data - { comment }
 * @returns {Promise}
 */
export const addDisputeComment = async (disputeId, data) => {
  const response = await api.post(`/users/disputes/${disputeId}/comment`, data);
  return response.data;
};

/**
 * User Ratings API functions
 */

/**
 * Get user's own ratings and reviews
 * @param {Object} params - { page, limit, sortBy, sortOrder }
 * @returns {Promise}
 */
export const getMyRatings = async (params = {}) => {
  const response = await api.get('/ratings/user/my-ratings', { params });
  return response.data;
};