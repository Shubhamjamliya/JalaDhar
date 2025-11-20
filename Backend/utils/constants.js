// User roles
const ROLES = {
  USER: 'USER',
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN'
};

// Token types
const TOKEN_TYPES = {
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION'
};

// Booking status - Updated for vendor module requirements
const BOOKING_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',  // Vendor accepts the booking
  REJECTED: 'REJECTED',  // Vendor rejects the booking
  VISITED: 'VISITED',    // Vendor has visited the location
  COMPLETED: 'COMPLETED', // Service completed
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

// Service status
const SERVICE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  INACTIVE: 'INACTIVE'
};

// Payment status
const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

module.exports = {
  ROLES,
  TOKEN_TYPES,
  BOOKING_STATUS,
  SERVICE_STATUS,
  PAYMENT_STATUS
};

