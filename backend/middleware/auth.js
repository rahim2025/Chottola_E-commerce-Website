const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token blacklist (in production, use Redis)
const tokenBlacklist = new Set();

// Add token to blacklist
exports.blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

// Protect routes - verify JWT access token
exports.protect = async (req, res, next) => {
  let token;

  try {
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please login again.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw tokenError;
      }
    }

    // Get user from token
    const user = await User.findById(decoded.id)
      .select('-password -security.loginAttempts -security.lockUntil');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user account is active
    if (user.accountStatus !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is suspended or deactivated.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if user changed password after token was issued
    if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
      return res.status(401).json({
        success: false,
        message: 'Password recently changed. Please login again.',
        code: 'PASSWORD_CHANGED'
      });
    }

    // Grant access to protected route
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication service error'
    });
  }
};

// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  let token;

  try {
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token && !tokenBlacklist.has(token)) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id)
          .select('-password -security.loginAttempts -security.lockUntil');
        
        if (user && user.accountStatus === 'active') {
          req.user = user;
        }
      } catch (tokenError) {
        // Silently fail for optional auth
        console.log('Optional auth failed:', tokenError.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Verify email requirement
exports.requireEmailVerification = (req, res, next) => {
  if (!req.user.verification.email.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to continue.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

// Check specific permissions
exports.requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

// Check multiple permissions (user must have ALL)
exports.requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    const hasAllPermissions = permissions.every(permission => 
      req.user.permissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredPermissions: permissions,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

// Check multiple permissions (user must have ANY)
exports.requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    const hasAnyPermission = permissions.some(permission => 
      req.user.permissions.includes(permission)
    );
    
    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredPermissions: permissions,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

// Rate limiting by user
exports.userRateLimit = (requests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or create user request log
    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }
    
    const userRequestLog = userRequests.get(userId);
    
    // Remove old requests outside the window
    const recentRequests = userRequestLog.filter(timestamp => timestamp > windowStart);
    userRequests.set(userId, recentRequests);
    
    // Check if limit exceeded
    if (recentRequests.length >= requests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    next();
  };
};
