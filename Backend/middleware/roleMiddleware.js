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
 * Check if user is admin
 */
const isAdmin = authorize(ROLES.ADMIN);

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
const isVendorOrAdmin = authorize(ROLES.VENDOR, ROLES.ADMIN);

/**
 * Check if user is user or vendor
 */
const isUserOrVendor = authorize(ROLES.USER, ROLES.VENDOR);

module.exports = {
  authorize,
  isAdmin,
  isVendor,
  isUser,
  isVendorOrAdmin,
  isUserOrVendor
};

