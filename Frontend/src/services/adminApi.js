import api from './api';

/**
 * Admin Authentication API functions
 */

/**
 * Register new admin
 * @param {Object} data - { name, email, password, adminCode }
 * @returns {Promise}
 */
export const adminRegister = async (data) => {
  const response = await api.post('/admin/auth/register', data);
  return response.data;
};

/**
 * Login admin
 * @param {Object} credentials - { email, password }
 * @returns {Promise}
 */
export const adminLogin = async (credentials) => {
  const response = await api.post('/admin/auth/login', credentials);
  return response.data;
};

/**
 * Logout admin
 * @returns {Promise}
 */
export const adminLogout = async () => {
  const response = await api.post('/admin/auth/logout');
  return response.data;
};

/**
 * Get admin profile
 * @returns {Promise}
 */
export const getAdminProfile = async () => {
  const response = await api.get('/admin/auth/profile');
  return response.data;
};

/**
 * Forgot password - Send OTP
 * @param {Object} data - { email }
 * @returns {Promise}
 */
export const adminForgotPassword = async (data) => {
  const response = await api.post('/admin/auth/forgot-password', data);
  return response.data;
};

/**
 * Reset password with OTP
 * @param {Object} data - { email, otp, newPassword }
 * @returns {Promise}
 */
export const adminResetPassword = async (data) => {
  const response = await api.post('/admin/auth/reset-password', data);
  return response.data;
};

/**
 * Send OTP for admin registration
 * @param {Object} data - { email, name }
 * @returns {Promise}
 */
export const sendAdminRegistrationOTP = async (data) => {
  const response = await api.post('/admin/auth/register/send-otp', data);
  return response.data;
};

/**
 * Register new admin with OTP verification
 * @param {Object} data - { name, email, password, otp, token }
 * @returns {Promise}
 */
export const registerAdminWithOTP = async (data) => {
  const response = await api.post('/admin/auth/register/verify-otp', data);
  return response.data;
};

/**
 * Admin Vendor Management API functions
 */

/**
 * Get all vendors with filters
 * @param {Object} params - { page, limit, isApproved, isActive, search, sortBy, sortOrder }
 * @returns {Promise}
 */
export const getAllVendors = async (params = {}) => {
  const response = await api.get('/admin/vendors', { params });
  return response.data;
};

/**
 * Get pending vendors
 * @param {Object} params - { page, limit }
 * @returns {Promise}
 */
export const getPendingVendors = async (params = {}) => {
  const response = await api.get('/admin/vendors/pending', { params });
  return response.data;
};

/**
 * Get vendor details
 * @param {string} vendorId
 * @returns {Promise}
 */
export const getVendorDetails = async (vendorId) => {
  const response = await api.get(`/admin/vendors/${vendorId}`);
  return response.data;
};

/**
 * Approve vendor
 * @param {string} vendorId
 * @returns {Promise}
 */
export const approveVendor = async (vendorId) => {
  const response = await api.patch(`/admin/vendors/${vendorId}/approve`);
  return response.data;
};

/**
 * Reject vendor
 * @param {string} vendorId
 * @param {string} rejectionReason
 * @returns {Promise}
 */
export const rejectVendor = async (vendorId, rejectionReason) => {
  const response = await api.patch(`/admin/vendors/${vendorId}/reject`, {
    rejectionReason
  });
  return response.data;
};

/**
 * Deactivate vendor
 * @param {string} vendorId
 * @returns {Promise}
 */
export const deactivateVendor = async (vendorId) => {
  const response = await api.patch(`/admin/vendors/${vendorId}/deactivate`);
  return response.data;
};

/**
 * Activate vendor
 * @param {string} vendorId
 * @returns {Promise}
 */
export const activateVendor = async (vendorId) => {
  const response = await api.patch(`/admin/vendors/${vendorId}/activate`);
  return response.data;
};

/**
 * Admin User Management API functions
 */

/**
 * Get all users with filters
 * @param {Object} params - { page, limit, isActive, isEmailVerified, search, sortBy, sortOrder }
 * @returns {Promise}
 */
export const getAllUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

/**
 * Get user details
 * @param {string} userId
 * @returns {Promise}
 */
export const getUserDetails = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Deactivate user
 * @param {string} userId
 * @returns {Promise}
 */
export const deactivateUser = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/deactivate`);
  return response.data;
};

/**
 * Activate user
 * @param {string} userId
 * @returns {Promise}
 */
export const activateUser = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/activate`);
  return response.data;
};

/**
 * Admin Payment Management API functions
 */

/**
 * Get all payments with filters
 * @param {Object} params - { page, limit, status, paymentType, search, sortBy, sortOrder }
 * @returns {Promise}
 */
export const getAllPayments = async (params = {}) => {
  const response = await api.get('/admin/payments', { params });
  return response.data;
};

/**
 * Get payment statistics
 * @returns {Promise}
 */
export const getPaymentStatistics = async () => {
  const response = await api.get('/admin/payments/statistics');
  return response.data;
};

/**
 * Get payment details
 * @param {string} paymentId
 * @returns {Promise}
 */
export const getPaymentDetails = async (paymentId) => {
  const response = await api.get(`/admin/payments/${paymentId}`);
  return response.data;
};

/**
 * Process vendor settlement
 * @param {string} bookingId
 * @returns {Promise}
 */
export const processVendorSettlement = async (bookingId) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/settlement`);
  return response.data;
};

/**
 * Get all bookings with filters
 * @param {Object} params - { page, limit, status, search, sortBy, sortOrder }
 * @returns {Promise}
 */
export const getAllBookings = async (params = {}) => {
  const response = await api.get('/admin/bookings', { params });
  return response.data;
};

/**
 * Get all travel charges requests
 * @param {Object} params - { page, limit, status }
 * @returns {Promise}
 */
export const getTravelChargesRequests = async (params = {}) => {
  const response = await api.get('/admin/travel-charges', { params });
  return response.data;
};

/**
 * Approve travel charges request
 * @param {string} bookingId
 * @returns {Promise}
 */
export const approveTravelCharges = async (bookingId) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/travel-charges/approve`);
  return response.data;
};

/**
 * Reject travel charges request
 * @param {string} bookingId
 * @param {Object} data - { rejectionReason }
 * @returns {Promise}
 */
export const rejectTravelCharges = async (bookingId, data) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/travel-charges/reject`, data);
  return response.data;
};

