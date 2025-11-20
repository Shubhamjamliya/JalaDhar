import api from './api';

/**
 * User Authentication API functions
 */

/**
 * Register new user
 * @param {Object} userData - { name, email, phone, password }
 * @returns {Promise}
 */
export const userRegister = async (userData) => {
  const response = await api.post('/users/auth/register', userData);
  return response.data;
};

/**
 * Login user
 * @param {Object} credentials - { email, password }
 * @returns {Promise}
 */
export const userLogin = async (credentials) => {
  const response = await api.post('/users/auth/login', credentials);
  return response.data;
};

/**
 * Logout user
 * @returns {Promise}
 */
export const userLogout = async () => {
  const response = await api.post('/users/auth/logout');
  return response.data;
};

/**
 * Forgot password - Send OTP
 * @param {Object} data - { email }
 * @returns {Promise}
 */
export const forgotPassword = async (data) => {
  const response = await api.post('/users/auth/forgot-password', data);
  return response.data;
};

/**
 * Reset password with OTP
 * @param {Object} data - { email, otp, newPassword }
 * @returns {Promise}
 */
export const resetPassword = async (data) => {
  const response = await api.post('/users/auth/reset-password', data);
  return response.data;
};

/**
 * Verify email with OTP
 * @param {Object} data - { email, otp }
 * @returns {Promise}
 */
export const verifyEmail = async (data) => {
  const response = await api.post('/users/auth/verify-email', data);
  return response.data;
};

/**
 * Resend email verification OTP
 * @param {Object} data - { email }
 * @returns {Promise}
 */
export const resendEmailVerification = async (data) => {
  const response = await api.post('/users/auth/resend-email-verification', data);
  return response.data;
};

