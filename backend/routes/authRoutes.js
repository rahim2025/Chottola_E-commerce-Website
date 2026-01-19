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
  verifyEmail
} = require('../controllers/authController');
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
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
    .isLength({ max: 100 })
    .withMessage('Email must be less than 100 characters'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Please provide a valid phone number'),
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.phone) {
      throw new Error('Either email or phone number must be provided');
    }
    return true;
  })
];

const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Please provide email or phone number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Public routes
router.post('/register', registrationRateLimit, registerValidation, register);
router.post('/login', authRateLimit, loginValidation, login);
router.post('/refresh', apiRateLimit, refreshToken);
router.post('/forgot-password', passwordResetRateLimit, forgotPasswordValidation, forgotPassword);
router.put('/reset-password/:token', passwordResetRateLimit, resetPasswordValidation, resetPassword);
router.get('/verify-email/:token', apiRateLimit, verifyEmail);

// Protected routes
router.use(protect); // All routes below require authentication
router.get('/me', apiRateLimit, getMe);
router.post('/logout', apiRateLimit, logout);
router.put('/change-password', apiRateLimit, changePasswordValidation, changePassword);

module.exports = router;
