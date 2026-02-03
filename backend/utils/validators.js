const { body, param, query } = require('express-validator');

// User validators
exports.registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

exports.loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Product validators
exports.createProductValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 100 }).withMessage('Product name cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),
  body('category')
    .notEmpty().withMessage('Category is required')
];

// Category validators
exports.createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ max: 50 }).withMessage('Category name cannot exceed 50 characters')
];

// Order validators
exports.createOrderValidator = [
  body('shippingAddress.fullName')
    .trim()
    .notEmpty().withMessage('Full name is required'),
  body('shippingAddress.email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('shippingAddress.phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
  body('shippingAddress.address')
    .trim()
    .notEmpty().withMessage('Address is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty().withMessage('City is required'),
  body('shippingAddress.division')
    .trim()
    .notEmpty().withMessage('Division is required'),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
];

// Review validators
exports.createReviewValidator = [
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
];

// ID parameter validator
exports.idValidator = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];
