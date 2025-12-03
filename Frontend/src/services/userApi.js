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
