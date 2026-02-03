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
const { requireAdmin } = require('../middleware/admin');
const { createOrderValidator, idValidator } = require('../utils/validators');

// Admin routes (must come before parameterized routes)
router.get('/stats/dashboard', protect, requireAdmin, getOrderStats);
router.get('/all', protect, requireAdmin, getAllOrders);
router.put('/:id/status', protect, requireAdmin, idValidator, updateOrderStatus);

// User routes
router.post('/', protect, createOrderValidator, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, idValidator, getOrder);

module.exports = router;
