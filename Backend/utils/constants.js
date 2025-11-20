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

// Booking status - Complete workflow status
const BOOKING_STATUS = {
  PENDING: 'PENDING',              // Booking created, waiting for vendor assignment
  ASSIGNED: 'ASSIGNED',            // Vendor auto-assigned, waiting for acceptance
  ACCEPTED: 'ACCEPTED',            // Vendor accepts the booking
  REJECTED: 'REJECTED',            // Vendor rejects the booking
  VISITED: 'VISITED',              // Vendor visited & finished testing
  REPORT_UPLOADED: 'REPORT_UPLOADED', // Vendor submitted report
  AWAITING_PAYMENT: 'AWAITING_PAYMENT', // User must pay remaining 60%
  COMPLETED: 'COMPLETED',          // Payment done, report visible
  SUCCESS: 'SUCCESS',              // Borewell success
  FAILED: 'FAILED',                // Borewell failure
  CANCELLED: 'CANCELLED'           // User/vendor cancels
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

