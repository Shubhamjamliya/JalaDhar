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
/**
 * Get all settings
 * @param {string} category - Optional category filter
 * @returns {Promise}
 */
export const getAllSettings = async (category = null) => {
  const params = category ? { category } : {};
  const response = await api.get('/admin/settings', { params });
  return response.data;
};

/**
 * Get setting by key
 * @param {string} key - Setting key
 * @returns {Promise}
 */
export const getSetting = async (key) => {
  const response = await api.get(`/admin/settings/${key}`);
  return response.data;
};

/**
 * Update setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @param {string} label - Optional label
 * @param {string} description - Optional description
 * @returns {Promise}
 */
export const updateSetting = async (key, value, label = null, description = null) => {
  const response = await api.put(`/admin/settings/${key}`, { value, label, description });
  return response.data;
};

/**
 * Update multiple settings
 * @param {Array} settings - Array of {key, value} objects
 * @returns {Promise}
 */
export const updateMultipleSettings = async (settings) => {
  const response = await api.put('/admin/settings', { settings });
  return response.data;
};

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
 * Get comprehensive admin payment overview
 * @returns {Promise}
 */
export const getAdminPaymentOverview = async () => {
  const response = await api.get('/admin/payments/overview');
  return response.data;
};

/**
 * Get vendor payment overview statistics
 * @returns {Promise}
 */
export const getVendorPaymentOverview = async () => {
  const response = await api.get('/admin/payments/vendor-overview');
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

/**
 * Pay travel charges to vendor
 * @param {string} bookingId
 * @returns {Promise}
 */
export const payTravelCharges = async (bookingId) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/travel-charges/pay`);
  return response.data;
};

/**
 * Pay first installment (50%) to vendor after report upload
 * @param {string} bookingId
 * @returns {Promise}
 */
export const payFirstInstallment = async (bookingId) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/first-installment/pay`);
  return response.data;
};

/**
 * Pay second installment (Final Settlement - 50% Remaining) with manual incentive/penalty
 * @param {string} bookingId
 * @param {Object} data - { incentive (for success), penalty (for failure) }
 * @returns {Promise}
 */
export const paySecondInstallment = async (bookingId, data) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/second-installment/pay`, data);
  return response.data;
};

/**
 * Get bookings with reports pending approval
 * @param {Object} params - { page, limit, status }
 * @returns {Promise}
 */
export const getReportPendingApprovals = async (params = {}) => {
  const response = await api.get('/admin/bookings/report-pending', { params });
  return response.data;
};

/**
 * Get bookings with borewell results pending approval
 * @param {Object} params - { page, limit, status }
 * @returns {Promise}
 */
export const getBorewellPendingApprovals = async (params = {}) => {
  const response = await api.get('/admin/bookings/borewell-pending', { params });
  return response.data;
};

/**
 * Approve report (without payment)
 * @param {string} bookingId
 * @returns {Promise}
 */
export const approveReport = async (bookingId) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/approve-report`);
  return response.data;
};

/**
 * Reject report
 * @param {string} bookingId
 * @param {Object} data - { rejectionReason }
 * @returns {Promise}
 */
export const rejectReport = async (bookingId, data) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/reject-report`, data);
  return response.data;
};

/**
 * Approve borewell result
 * @param {string} bookingId
 * @param {Object} data - { approved: true/false }
 * @returns {Promise}
 */
export const approveBorewellResult = async (bookingId, data) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/approve-result`, data);
  return response.data;
};

/**
 * Get bookings with pending user refunds (failed borewell)
 * @param {Object} params - { page, limit }
 * @returns {Promise}
 */
export const getPendingUserRefunds = async (params = {}) => {
  const response = await api.get('/admin/bookings/pending-user-refunds', { params });
  return response.data;
};

/**
 * Process user refund for failed borewell
 * @param {string} bookingId
 * @param {Object} data - { refundAmount }
 * @returns {Promise}
 */
export const processUserRefund = async (bookingId, data) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/user-refund`, data);
  return response.data;
};

/**
 * Process final settlement (includes refund if failed)
 * @param {string} bookingId
 * @param {Object} data - { incentive, penalty, refundAmount }
 * @returns {Promise}
 */
export const processFinalSettlement = async (bookingId, data) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/final-settlement`, data);
  return response.data;
};

/**
 * New Final Settlement API functions (separate from old final settlement)
 */

