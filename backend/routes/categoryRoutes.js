const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/admin');
const upload = require('../middleware/upload');
const { createCategoryValidator, idValidator } = require('../utils/validators');

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin routes
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.single('image'),
  createCategoryValidator,
  createCategory
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.single('image'),
  idValidator,
  updateCategory
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  idValidator,
  deleteCategory
);

module.exports = router;
