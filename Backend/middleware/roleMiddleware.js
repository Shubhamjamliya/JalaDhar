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
 * Granular module-level permission check middleware
 * Supports both role-based fallback and custom granular permissions (checkboxes)
 * @param {string} permission - The permission module key (e.g. 'finance', 'operations', 'verification', 'support', 'qc', 'reports', 'settings')
 * @param {...string} fallbackRoles - Fallback roles that inherently possess this access
 */
const requirePermission = (permission, ...fallbackRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // 1. Super Admins always possess unrestricted master access
    if (req.userRole === ROLES.SUPER_ADMIN || req.userRole === ROLES.ADMIN) {
      return next();
    }

    // 2. Admins with wildcard 'all' permission
    const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    if (userPermissions.includes('all')) {
      return next();
    }

    // 3. Admins with explicit granular permission assigned by Super Admin
    if (userPermissions.includes(permission)) {
      return next();
    }

    // 4. Fallback check based on role defaults
    if (fallbackRoles.includes(req.userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. You do not have '${permission}' permission to access this resource.`
    });
  };
};

/**
 * Check if user is admin (any type)
 */
const isAdmin = authorize(
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.EXPERT_VERIFICATION_ADMIN,
  ROLES.VERIFIER_ADMIN,
  ROLES.OPERATIONS_ADMIN,
  ROLES.FINANCE_ADMIN,
  ROLES.SUPPORT_ADMIN,
  ROLES.QC_ADMIN
);

/**
 * Check if user is super admin
 */
const isSuperAdmin = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN);

/**
 * Check if user has Finance permissions (or Finance Admin / Super Admin)
 */
const isFinanceAdmin = requirePermission('finance', ROLES.FINANCE_ADMIN);

/**
 * Check if user has Operations permissions (or Operations Admin / Super Admin)
 */
const isOperationsAdmin = requirePermission('operations', ROLES.OPERATIONS_ADMIN);

/**
 * Check if user has Verification permissions (or Verifier Admin / Super Admin)
 */
const isVerifierAdmin = requirePermission('verification', ROLES.EXPERT_VERIFICATION_ADMIN, ROLES.VERIFIER_ADMIN);
const isExpertVerificationAdmin = isVerifierAdmin;

/**
 * Check if user has Customer Support permissions (or Support Admin / Super Admin)
 */
const isSupportAdmin = requirePermission('support', ROLES.SUPPORT_ADMIN);

/**
 * Check if user has Quality Control permissions (or QC Admin / Super Admin)
 */
const isQCAdmin = requirePermission('qc', ROLES.QC_ADMIN);

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
const isVendorOrAdmin = authorize(
  ROLES.VENDOR,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.EXPERT_VERIFICATION_ADMIN,
  ROLES.VERIFIER_ADMIN,
  ROLES.OPERATIONS_ADMIN,
  ROLES.FINANCE_ADMIN,
  ROLES.SUPPORT_ADMIN,
  ROLES.QC_ADMIN
);

/**
 * Check if user is user or vendor
 */
const isUserOrVendor = authorize(ROLES.USER, ROLES.VENDOR);

module.exports = {
  authorize,
  requirePermission,
  isAdmin,
  isSuperAdmin,
  isFinanceAdmin,
  isOperationsAdmin,
  isVerifierAdmin,
  isExpertVerificationAdmin,
  isSupportAdmin,
  isQCAdmin,
  isVendor,
  isUser,
  isVendorOrAdmin,
  isUserOrVendor
};

