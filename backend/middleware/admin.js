// Simplified role-based access control: only customer and admin.

const isAdminUser = (user) => user && user.role === 'admin';

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
        userRole: req.user.role,
        allowedRoles: roles,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

// Admin-only gate
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  if (!isAdminUser(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access required.',
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }

  next();
};

// In simplified mode, any admin has all permissions.
exports.requireAdminPermission = (_permission) => exports.requireAdmin;
exports.requireAllAdminPermissions = (_permissions) => exports.requireAdmin;
exports.requireAnyAdminPermission = (_permissions) => exports.requireAdmin;
exports.requireSuperAdmin = exports.requireAdmin;
exports.requireUserManagement = exports.requireAdmin;
exports.requireProductManagement = exports.requireAdmin;
exports.requireOrderManagement = exports.requireAdmin;
exports.requireAnalytics = exports.requireAdmin;

// Resource ownership check (owner or admin)
exports.requireOwnershipOrAdmin = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (isAdminUser(req.user)) {
      return next();
    }

    const resourceUserId = req.resource ? req.resource[resourceUserField] : req.params.userId;

    if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        code: 'OWNERSHIP_REQUIRED'
      });
    }

    next();
  };
};
