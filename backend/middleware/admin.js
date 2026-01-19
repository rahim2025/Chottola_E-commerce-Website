// Role-based access control middleware

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

// Check if user is admin (any admin role)
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  const adminRoles = ['admin', 'super-admin', 'moderator'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access required.',
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }

  next();
};

// Check for specific admin permissions
exports.requireAdminPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const adminRoles = ['admin', 'super-admin', 'moderator'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.',
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }

    // Super-admin has all permissions
    if (req.user.role === 'super-admin') {
      return next();
    }

    // Check permissions for regular admin and moderator
    const userPermissions = req.user.adminData?.permissions || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`,
        userPermissions,
        requiredPermission: permission,
        code: 'INSUFFICIENT_ADMIN_PERMISSIONS'
      });
    }

    next();
  };
};

// Check for multiple admin permissions (user must have ALL)
exports.requireAllAdminPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const adminRoles = ['admin', 'super-admin', 'moderator'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.',
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }

    // Super-admin has all permissions
    if (req.user.role === 'super-admin') {
      return next();
    }

    const userPermissions = req.user.adminData?.permissions || [];
    const hasAllPermissions = permissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      const missingPermissions = permissions.filter(permission => 
        !req.user.permissions.includes(permission)
      );
      
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient admin permissions.',
        userPermissions: req.user.permissions,
        requiredPermissions: permissions,
        missingPermissions,
        code: 'INSUFFICIENT_ADMIN_PERMISSIONS'
      });
    }

    next();
  };
};

// Check for multiple admin permissions (user must have ANY)
exports.requireAnyAdminPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const adminRoles = ['admin', 'super-admin', 'moderator'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.',
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }

    // Super-admin has all permissions
    if (req.user.role === 'super-admin') {
      return next();
    }

    const userPermissions = req.user.adminData?.permissions || [];
    const hasAnyPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient admin permissions.',
        userPermissions: req.user.permissions,
        requiredPermissions: permissions,
        code: 'INSUFFICIENT_ADMIN_PERMISSIONS'
      });
    }

    next();
  };
};

// Super admin only access
exports.requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  if (req.user.role !== 'super-admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super admin access required.',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }

  next();
};

// Resource ownership check (user can access their own resources or admin can access any)
exports.requireOwnershipOrAdmin = (resourceUserField = 'user') => {
  return (req, res, next) => {
    // Admin can access any resource
    const adminRoles = ['admin', 'super-admin', 'moderator'];
    if (adminRoles.includes(req.user.role)) {
      return next();
    }

    // Check if user owns the resource
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

// Check if user can manage other users (admin with user management permissions)
exports.requireUserManagement = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  const adminRoles = ['admin', 'super-admin', 'moderator'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access required.',
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }

  // Super-admin has all permissions
  if (req.user.role === 'super-admin') {
    return next();
  }

  const userPermissions = req.user.adminData?.permissions || [];
  if (!userPermissions.includes('manage-users')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User management permission required.',
      code: 'USER_MANAGEMENT_REQUIRED'
    });
  }

  next();
};

// Check if user can manage products
exports.requireProductManagement = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  const adminRoles = ['admin', 'super-admin', 'moderator'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access required.',
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }

  // Super-admin has all permissions
  if (req.user.role === 'super-admin') {
    return next();
  }

  const userPermissions = req.user.adminData?.permissions || [];
  if (!userPermissions.includes('manage-products')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Product management permission required.',
      code: 'PRODUCT_MANAGEMENT_REQUIRED'
    });
  }

  next();
};

// Check if user can manage orders
exports.requireOrderManagement = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  const adminRoles = ['admin', 'super-admin', 'moderator'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access required.',
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }

  // Super-admin has all permissions
  if (req.user.role === 'super-admin') {
    return next();
  }

  const userPermissions = req.user.adminData?.permissions || [];
  if (!userPermissions.includes('manage-orders')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Order management permission required.',
      code: 'ORDER_MANAGEMENT_REQUIRED'
    });
  }

  next();
};

// Check if user can view analytics and reports
exports.requireAnalytics = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  const adminRoles = ['admin', 'super-admin', 'moderator'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access required.',
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }

  // Super-admin has all permissions
  if (req.user.role === 'super-admin') {
    return next();
  }

  const userPermissions = req.user.adminData?.permissions || [];
  if (!userPermissions.includes('view-analytics')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Analytics permission required.',
      code: 'ANALYTICS_REQUIRED'
    });
  }

  next();
};
