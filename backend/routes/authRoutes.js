const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  registerWithPhone,
  loginWithPhone,
  updateProfile
} = require('../controllers/authController');
const {
  sendOTP,
  verifyOTP,
  resendOTP,
  getOTPStats
} = require('../controllers/otpController');
const {
  sendEmailOTP,
  verifyEmailOTP,
  resendEmailOTP,
  getEmailOTPStats
} = require('../controllers/emailOtpController');
const { protect, requireEmailVerification } = require('../middleware/auth');
const {
  authRateLimit,
  passwordResetRateLimit,
  registrationRateLimit,
  apiRateLimit
} = require('../middleware/security');

const router = express.Router();

// Enhanced validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
    .isLength({ max: 100 })
    .withMessage('Email must be less than 100 characters'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be at least 6 characters'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('Email OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Please provide email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be at least 6 characters')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be at least 6 characters')
];

// OTP validation rules
const sendOTPValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10 })
    .withMessage('Please provide a valid phone number')
];

// Email OTP validation rules
const sendEmailOTPValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('purpose')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Purpose must be between 2 and 50 characters')
];

const verifyEmailOTPValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

const verifyOTPValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

const registerWithPhoneValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10 })
    .withMessage('Please provide a valid phone number'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
];

const loginWithPhoneValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10 })
    .withMessage('Please provide a valid phone number'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

// ============ Public Routes (Email/Password Auth) ============
router.post('/register', registrationRateLimit, registerValidation, register);
router.post('/login', authRateLimit, loginValidation, login);
router.post('/refresh', apiRateLimit, refreshToken);
router.post('/forgot-password', passwordResetRateLimit, forgotPasswordValidation, forgotPassword);
router.put('/reset-password', passwordResetRateLimit, resetPasswordValidation, resetPassword);
router.get('/verify-email/:token', apiRateLimit, verifyEmail);

// ============ OTP Routes (Phone-based Auth) ============
router.post('/send-otp', apiRateLimit, sendOTPValidation, sendOTP);
router.post('/verify-otp', apiRateLimit, verifyOTPValidation, verifyOTP);
router.post('/resend-otp', apiRateLimit, sendOTPValidation, resendOTP);

// ============ OTP Routes (Email-based) ============
router.post('/send-email-otp', apiRateLimit, sendEmailOTPValidation, sendEmailOTP);
router.post('/verify-email-otp', apiRateLimit, verifyEmailOTPValidation, verifyEmailOTP);
router.post('/resend-email-otp', apiRateLimit, sendEmailOTPValidation, resendEmailOTP);

// ============ Phone Registration & Login ============
router.post('/register/phone', registrationRateLimit, registerWithPhoneValidation, registerWithPhone);
router.post('/login/phone', authRateLimit, loginWithPhoneValidation, loginWithPhone);

// ============ Protected Routes ============
router.use(protect); // All routes below require authentication
router.get('/me', apiRateLimit, getMe);
router.post('/logout', apiRateLimit, logout);
router.put('/change-password', apiRateLimit, changePasswordValidation, changePassword);
router.put('/profile', apiRateLimit, updateProfileValidation, updateProfile);

// Debug endpoint (can be restricted to admins only in production)
router.get('/otp-stats', getOTPStats);
router.get('/email-otp-stats', getEmailOTPStats);

module.exports = router;
