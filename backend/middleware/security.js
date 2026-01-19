const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const helmet = require('helmet');

// General rate limiting
exports.createRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000) || 900
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    ...options
  };

  return rateLimit(defaultOptions);
};

// Strict rate limiting for authentication endpoints (DISABLED for development)
exports.authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Very high limit - effectively disabled
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again in 15 minutes.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

// Password reset rate limiting (DISABLED for development)
exports.passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // Very high limit - effectively disabled
  message: {
    success: false,
    message: 'Too many password reset attempts from this IP, please try again in 1 hour.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Registration rate limiting (DISABLED for development)
exports.registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // Very high limit - effectively disabled
  message: {
    success: false,
    message: 'Too many registration attempts from this IP, please try again in 1 hour.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API rate limiting for authenticated users (DISABLED for development)
exports.apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Very high limit - effectively disabled
  message: {
    success: false,
    message: 'API rate limit exceeded, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin API rate limiting (more lenient)
exports.adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 admin requests per windowMs
  message: {
    success: false,
    message: 'Admin API rate limit exceeded, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Security headers middleware
exports.securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.cloudinary.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Data sanitization middleware
exports.sanitizeData = [
  // Sanitize user input against NoSQL injection attacks
  mongoSanitize({
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized key ${key} from ${req.ip}`);
    }
  }),
  
  // Clean user input from malicious XSS code
  xss(),
  
  // Prevent HTTP Parameter Pollution attacks
  hpp({
    whitelist: [
      'sort',
      'fields',
      'page',
      'limit',
      'category',
      'price',
      'rating',
      'brand',
      'tags'
    ]
  })
];

// CORS configuration
exports.corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    // Add production domains from environment
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (process.env.ADMIN_URL) {
      allowedOrigins.push(process.env.ADMIN_URL);
    }
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset']
};

// Request logging middleware (only logs errors)
exports.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log response only for errors (4xx, 5xx status codes)
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const duration = Date.now() - start;
      console.error(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
    }
  });
  
  next();
};

// IP whitelist middleware (for admin operations)
exports.adminIPWhitelist = (req, res, next) => {
  const adminIPs = process.env.ADMIN_IP_WHITELIST ? 
    process.env.ADMIN_IP_WHITELIST.split(',').map(ip => ip.trim()) : [];
    
  if (adminIPs.length === 0) {
    return next(); // No IP restriction if not configured
  }
  
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  if (!adminIPs.includes(clientIP)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. IP address not whitelisted for admin operations.',
      code: 'IP_NOT_WHITELISTED'
    });
  }
  
  next();
};

// Validate request size
exports.validateRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length'));
    const maxSizeBytes = parseSize(maxSize);
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: `Request entity too large. Maximum size allowed: ${maxSize}`,
        code: 'REQUEST_TOO_LARGE'
      });
    }
    
    next();
  };
};

// Helper function to parse size strings
function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  
  if (!match) {
    throw new Error('Invalid size format');
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return value * units[unit];
}

// Security event logger
exports.securityLogger = (event, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    severity: getSeverity(event)
  };
  
  // In production, send to monitoring service
  console.warn('SECURITY EVENT:', JSON.stringify(logEntry, null, 2));
  
  // TODO: Integrate with external logging service (e.g., Winston, DataDog)
};

function getSeverity(event) {
  const severityMap = {
    'invalid_token': 'medium',
    'multiple_failed_logins': 'high',
    'admin_access_attempt': 'high',
    'injection_attempt': 'critical',
    'xss_attempt': 'high',
    'rate_limit_exceeded': 'low',
    'suspicious_activity': 'medium'
  };
  
  return severityMap[event] || 'medium';
}