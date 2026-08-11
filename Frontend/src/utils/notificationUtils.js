/**
 * Utility functions for Notifications
 */

// Map notification type -> { iconName, colorClass, bgClass }
export const NOTIFICATION_TYPE_META = {
  BOOKING_CREATED:            { label: 'New Booking',       color: 'text-blue-600 bg-blue-50 border-blue-200' },
  BOOKING_ASSIGNED:           { label: 'Booking Assigned',  color: 'text-blue-600 bg-blue-50 border-blue-200' },
  BOOKING_ACCEPTED:           { label: 'Booking Accepted',  color: 'text-green-600 bg-green-50 border-green-200' },
  BOOKING_REJECTED:           { label: 'Booking Rejected',  color: 'text-red-600 bg-red-50 border-red-200' },
  BOOKING_VISITED:            { label: 'Site Visited',      color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  BOOKING_CANCELLED:          { label: 'Booking Cancelled', color: 'text-red-600 bg-red-50 border-red-200' },
  BOOKING_COMPLETED:          { label: 'Completed',         color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  BOOKING_FAILED:             { label: 'Booking Failed',    color: 'text-red-600 bg-red-50 border-red-200' },
  BOOKING_REASSIGNED:         { label: 'Reassigned',        color: 'text-orange-600 bg-orange-50 border-orange-200' },
  REPORT_UPLOADED:            { label: 'Report Uploaded',   color: 'text-purple-600 bg-purple-50 border-purple-200' },
  REPORT_APPROVED:            { label: 'Report Approved',   color: 'text-green-600 bg-green-50 border-green-200' },
  REPORT_REJECTED:            { label: 'Report Rejected',   color: 'text-red-600 bg-red-50 border-red-200' },
  BOREWELL_UPLOADED:          { label: 'Result Uploaded',   color: 'text-teal-600 bg-teal-50 border-teal-200' },
  BOREWELL_APPROVED:          { label: 'Result Approved',   color: 'text-teal-600 bg-teal-50 border-teal-200' },
  PAYMENT_ADVANCE_SUCCESS:    { label: 'Payment Success',   color: 'text-green-600 bg-green-50 border-green-200' },
  PAYMENT_REMAINING_SUCCESS:  { label: 'Payment Success',   color: 'text-green-600 bg-green-50 border-green-200' },
  PAYMENT_FAILED:             { label: 'Payment Failed',    color: 'text-red-600 bg-red-50 border-red-200' },
  PAYMENT_RECEIVED:           { label: 'Payment Received',  color: 'text-green-600 bg-green-50 border-green-200' },
  FIRST_INSTALLMENT_PAID:     { label: 'Payout Credited',   color: 'text-blue-600 bg-blue-50 border-blue-200' },
  SETTLEMENT_COMPLETED:       { label: 'Settled',           color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  FINAL_SETTLEMENT_PROCESSED: { label: 'Final Settlement',  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  TRAVEL_CHARGES_REQUESTED:   { label: 'Travel Charges',    color: 'text-orange-600 bg-orange-50 border-orange-200' },
  TRAVEL_CHARGES_APPROVED:    { label: 'Travel Approved',   color: 'text-green-600 bg-green-50 border-green-200' },
  TRAVEL_CHARGES_REJECTED:    { label: 'Travel Rejected',   color: 'text-red-600 bg-red-50 border-red-200' },
  VENDOR_APPROVED:            { label: 'Account Approved',  color: 'text-green-600 bg-green-50 border-green-200' },
  VENDOR_REJECTED:            { label: 'Account Rejected',  color: 'text-red-600 bg-red-50 border-red-200' },
  NEW_VENDOR_REGISTRATION:    { label: 'New Vendor',        color: 'text-blue-600 bg-blue-50 border-blue-200' },
  NEW_BOOKING_PENDING:        { label: 'Pending Booking',   color: 'text-orange-600 bg-orange-50 border-orange-200' },
  NEW_DISPUTE:                { label: 'New Dispute',       color: 'text-red-600 bg-red-50 border-red-200' },
  DISPUTE_UPDATED:            { label: 'Dispute Update',    color: 'text-orange-600 bg-orange-50 border-orange-200' },
  NEW_RATING:                 { label: 'New Rating',        color: 'text-amber-600 bg-amber-50 border-amber-200' },
  PAYMENT_REFUNDED:           { label: 'Refunded',          color: 'text-blue-600 bg-blue-50 border-blue-200' },
  REFUND_PROCESSED:           { label: 'Refund Processed',  color: 'text-blue-600 bg-blue-50 border-blue-200' },
};

/**
 * Resolves a notification object and user role to an absolute web navigation URL.
 * Guarantees every single notification has a meaningful click destination.
 */
export function getNotificationUrl(notification, userRole) {
  if (!notification) return '/';

  // Normalize userRole (support both 'Vendor' and 'Expert')
  const isVendor = userRole === 'Vendor' || userRole === 'Expert';
  const isAdmin  = userRole === 'Admin';

  // 1. Explicit link in metadata
  if (notification.metadata?.link) {
    return notification.metadata.link;
  }

  // 2. Extract entity type & ID
  const entityType = notification.relatedEntity?.entityType || notification.metadata?.entityType;
  const entityId   = notification.relatedEntity?.entityId ||
                     notification.metadata?.entityId ||
                     notification.metadata?.bookingId ||
                     notification.metadata?.vendorId ||
                     notification.metadata?.disputeId ||
                     notification.metadata?.paymentId;

  const type = notification.type || '';
  const bookingId = entityId || notification.metadata?.bookingId;

  // 3. Booking related notifications
  if (entityType === 'Booking' || type.startsWith('BOOKING_') || type.startsWith('BOREWELL_') || type.startsWith('REPORT_') || type === 'NEW_BOOKING_PENDING') {
    if (isVendor) {
      if (type === 'BOOKING_CREATED' || type === 'NEW_BOOKING_PENDING' || type === 'BOOKING_ASSIGNED') {
        return '/vendor/bookings?tab=new';
      }
      return bookingId ? `/vendor/bookings/${bookingId}` : '/vendor/bookings';
    }

    if (isAdmin) {
      if (type.includes('BOREWELL') || type.includes('REPORT')) {
        return '/admin/approvals';
      }
      return bookingId ? `/admin/bookings/${bookingId}` : '/admin/bookings';
    }

    // User
    return bookingId ? `/user/booking/${bookingId}` : '/user/dashboard';
  }

  // 4. Vendor / Registration related
  if (entityType === 'Vendor' || type.includes('VENDOR')) {
    const vendorId = entityId || notification.metadata?.vendorId;
    if (isAdmin) {
      return vendorId ? `/admin/vendors/${vendorId}` : '/admin/vendors';
    }
    return '/vendor/profile';
  }

  // 5. Dispute related
  if (entityType === 'Dispute' || type.includes('DISPUTE')) {
    const disputeId = entityId || notification.metadata?.disputeId;
    if (isAdmin)  return disputeId ? `/admin/disputes/${disputeId}` : '/admin/disputes';
    if (isVendor) return disputeId ? `/vendor/disputes/${disputeId}` : '/vendor/disputes';
    return disputeId ? `/user/disputes/${disputeId}` : '/user/disputes';
  }

  // 6. Payment / Wallet / Travel Charges
  if (entityType === 'Payment' || type.includes('PAYMENT') || type.includes('SETTLEMENT') || type.includes('TRAVEL_CHARGES') || type.includes('INSTALLMENT') || type.includes('REFUND')) {
    if (isAdmin)  return '/admin/payments';
    if (isVendor) return '/vendor/wallet';
    return '/user/wallet';
  }

  // 7. Ratings / Reviews
  if (type === 'NEW_RATING') {
    if (isVendor) return '/vendor/reviews';
    if (isAdmin)  return '/admin/ratings';
    return '/user/ratings';
  }

  // 8. Role-based fallback
  if (isVendor) return '/vendor/bookings';
  if (isAdmin)  return '/admin/bookings';
  return '/user/dashboard';
}
