import api from './api';

/**
 * Vendor Dashboard API functions
 */

/**
 * Get dashboard statistics
 * @returns {Promise}
 */
export const getDashboardStats = async () => {
  const response = await api.get('/vendors/dashboard');
  return response.data;
};

/**
 * Get vendor bookings (all bookings with optional status filter)
 * @param {Object} params - { page, limit, status }
 * @returns {Promise}
 */
export const getVendorBookings = async (params = {}) => {
  const response = await api.get('/vendors/bookings/my-bookings', { params });
  return response.data;
};

/**
 * Get new booking requests (ASSIGNED bookings - for accept/reject)
 * @param {Object} params - { page, limit }
 * @returns {Promise}
 */
export const getNewBookings = async (params = {}) => {
  const response = await api.get('/vendors/bookings/my-bookings', { 
    params: { ...params, status: 'ASSIGNED' } 
  });
  return response.data;
};

/**
 * Get booking history with filters
 * @param {Object} params - { page, limit, status, startDate, endDate, sortBy, sortOrder }
 * @returns {Promise}
 */
export const getBookingHistory = async (params = {}) => {
  const response = await api.get('/vendors/bookings/my-bookings', { params });
  return response.data;
};

/**
 * Get booking details
 * @param {string} bookingId - Booking ID
 * @returns {Promise}
 */
export const getBookingDetails = async (bookingId) => {
  const response = await api.get(`/vendors/bookings/${bookingId}`);
  return response.data;
};

/**
 * Accept a booking
 * @param {string} bookingId
 * @returns {Promise}
 */
export const acceptBooking = async (bookingId) => {
  const response = await api.patch(`/vendors/bookings/${bookingId}/accept`);
  return response.data;
};

/**
 * Reject a booking
 * @param {string} bookingId
 * @param {string} rejectionReason
 * @returns {Promise}
 */
export const rejectBooking = async (bookingId, rejectionReason) => {
  const response = await api.patch(`/vendors/bookings/${bookingId}/reject`, {
    rejectionReason
  });
  return response.data;
};

/**
 * Upload visit report
 * @param {string} bookingId
 * @param {FormData} reportData - { waterFound, machineReadings, notes, images[], reportFile }
 * @returns {Promise}
 */
export const uploadVisitReport = async (bookingId, reportData) => {
  const response = await api.post(`/vendors/bookings/${bookingId}/visit-report`, reportData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Mark booking as visited
 * @param {string} bookingId
 * @returns {Promise}
 */
export const markBookingAsVisited = async (bookingId) => {
  const response = await api.patch(`/vendors/bookings/${bookingId}/visited`);
  return response.data;
};

/**
 * Mark booking as completed
 * @param {string} bookingId
 * @returns {Promise}
 */
export const markBookingAsCompleted = async (bookingId) => {
  const response = await api.patch(`/vendors/bookings/${bookingId}/completed`);
  return response.data;
};

/**
 * Request travel charges for a booking
 * @param {string} bookingId
 * @param {Object} data - { amount, reason }
 * @returns {Promise}
 */
export const requestTravelCharges = async (bookingId, data) => {
  const response = await api.post(`/vendors/bookings/${bookingId}/travel-charges`, data);
  return response.data;
};

/**
 * Get vendor's own ratings and reviews
 * @param {Object} params - { page, limit, sortBy, sortOrder }
 * @returns {Promise}
 */
export const getMyRatings = async (params = {}) => {
  const response = await api.get('/ratings/my-ratings', { params });
  return response.data;
};

/**
 * Schedule/Update visit time
 * @param {string} bookingId
 * @param {Object} scheduleData - { scheduledDate, scheduledTime }
 * @returns {Promise}
 */
export const scheduleVisit = async (bookingId, scheduleData) => {
  const response = await api.put(`/vendors/bookings/${bookingId}/schedule`, scheduleData);
  return response.data;
};

/**
 * Vendor Profile API functions
 */

/**
 * Get vendor profile
 * @returns {Promise}
 */
export const getVendorProfile = async () => {
  const response = await api.get('/vendors/profile');
  return response.data;
};

/**
 * Update vendor profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise}
 */
export const updateVendorProfile = async (profileData) => {
  const response = await api.put('/vendors/profile', profileData);
  return response.data;
};

/**
 * Upload profile picture
 * @param {File} imageFile - Image file
 * @returns {Promise}
 */
export const uploadProfilePicture = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  const response = await api.post('/vendors/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Upload gallery images
 * @param {File[]} imageFiles - Array of image files
 * @param {string[]} captions - Optional array of captions
 * @returns {Promise}
 */
export const uploadGalleryImages = async (imageFiles, captions = []) => {
  const formData = new FormData();
  imageFiles.forEach((file) => {
    formData.append('images', file);
  });
  if (captions.length > 0) {
    formData.append('captions', JSON.stringify(captions));
  }
  const response = await api.post('/vendors/gallery', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Delete gallery image
 * @param {string} imageId - Image ID
 * @returns {Promise}
 */
export const deleteGalleryImage = async (imageId) => {
  const response = await api.delete(`/vendors/gallery/${imageId}`);
  return response.data;
};

/**
 * Update availability settings
 * @param {Object} availabilityData - { isAvailable, workingDays, workingHours, timeSlots }
 * @returns {Promise}
 */
export const updateAvailability = async (availabilityData) => {
  const response = await api.put('/vendors/availability', availabilityData);
  return response.data;
};

/**
 * Get payment status
 * @returns {Promise}
 */
export const getPaymentStatus = async () => {
  const response = await api.get('/vendors/payment-status');
  return response.data;
};

/**
 * Vendor Service API functions
 */

/**
 * Get all vendor services
 * @returns {Promise}
 */
export const getMyServices = async () => {
  const response = await api.get('/vendors/services');
  return response.data;
};

/**
 * Get service details
 * @param {string} serviceId
 * @returns {Promise}
 */
export const getServiceDetails = async (serviceId) => {
  const response = await api.get(`/vendors/services/${serviceId}`);
  return response.data;
};

/**
 * Add new service
 * @param {FormData} serviceData - Service data with images
 * @returns {Promise}
 */
export const addService = async (serviceData) => {
  const response = await api.post('/vendors/services', serviceData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Update service
 * @param {string} serviceId
 * @param {Object} serviceData - Service data to update
 * @returns {Promise}
 */
export const updateService = async (serviceId, serviceData) => {
  const response = await api.put(`/vendors/services/${serviceId}`, serviceData);
  return response.data;
};

/**
 * Delete service
 * @param {string} serviceId
 * @returns {Promise}
 */
export const deleteService = async (serviceId) => {
  const response = await api.delete(`/vendors/services/${serviceId}`);
  return response.data;
};

/**
 * Upload service images
 * @param {string} serviceId
 * @param {File[]} imageFiles - Array of image files
 * @returns {Promise}
 */
export const uploadServiceImages = async (serviceId, imageFiles) => {
  const formData = new FormData();
  imageFiles.forEach((file) => {
    formData.append('images', file);
  });
  const response = await api.post(`/vendors/services/${serviceId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Delete service image
 * @param {string} serviceId
 * @param {string} imageId
 * @returns {Promise}
 */
export const deleteServiceImage = async (serviceId, imageId) => {
  const response = await api.delete(`/vendors/services/${serviceId}/images/${imageId}`);
  return response.data;
};

