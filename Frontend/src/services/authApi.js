import api from './api';

/**
 * User Authentication API functions
 */

/**
 * Send OTP for user registration
 * @param {Object} data - { name, email, phone }
 * @returns {Promise}
 */
export const sendUserRegistrationOTP = async (data) => {
  const response = await api.post('/users/auth/register/send-otp', data);
  return response.data;
};

/**
 * Register new user with OTP verification
 * @param {Object} userData - { name, email, phone, password, otp, token }
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

/**
 * Get user profile
 * @returns {Promise}
 */
export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

/**
 * Update user profile
 * @param {Object} data - { name, phone, address }
 * @returns {Promise}
 */
export const updateUserProfile = async (data) => {
  const response = await api.put('/users/profile', data);
  return response.data;
};

/**
 * Upload user profile picture
 * @param {File} image - Image file
 * @returns {Promise}
 */
export const uploadUserProfilePicture = async (image) => {
  const formData = new FormData();
  formData.append('image', image);
  const response = await api.post('/users/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