/**
 * Get pending vendor final settlements (bookings with borewell results, waiting for vendor reward/penalty)
 * @param {Object} params - { page, limit, search }
 * @returns {Promise}
 */
export const getPendingVendorFinalSettlements = async (params = {}) => {
  const response = await api.get('/admin/bookings/final-settlement/vendor/pending', { params });
  return response.data;
};

/**
 * Get completed vendor final settlements (history - where reward/penalty was processed)
 * @param {Object} params - { page, limit, search }
 * @returns {Promise}
 */
export const getCompletedVendorFinalSettlements = async (params = {}) => {
  const response = await api.get('/admin/bookings/final-settlement/vendor/completed', { params });
  return response.data;
};

/**
 * Get pending user final settlements (bookings with borewell results, waiting for user remittance/completion)
 * @param {Object} params - { page, limit, search }
 * @returns {Promise}
 */
export const getPendingUserFinalSettlements = async (params = {}) => {
  const response = await api.get('/admin/bookings/final-settlement/user/pending', { params });
  return response.data;
};

/**
 * Get completed user final settlements (history - where remittance was paid or settlement completed)
 * @param {Object} params - { page, limit, search }
 * @returns {Promise}
 */
export const getCompletedUserFinalSettlements = async (params = {}) => {
  const response = await api.get('/admin/bookings/final-settlement/user/completed', { params });
  return response.data;
};

/**
 * Process vendor final settlement (manual reward/penalty entry)
 * @param {string} bookingId
 * @param {Object} data - { rewardAmount, penaltyAmount, notes }
 * @returns {Promise}
 */
export const processNewFinalSettlement = async (bookingId, data) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/final-settlement/vendor/process`, data);
  return response.data;
};

/**
 * Process user final settlement (remittance for failed, or complete for success)
 * @param {string} bookingId
 * @param {Object} data - { remittanceAmount, notes }
 * @returns {Promise}
 */
export const processUserFinalSettlement = async (bookingId, data) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/final-settlement/user/process`, data);
  return response.data;
};

/**
 * Admin Withdrawal Management API functions
 */

/**
 * Get all withdrawal requests
 * @param {Object} params - { status, page, limit }
 * @returns {Promise}
 */
export const getAllWithdrawalRequests = async (params = {}) => {
  const response = await api.get('/admin/withdrawals', { params });
  return response.data;
};

/**
 * Approve withdrawal request
 * @param {string} vendorId - Vendor ID
 * @param {string} requestId - Withdrawal request ID
 * @param {string} notes - Optional notes
 * @returns {Promise}
 */
export const approveWithdrawalRequest = async (vendorId, requestId, notes = '') => {
  const response = await api.put(`/admin/withdrawals/${vendorId}/${requestId}/approve`, { notes });
  return response.data;
};

/**
 * Reject withdrawal request
 * @param {string} vendorId - Vendor ID
 * @param {string} requestId - Withdrawal request ID
 * @param {string} rejectionReason - Rejection reason
 * @returns {Promise}
 */
export const rejectWithdrawalRequest = async (vendorId, requestId, rejectionReason) => {
  const response = await api.put(`/admin/withdrawals/${vendorId}/${requestId}/reject`, { rejectionReason });
  return response.data;
};

/**
 * Process withdrawal (mark as processed after manual Razorpay transfer)
 * @param {string} vendorId - Vendor ID
 * @param {string} requestId - Withdrawal request ID
 * @param {string} razorpayPayoutId - Razorpay payout ID
 * @param {string} notes - Optional notes
 * @returns {Promise}
 */
export const processWithdrawal = async (vendorId, requestId, transactionId, notes = '', paymentMethod = '', paymentDate = '') => {
  const response = await api.put(`/admin/withdrawals/${vendorId}/${requestId}/process`, {
    transactionId: transactionId,
    paymentMethod: paymentMethod,
    paymentDate: paymentDate,
    notes: notes
  });
  return response.data;
};

/**
 * Get bookings pending 1st payment release
 * @param {Object} params - { page, limit }
 * @returns {Promise}
 */
export const getPendingFirstPaymentReleases = async (params = {}) => {
  const response = await api.get('/admin/bookings/pending-first-payment', { params });
  return response.data;
};

/**
 * Get bookings pending 2nd payment release
 * @param {Object} params - { page, limit }
 * @returns {Promise}
 */
