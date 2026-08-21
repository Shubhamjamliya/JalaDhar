const AdminActivityLog = require('../models/AdminActivityLog');
const Admin = require('../models/Admin');

/**
 * Enterprise Non-Blocking Admin Audit Logger
 * Records staff activity asynchronously without impeding the primary API response
 * 
 * @param {Object} params
 * @param {Object} params.req - Express request object (contains user, ip, headers)
 * @param {string} [params.adminId] - Optional explicit admin ID if req.user is unavailable
 * @param {string} params.action - e.g. 'VENDOR_KYC_APPROVED', 'USER_REFUND_PROCESSED'
 * @param {string} params.module - 'OPERATIONS' | 'FINANCE' | 'QC' | 'VERIFICATION' | 'SUPPORT' | 'SECURITY' | 'SETTINGS'
 * @param {string} params.targetEntity - 'Booking' | 'Vendor' | 'User' | 'Payment' | 'Admin' | 'Settings' | 'Dispute'
 * @param {string} params.targetId - ID of the target record
 * @param {string} [params.targetLabel] - Human-readable label (e.g. 'Booking #BK-9182')
 * @param {Object} [params.previousState] - Previous values before change
 * @param {Object} [params.newState] - New updated values
 * @param {string} [params.notes] - Custom notes or rejection reason
 */
const logAdminActivity = async ({
  req,
  adminId,
  action,
  module: logModule,
  targetEntity,
  targetId,
  targetLabel = '',
  previousState = null,
  newState = null,
  notes = ''
}) => {
  try {
    let finalAdminId = adminId || req?.user?._id || req?.userId;
    let adminName = req?.user?.name;
    let adminEmail = req?.user?.email;
    let adminRole = req?.user?.role || req?.userRole || 'ADMIN';

    // If admin details are incomplete in req, fetch from DB
    if (finalAdminId && (!adminName || !adminEmail)) {
      try {
        const adminDoc = await Admin.findById(finalAdminId).select('name email role');
        if (adminDoc) {
          adminName = adminName || adminDoc.name;
          adminEmail = adminEmail || adminDoc.email;
          adminRole = adminRole || adminDoc.role;
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    if (!finalAdminId || !adminName) {
      adminName = adminName || 'System Admin';
      adminEmail = adminEmail || 'admin@jaladhar.com';
    }

    // Extract client IP and User Agent
    const ipAddress =
      req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      '127.0.0.1';

    const userAgent = req?.headers?.['user-agent'] || 'Admin Portal';

    // Asynchronously insert log record
    await AdminActivityLog.create({
      adminId: finalAdminId,
      adminName,
      adminEmail,
      adminRole,
      action,
      module: logModule,
      targetEntity,
      targetId: String(targetId || 'N/A'),
      targetLabel: String(targetLabel || `${targetEntity} #${targetId}`),
      previousState: previousState ? JSON.parse(JSON.stringify(previousState)) : undefined,
      newState: newState ? JSON.parse(JSON.stringify(newState)) : undefined,
      notes: notes ? String(notes).slice(0, 1000) : undefined,
      ipAddress,
      userAgent: String(userAgent).slice(0, 300)
    });
  } catch (error) {
    // Failure to write an audit log must never crash the primary business operation
    console.error('⚠️ [AUDIT LOGGER ERROR] Failed to record admin activity log:', error.message);
  }
};

module.exports = {
  logAdminActivity
};
