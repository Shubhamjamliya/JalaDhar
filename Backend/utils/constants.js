// User roles
const ROLES = {
  USER: 'USER',
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN'
};

// Token types
const TOKEN_TYPES = {
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  ADMIN_REGISTRATION: 'ADMIN_REGISTRATION'
};

// Booking status - Complete workflow status
// Status flow aligned with User and Vendor timelines:
// 
// USER TIMELINE:
// 1. PENDING → Booking created, waiting for vendor assignment
// 2. ASSIGNED → Vendor assigned to booking
// 3. ACCEPTED → Vendor accepted the booking
// 4. VISITED → Vendor visited user's location
// 5. REPORT_UPLOADED → Vendor uploaded service report
// 6. AWAITING_PAYMENT → User needs to pay remaining 60% to view report
// 7. PAYMENT_SUCCESS → User paid remaining amount, report visible
// 8. BOREWELL_UPLOADED → User uploaded borewell result (success/failure)
// 9. ADMIN_APPROVED → Admin approved borewell result, waiting for final settlement
// 10. FINAL_SETTLEMENT → Admin processing final settlement (refund if failed)
// 11. COMPLETED → Final status after settlement complete
//
// VENDOR TIMELINE:
// 1. ASSIGNED → Booking assigned to vendor
// 2. ACCEPTED → Vendor accepted booking
// 3. VISITED → Vendor visited site
// 4. REPORT_UPLOADED → Vendor uploaded report, waiting for admin payment (50% + travel)
// 5. AWAITING_PAYMENT → Waiting for admin to pay first installment
// 6. PAID_FIRST → Admin paid 50% + travel charges, waiting for borewell result
// 7. BOREWELL_UPLOADED → User uploaded borewell result, waiting for admin approval
// 8. APPROVED → Admin approved borewell result, waiting for final settlement
// 9. FINAL_SETTLEMENT_COMPLETE → Final settlement complete (50% remaining + incentive/penalty)
//
const BOOKING_STATUS = {
  // Initial stages
  AWAITING_ADVANCE: 'AWAITING_ADVANCE',  // Booking created, waiting for advance payment
  PENDING: 'PENDING',                    // Booking created/paid, waiting for vendor assignment
  ASSIGNED: 'ASSIGNED',                  // Vendor auto-assigned, waiting for vendor acceptance
  ACCEPTED: 'ACCEPTED',                  // Vendor accepted the booking

  // Service execution
  VISITED: 'VISITED',                    // Vendor visited user's location and completed testing
  REPORT_UPLOADED: 'REPORT_UPLOADED',   // Vendor uploaded service report (user needs to pay 60% to view)

  // Payment stages
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',  // User must pay remaining 60% OR Vendor waiting for admin payment (50% + travel)
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',    // User paid remaining 60%, can view report
  PAID_FIRST: 'PAID_FIRST',              // Vendor received first payment (50% + travel) from admin
  COMPLETED: 'COMPLETED',                // Final status after all settlements complete

  // Final stages
  BOREWELL_UPLOADED: 'BOREWELL_UPLOADED', // User uploaded borewell result, awaiting admin approval
  ADMIN_APPROVED: 'ADMIN_APPROVED',      // Admin approved borewell result (user waiting for final settlement/refund)
  APPROVED: 'APPROVED',                  // Admin approved borewell result (vendor waiting for final settlement)
  FINAL_SETTLEMENT: 'FINAL_SETTLEMENT',  // Admin processing final settlement (user perspective)
  FINAL_SETTLEMENT_COMPLETE: 'FINAL_SETTLEMENT_COMPLETE', // Final settlement complete (vendor perspective)

  // Legacy statuses (kept for backward compatibility)
  SUCCESS: 'SUCCESS',                    // Legacy - use FINAL_SETTLEMENT_COMPLETE for vendor
  FAILED: 'FAILED',                      // Legacy - use FINAL_SETTLEMENT_COMPLETE for vendor

  // Cancellation/Rejection
  REJECTED: 'REJECTED',                  // Vendor rejected the booking
  CANCELLED: 'CANCELLED'                 // Booking cancelled by user/vendor/admin
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

