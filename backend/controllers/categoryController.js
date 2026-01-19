const Category = require('../models/Category');
const { validationResult } = require('express-validator');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/helpers');

// @desc    Get all categories for admin
// @route   GET /api/categories/admin/all
// @access  Private/Admin
exports.getAllForAdmin = async (req, res, next) => {
  try {
    const { search, isActive, isFeatured, parent } = req.query;
    let query = {};

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by active status
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    // Filter by featured status
    if (isFeatured !== undefined && isFeatured !== '') {
      query.isFeatured = isFeatured === 'true';
    }

    // Filter by parent
    if (parent) {
      query.parent = parent === 'null' ? null : parent;
    }

    const categories = await Category.find(query)
      .populate('parent', 'name')
      .sort('sortOrder name');

    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    let query = {};

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const categories = await Category.find(query).sort('name');

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Handle image upload
    if (req.file) {
      const imageUrl = await uploadToCloudinary(req.file.buffer, 'categories');
      req.body.image = {
        url: imageUrl,
        alt: req.body.name || 'Category image'
      };
    }

    // Convert empty parent to null
    if (req.body.parent === '' || req.body.parent === 'null') {
      req.body.parent = null;
    }

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Handle image upload
    if (req.file) {
      // Delete old image
      if (category.image?.url) {
        await deleteFromCloudinary(category.image.url);
      }
      const imageUrl = await uploadToCloudinary(req.file.buffer, 'categories');
      req.body.image = {
        url: imageUrl,
        alt: req.body.name || category.name || 'Category image'
      };
    }

    // Convert empty parent to null
    if (req.body.parent === '' || req.body.parent === 'null') {
      req.body.parent = null;
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Delete image from cloudinary
    if (category.image?.url) {
      await deleteFromCloudinary(category.image.url);
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update categories
// @route   PUT /api/categories/bulk-update
// @access  Private/Admin
exports.bulkUpdateCategories = async (req, res, next) => {
  try {
    const { categoryIds, action } = req.body;

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category IDs'
      });
    }

    let updateData = {};

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        break;
      case 'deactivate':
        updateData = { isActive: false };
        break;
      case 'feature':
        updateData = { isFeatured: true };
        break;
      case 'unfeature':
        updateData = { isFeatured: false };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await Category.updateMany(
      { _id: { $in: categoryIds } },
      { $set: updateData }
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} categories`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private/Admin
exports.reorderCategories = async (req, res, next) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide categories array'
      });
    }

    // Update sort order for each category
    const updatePromises = categories.map((cat, index) =>
      Category.findByIdAndUpdate(cat.id, { sortOrder: index })
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};
