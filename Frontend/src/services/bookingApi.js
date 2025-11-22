import api from './api';

/**
 * User Booking API functions
 */

/**
 * Get all available services
 * @param {Object} filters - { category, page, limit }
 * @returns {Promise}
 */
export const getAllServices = async (filters = {}) => {
  const response = await api.get('/bookings/services', { params: filters });
  return response.data;
};

/**
 * Get available vendors for a service
 * @param {string} serviceId - Service ID
 * @param {number} lat - User latitude (optional)
 * @param {number} lng - User longitude (optional)
 * @returns {Promise}
 */
export const getAvailableVendors = async (serviceId, lat = null, lng = null) => {
  const params = {};
  if (lat && lng) {
    params.lat = lat;
    params.lng = lng;
  }
  const response = await api.get(`/bookings/services/${serviceId}/vendors`, { params });
  return response.data;
};

/**
 * Create a new booking
 * @param {Object} bookingData - { serviceId, vendorId, scheduledDate, scheduledTime, address, notes }
 * @returns {Promise}
 */
export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings/create', bookingData);
  return response.data;
};

/**
 * Get user bookings
 * @param {Object} filters - { status, page, limit }
 * @returns {Promise}
 */
export const getUserBookings = async (filters = {}) => {
  const response = await api.get('/bookings/my-bookings', { params: filters });
  return response.data;
};

/**
 * Get booking details
 * @param {string} bookingId - Booking ID
 * @returns {Promise}
 */
export const getBookingDetails = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
};

/**
 * Initiate remaining payment (60%)
 * @param {string} bookingId - Booking ID
 * @returns {Promise}
 */
export const initiateRemainingPayment = async (bookingId) => {
  const response = await api.post(`/bookings/${bookingId}/remaining-payment`);
  return response.data;
};

/**
 * Verify remaining payment (60%)
 * @param {string} bookingId - Booking ID
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @returns {Promise}
 */
export const verifyRemainingPayment = async (bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const response = await api.post('/payments/verify-remaining', {
    bookingId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  });
  return response.data;
};

/**
 * Upload borewell result
 * @param {string} bookingId - Booking ID
 * @param {Object} data - { status: 'SUCCESS' | 'FAILED', images: File[] }
 * @returns {Promise}
 */
export const uploadBorewellResult = async (bookingId, data) => {
  const formData = new FormData();
  formData.append('status', data.status);
  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append('images', image);
    });
  }
  const response = await api.post(`/bookings/${bookingId}/borewell-result`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Download invoice
 * @param {string} bookingId - Booking ID
 * @returns {Promise}
 */
export const downloadInvoice = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}/invoice`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Cancel a booking
 * @param {string} bookingId - Booking ID
 * @param {string} cancellationReason - Reason for cancellation (optional)
 * @returns {Promise}
 */
export const cancelBooking = async (bookingId, cancellationReason = '') => {
  const response = await api.patch(`/bookings/${bookingId}/cancel`, {
    cancellationReason
  });
  return response.data;
};

/**
 * Submit rating for a completed booking
 * @param {string} bookingId - Booking ID
 * @param {Object} ratingData - { ratings: { accuracy, professionalism, behavior, visitTiming }, review }
 * @returns {Promise}
 */
export const submitRating = async (bookingId, ratingData) => {
  const response = await api.post(`/ratings/${bookingId}`, ratingData);
  return response.data;
};

/**
 * Get rating for a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise}
 */
export const getBookingRating = async (bookingId) => {
  const response = await api.get(`/ratings/booking/${bookingId}`);
  return response.data;
};

/**
 * Get user dashboard statistics
 * @returns {Promise}
 */
export const getUserDashboardStats = async () => {
  const response = await api.get('/bookings/dashboard/stats');
  return response.data;
};

/**
 * Get nearby vendors with their services
 * @param {Object} filters - { lat, lng, limit }
 * @returns {Promise}
 */
export const getNearbyVendors = async (filters = {}) => {
  const response = await api.get('/bookings/vendors/nearby', { params: filters });
  return response.data;
};

/**
 * Get vendor profile details
 * @param {string} vendorId - Vendor ID
 * @param {number} lat - User latitude (optional)
 * @param {number} lng - User longitude (optional)
 * @returns {Promise}
 */
export const getVendorProfile = async (vendorId, lat = null, lng = null) => {
  const params = {};
  if (lat && lng) {
    params.lat = lat;
    params.lng = lng;
  }
  const response = await api.get(`/bookings/vendors/${vendorId}`, { params });
  return response.data;
};

/**
 * Verify advance payment with Razorpay
 * @param {string} bookingId - Booking ID
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @returns {Promise}
 */
export const verifyAdvancePayment = async (bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const response = await api.post('/payments/verify-advance', {
    bookingId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  });
  return response.data;
};

/**
 * Vendor Booking API functions
 */

/**
 * Get vendor bookings
 * @param {Object} filters - { status, page, limit }
 * @returns {Promise}
 */
export const getVendorBookings = async (filters = {}) => {
  const response = await api.get('/vendors/bookings/my-bookings', { params: filters });
  return response.data;
};

/**
 * Get vendor booking details
 * @param {string} bookingId - Booking ID
 * @returns {Promise}
 */
export const getVendorBookingDetails = async (bookingId) => {
  const response = await api.get(`/vendors/bookings/${bookingId}`);
  return response.data;
};

/**
 * Accept booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise}
 */
export const acceptBooking = async (bookingId) => {
  const response = await api.patch(`/vendors/bookings/${bookingId}/accept`);
  return response.data;
};

/**
 * Reject booking
 * @param {string} bookingId - Booking ID
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise}
 */
export const rejectBooking = async (bookingId, rejectionReason) => {
  const response = await api.patch(`/vendors/bookings/${bookingId}/reject`, {
    rejectionReason,
  });
  return response.data;
};

/**
 * Mark booking as visited and upload report
 * @param {string} bookingId - Booking ID
 * @param {Object} data - { waterFound: boolean, machineReadings: object, images: File[], reportFile: File }
 * @returns {Promise}
 */
export const markVisitedAndUploadReport = async (bookingId, data) => {
  const formData = new FormData();
  formData.append('waterFound', data.waterFound);
  if (data.machineReadings) {
    formData.append('machineReadings', JSON.stringify(data.machineReadings));
  }
  if (data.notes) {
    formData.append('notes', data.notes);
  }
  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append('images', image);
    });
  }
  if (data.reportFile) {
    formData.append('reportFile', data.reportFile);
  }
  const response = await api.post(`/vendors/bookings/${bookingId}/visit-report`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

