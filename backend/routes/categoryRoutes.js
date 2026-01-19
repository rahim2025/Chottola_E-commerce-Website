const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllForAdmin,
  bulkUpdateCategories,
  reorderCategories
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { requireAdmin, requireAdminPermission } = require('../middleware/admin');
const upload = require('../middleware/upload');
const { compressImages } = require('../middleware/upload');
const { createCategoryValidator, idValidator } = require('../utils/validators');

// Admin routes (must come before public routes)
router.get(
  '/admin/all',
  protect,
  requireAdminPermission('manage-categories'),
  getAllForAdmin
);

router.put(
  '/bulk-update',
  protect,
  requireAdminPermission('manage-categories'),
  bulkUpdateCategories
);

router.put(
  '/reorder',
  protect,
  requireAdminPermission('manage-categories'),
  reorderCategories
);

router.post(
  '/',
  protect,
  requireAdminPermission('manage-categories'),
  upload.single('image'),
  compressImages,
  createCategoryValidator,
  createCategory
);

router.put(
  '/:id',
  protect,
  requireAdminPermission('manage-categories'),
  upload.single('image'),
  compressImages,
  idValidator,
  updateCategory
);

router.delete(
  '/:id',
  protect,
  requireAdminPermission('manage-categories'),
  idValidator,
  deleteCategory
);

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

module.exports = router;
