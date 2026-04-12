const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateProfile,
  updatePassword,
  addToWishlist,
  removeFromWishlist,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  updateUser
} = require('../controllers/userController');
const { getMe } = require('../controllers/authController');
const { protect, requireEmailVerification, optionalAuth } = require('../middleware/auth');
const { 
  requireAdmin, 
  requireOwnershipOrAdmin 
} = require('../middleware/admin');
const { apiRateLimit, adminRateLimit } = require('../middleware/security');

// Public routes
router.get('/public/:id', apiRateLimit, optionalAuth, getUserById); // Public profile view

// Protected routes - require authentication
router.use(protect);
router.use(apiRateLimit);

// User's own profile routes
router.get('/profile', getMe); // Get own profile
router.put('/profile', updateProfile); // Update own profile
router.put('/password', updatePassword); // Change own password

// Wishlist management (requires email verification)
router.use(requireEmailVerification);
router.post('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

// Admin only routes
router.use(adminRateLimit); // More lenient rate limiting for admins
router.get('/', requireAdmin, getUsers); // Get all users
router.get('/:id', requireOwnershipOrAdmin('_id'), getUserById); // Get specific user
router.put('/:id/role', requireAdmin, updateUserRole); // Update user role
router.put('/:id/status', requireAdmin, updateUserStatus); // Update user status
router.put('/:id', requireAdmin, updateUser); // Update user
router.delete('/:id', requireAdmin, deleteUser); // Delete user

module.exports = router;
