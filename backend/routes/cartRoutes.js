const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  syncCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { body, param } = require('express-validator');

// All routes are protected (require authentication)
router.use(protect);

// Validation middleware
const addToCartValidation = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
];

const updateCartValidation = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('quantity')
    .isInt({ min: 0, max: 100 })
    .withMessage('Quantity must be between 0 and 100')
];

const productIdValidation = [
  param('productId')
    .isMongoId()
    .withMessage('Valid product ID is required')
];

// Routes
router.get('/', getCart);
router.post('/add', addToCartValidation, addToCart);
router.put('/update', updateCartValidation, updateCartItem);
router.delete('/remove/:productId', productIdValidation, removeFromCart);
router.delete('/clear', clearCart);
router.post('/coupon', applyCoupon);
router.post('/sync', syncCart);

module.exports = router;