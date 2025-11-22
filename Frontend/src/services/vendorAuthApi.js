import api from './api';

/**
 * Vendor Authentication API functions
 */

/**
 * Send OTP for vendor registration
 * @param {Object} data - { name, email, phone }
 * @returns {Promise}
 */
export const sendVendorRegistrationOTP = async (data) => {
  const response = await api.post('/vendors/auth/register/send-otp', data);
  return response.data;
};

/**
 * Register new vendor with documents and OTP verification
 * @param {FormData} formData - FormData containing vendor info, files, otp, and token
 * @returns {Promise}
 */
export const vendorRegister = async (formData) => {
  const response = await api.post('/vendors/auth/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Login vendor
 * @param {Object} credentials - { email, password }
 * @returns {Promise}
 */
export const vendorLogin = async (credentials) => {
  const response = await api.post('/vendors/auth/login', credentials);
  return response.data;
};

/**
 * Logout vendor
 * @returns {Promise}
 */
export const vendorLogout = async () => {
  const response = await api.post('/vendors/auth/logout');
  return response.data;
};

/**
 * Forgot password - Send OTP
 * @param {Object} data - { email }
 * @returns {Promise}
 */
export const vendorForgotPassword = async (data) => {
  const response = await api.post('/vendors/auth/forgot-password', data);
  return response.data;
};

/**
 * Reset password with OTP
 * @param {Object} data - { email, otp, newPassword }
 * @returns {Promise}
 */
export const vendorResetPassword = async (data) => {
  const response = await api.post('/vendors/auth/reset-password', data);
  return response.data;
};

/**
 * Verify email with OTP
 * @param {Object} data - { email, otp }
 * @returns {Promise}
 */
export const vendorVerifyEmail = async (data) => {
  const response = await api.post('/vendors/auth/verify-email', data);
  return response.data;
};

/**
 * Resend email verification OTP
 * @param {Object} data - { email }
 * @returns {Promise}
 */
export const vendorResendEmailVerification = async (data) => {
  const response = await api.post('/vendors/auth/resend-email-verification', data);
  return response.data;
};

