const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/admin');
const { createOrderValidator, idValidator } = require('../utils/validators');

// User routes
router.post('/', protect, createOrderValidator, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, idValidator, getOrder);

// Admin routes
router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin'), idValidator, updateOrderStatus);
router.get('/stats/dashboard', protect, authorize('admin'), getOrderStats);

module.exports = router;
