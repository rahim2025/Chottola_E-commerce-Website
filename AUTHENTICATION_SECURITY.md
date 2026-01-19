# 🔐 Chottola Authentication & Authorization System

## Overview
This document outlines the comprehensive security-focused authentication and authorization system implemented for the Chottola packet food e-commerce platform.

## 🛡️ Security Features Implemented

### 1. JWT-Based Authentication
- **Access Tokens**: Short-lived tokens (15 minutes) for API access
- **Refresh Tokens**: Long-lived tokens (7-30 days) stored as httpOnly cookies
- **Token Rotation**: Automatic refresh token rotation for enhanced security
- **Token Blacklisting**: Invalidated tokens are blacklisted to prevent reuse

### 2. Password Security
- **bcrypt Hashing**: Industry-standard password hashing with salt rounds
- **Strong Password Policy**: Minimum 8 characters with complexity requirements
- **Password History**: Prevents reuse of recent passwords
- **Account Lockout**: Temporary account lockout after multiple failed attempts

### 3. Role-Based Access Control (RBAC)
- **User Roles**: Customer, Admin with granular permissions
- **Permission System**: Fine-grained permissions for different operations
- **Resource Ownership**: Users can only access their own resources
- **Admin Hierarchy**: Different admin permission levels

### 4. Rate Limiting & DDoS Protection
- **Global Rate Limiting**: 200 requests per 15 minutes per IP
- **Authentication Rate Limiting**: 5 login attempts per 15 minutes
- **Password Reset Limiting**: 3 attempts per hour
- **User-Specific Rate Limiting**: Additional protection for authenticated users

### 5. Data Security & Sanitization
- **MongoDB Injection Prevention**: Input sanitization against NoSQL injection
- **XSS Protection**: Cross-site scripting attack prevention
- **Parameter Pollution Protection**: HTTP parameter pollution prevention
- **Request Size Validation**: Prevent large payload attacks

### 6. Security Headers & CORS
- **Helmet.js Integration**: Comprehensive security headers
- **CORS Configuration**: Restricted cross-origin access
- **Content Security Policy**: XSS and injection attack prevention
- **HSTS Headers**: Enforce HTTPS connections

## 🚀 API Endpoints

### Public Authentication Routes

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+8801234567890"
}
```

**Security Features:**
- Registration rate limiting (3 attempts/hour)
- Strong password validation
- Email format validation
- Phone number validation
- XSS and injection protection

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

**Security Features:**
- Authentication rate limiting (5 attempts/15min)
- Account lockout after failed attempts
- IP tracking and logging
- Secure cookie-based refresh tokens

#### Refresh Token
```http
POST /api/auth/refresh
```

**Security Features:**
- httpOnly cookie validation
- Token rotation on each refresh
- Automatic token expiration

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
PUT /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "NewSecurePass123!"
}
```

### Protected Routes (Require Authentication)

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access-token>
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```

## 🔑 Middleware Functions

### Authentication Middleware

#### `protect`
- Validates JWT access tokens
- Checks token blacklist
- Verifies user account status
- Handles token expiration gracefully

#### `optionalAuth`
- Non-blocking authentication
- Adds user context if token is valid
- Continues without error if no token

#### `requireEmailVerification`
- Ensures user email is verified
- Required for sensitive operations

### Authorization Middleware

#### `requireAdmin`
- Restricts access to admin users only
- Validates admin role and status

#### `requireAdminPermission(permission)`
- Checks specific admin permissions
- Granular access control for admin operations

#### `requireOwnershipOrAdmin(field)`
- Allows users to access their own resources
- Allows admins to access any resource

#### Security-Specific Middleware

#### Rate Limiting
- `authRateLimit`: 5 attempts/15min for auth endpoints
- `passwordResetRateLimit`: 3 attempts/hour
- `registrationRateLimit`: 3 attempts/hour
- `apiRateLimit`: 200 requests/15min

#### Data Protection
- `sanitizeData`: SQL injection and XSS prevention
- `securityHeaders`: Security header configuration
- `requestLogger`: Security event logging

## 🎯 User Roles & Permissions

### Customer Role
**Default Permissions:**
- View products and categories
- Manage personal profile
- Create and manage orders
- Manage wishlist and cart
- Leave reviews and ratings

### Admin Role
**Available Permissions:**
- `manage_users`: Create, update, delete users
- `manage_products`: Full product management
- `manage_orders`: Order processing and management
- `manage_categories`: Category management
- `view_analytics`: Access to reports and analytics
- `manage_inventory`: Stock and inventory management
- `manage_coupons`: Discount and promotion management
- `super_admin`: Full system access

## 🔒 Security Best Practices Implemented

### 1. Token Security
- Short-lived access tokens (15 minutes)
- Secure refresh token storage (httpOnly cookies)
- Token rotation on refresh
- Token blacklisting on logout

### 2. Password Security
- bcrypt with salt rounds
- Password complexity requirements
- Password change tracking
- Account lockout protection

### 3. Request Security
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS policy enforcement
- Security headers implementation

### 4. Database Security
- Connection string protection
- Query parameterization
- Input sanitization
- Access control implementation

### 5. Error Handling
- No sensitive information in error messages
- Comprehensive error logging
- Graceful error responses
- Security event tracking

## 📊 Monitoring & Logging

### Security Events Logged
- Failed login attempts
- Account lockouts
- Token usage and refresh
- Admin access attempts
- Rate limit violations
- Injection attempt detection

### Health Monitoring
- Server uptime tracking
- Memory usage monitoring
- Response time metrics
- Error rate tracking

## 🚨 Security Incident Response

### Automated Responses
- Account lockout after failed attempts
- IP-based rate limiting
- Token blacklisting on suspicious activity
- Real-time security event logging

### Manual Intervention Points
- Admin IP whitelisting
- Account status management
- Permission revocation
- Token invalidation

## 🧪 Testing Security Features

### Authentication Testing
```bash
# Test registration with weak password
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123"}'

# Test rate limiting (repeat 6 times quickly)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrongpass"}'

# Test token refresh
curl -X POST http://localhost:5000/api/auth/refresh \
  --cookie "refreshToken=your-refresh-token"
```

### Authorization Testing
```bash
# Test protected route without token
curl -X GET http://localhost:5000/api/auth/me

# Test admin route with customer token
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer customer-access-token"
```

## 📋 Environment Configuration

### Required Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=different-refresh-secret-key
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
JWT_REFRESH_EXPIRE_LONG=30d

# Security Configuration
ADMIN_IP_WHITELIST=127.0.0.1,localhost
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

## 🔄 Future Security Enhancements

### Planned Features
1. **Two-Factor Authentication (2FA)**
   - SMS-based verification
   - Authenticator app support
   - Backup codes

2. **Advanced Monitoring**
   - Real-time threat detection
   - Behavioral analysis
   - Automated incident response

3. **Enhanced Access Control**
   - Time-based access restrictions
   - Location-based access control
   - Device fingerprinting

4. **Audit Trail**
   - Comprehensive action logging
   - Compliance reporting
   - Data access tracking

---

This authentication system provides enterprise-grade security for the Chottola e-commerce platform while maintaining usability and performance. Regular security audits and updates ensure continued protection against emerging threats.