export const getPendingSecondPaymentReleases = async (params = {}) => {
  const response = await api.get('/admin/bookings/pending-second-payment', { params });
  return response.data;
};

/**
 * Get all user withdrawal requests
 * @param {Object} params - { page, limit, status }
 * @returns {Promise}
 */
export const getAllUserWithdrawalRequests = async (params = {}) => {
  const response = await api.get('/admin/user-withdrawals', { params });
  return response.data;
};

/**
 * Approve user withdrawal request
 * @param {string} userId
 * @param {string} requestId
 * @param {Object} data - { notes }
 * @returns {Promise}
 */
export const approveUserWithdrawalRequest = async (userId, requestId, data = {}) => {
  const response = await api.patch(`/admin/user-withdrawals/${userId}/${requestId}/approve`, data);
  return response.data;
};

/**
 * Reject user withdrawal request
 * @param {string} userId
 * @param {string} requestId
 * @param {Object} data - { rejectionReason }
 * @returns {Promise}
 */
export const rejectUserWithdrawalRequest = async (userId, requestId, data = {}) => {
  const response = await api.patch(`/admin/user-withdrawals/${userId}/${requestId}/reject`, data);
  return response.data;
};

/**
 * Process user withdrawal request
 * @param {string} userId
 * @param {string} requestId
 * @param {Object} data - { razorpayPayoutId, notes }
 * @returns {Promise}
 */
export const processUserWithdrawalRequest = async (requestId, data = {}) => {
  const response = await api.patch(`/admin/user-withdrawals/${requestId}/process`, data);
  return response.data;
};

/**
 * Get single booking details
 * @param {string} bookingId
 * @returns {Promise}
 */
export const getBookingDetails = async (bookingId) => {
  const response = await api.get(`/admin/bookings/${bookingId}`);
  return response.data;
};

/**
 * Get all ratings
 * @param {Object} params - { page, limit, vendorId, userId, minRating, maxRating, search }
 * @returns {Promise}
 */
export const getAllRatings = async (params = {}) => {
  const response = await api.get('/admin/ratings', { params });
  return response.data;
};

/**
 * Get rating statistics
 * @returns {Promise}
 */
export const getRatingStatistics = async () => {
  const response = await api.get('/admin/ratings/statistics');
  return response.data;
};

/**
 * Get single rating details
 * @param {string} ratingId
 * @returns {Promise}
 */
export const getRatingDetails = async (ratingId) => {
  const response = await api.get(`/admin/ratings/${ratingId}`);
  return response.data;
};

/**
 * Delete rating
 * @param {string} ratingId
 * @returns {Promise}
 */
export const deleteRating = async (ratingId) => {
  const response = await api.delete(`/admin/ratings/${ratingId}`);
  return response.data;
};

/**
 * Get all disputes
 * @param {Object} params - { page, limit, status, type, priority, raisedBy, assignedTo, search }
 * @returns {Promise}
 */
export const getAllDisputes = async (params = {}) => {
  const response = await api.get('/admin/disputes', { params });
  return response.data;
};

/**
 * Get dispute statistics
 * @returns {Promise}
 */
export const getDisputeStatistics = async () => {
  const response = await api.get('/admin/disputes/statistics');
  return response.data;
};

/**
 * Get single dispute details
 * @param {string} disputeId
 * @returns {Promise}
 */
export const getDisputeDetails = async (disputeId) => {
  const response = await api.get(`/admin/disputes/${disputeId}`);
  return response.data;
};

/**
 * Update dispute status
 * @param {string} disputeId
 * @param {Object} data - { status, notes, actionTaken }
 * @returns {Promise}
 */
export const updateDisputeStatus = async (disputeId, data = {}) => {
  const response = await api.patch(`/admin/disputes/${disputeId}/status`, data);
  return response.data;
};

/**
 * Assign dispute to admin
 * @param {string} disputeId
 * @param {Object} data - { assignedTo }
 * @returns {Promise}
 */
export const assignDispute = async (disputeId, data = {}) => {
  const response = await api.patch(`/admin/disputes/${disputeId}/assign`, data);
  return response.data;
};

/**
 * Add comment to dispute
 * @param {string} disputeId
 * @param {Object} data - { comment }
 * @returns {Promise}
 */
export const addDisputeComment = async (disputeId, data = {}) => {
  const response = await api.post(`/admin/disputes/${disputeId}/comment`, data);
  return response.data;
};

