const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getAdminProducts,
  updateProductStock,
  getProductInventory,
  bulkUpdateProducts,
  getFilterOptions,
  getSearchSuggestions
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { requireAdmin, requireAdminPermission } = require('../middleware/admin');
const upload = require('../middleware/upload');
const { compressImages } = require('../middleware/upload');
const { createProductValidator, idValidator } = require('../utils/validators');

// Public routes (must be before parameterized routes)
router.get('/search/suggestions', getSearchSuggestions);
router.get('/filters', getFilterOptions);
router.get('/featured', getFeaturedProducts);
router.get('/', getProducts);

// Admin-only routes (must be before /:id route)
router.get(
  '/admin/all',
  protect,
  requireAdminPermission('product_management'),
  getAdminProducts
);

router.put(
  '/bulk-update',
  protect,
  requireAdminPermission('product_bulk_operations'),
  bulkUpdateProducts
);

router.post(
  '/',
  protect,
  requireAdminPermission('product_create'),
  upload.array('images', 5),
  compressImages,
  createProductValidator,
  createProduct
);

// Routes with :id parameter (must be after specific routes)
router.get('/:id', getProduct);

router.put(
  '/:id',
  protect,
  requireAdminPermission('product_update'),
  upload.array('images', 5),
  compressImages,
  idValidator,
  updateProduct
);

router.delete(
  '/:id',
  protect,
  requireAdminPermission('product_delete'),
  idValidator,
  deleteProduct
);

router.put(
  '/:id/stock',
  protect,
  requireAdminPermission('inventory_management'),
  idValidator,
  updateProductStock
);

router.get(
  '/:id/inventory',
  protect,
  requireAdminPermission('inventory_view'),
  idValidator,
  getProductInventory
);

module.exports = router;
