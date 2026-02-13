const { ROLES } = require('../utils/constants');

/**
 * Role-based access control middleware
 * @param {...string} allowedRoles - Roles allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this resource.'
      });
    }

    next();
  };
};

/**
 * Check if user is admin (any type)
 */
const isAdmin = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.OPERATIONS_ADMIN, ROLES.VERIFIER_ADMIN, ROLES.SUPPORT_ADMIN);

/**
 * Check if user is super admin
 */
const isSuperAdmin = authorize(ROLES.SUPER_ADMIN);

/**
 * Check if user is finance admin or super admin
 */
const isFinanceAdmin = authorize(ROLES.FINANCE_ADMIN, ROLES.SUPER_ADMIN);

/**
 * Check if user is operations admin or super admin
 */
const isOperationsAdmin = authorize(ROLES.OPERATIONS_ADMIN, ROLES.SUPER_ADMIN);

/**
 * Check if user is verifier admin or super admin
 */
const isVerifierAdmin = authorize(ROLES.VERIFIER_ADMIN, ROLES.SUPER_ADMIN);

/**
 * Check if user is support admin or super admin
 */
const isSupportAdmin = authorize(ROLES.SUPPORT_ADMIN, ROLES.SUPER_ADMIN);

/**
 * Check if user is vendor
 */
const isVendor = authorize(ROLES.VENDOR);

/**
 * Check if user is regular user
 */
const isUser = authorize(ROLES.USER);

/**
 * Check if user is vendor or admin
 */
const isVendorOrAdmin = authorize(ROLES.VENDOR, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.OPERATIONS_ADMIN, ROLES.VERIFIER_ADMIN, ROLES.SUPPORT_ADMIN);

/**
 * Check if user is user or vendor
 */
const isUserOrVendor = authorize(ROLES.USER, ROLES.VENDOR);

module.exports = {
  authorize,
  isAdmin,
  isSuperAdmin,
  isFinanceAdmin,
  isOperationsAdmin,
  isVerifierAdmin,
  isSupportAdmin,
  isVendor,
  isUser,
  isVendorOrAdmin,
  isUserOrVendor
};

