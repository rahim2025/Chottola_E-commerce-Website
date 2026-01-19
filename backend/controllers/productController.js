const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/helpers');
const mongoose = require('mongoose');

// @desc    Create new product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      shortDescription,
      category,
      brand,
      weight,
      pricing,
      nutrition,
      allergens,
      ingredients,
      certifications,
      storage,
      origin,
      tags,
      isActive,
      isFeatured,
      // Inventory data
      initialStock,
      reorderLevel,
      maxStock,
      batchInfo
    } = req.body;

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Handle image uploads
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await uploadToCloudinary(file.path, {
            folder: 'products',
            width: 800,
            height: 600,
            crop: 'fill',
            quality: 'auto:good'
          });
          
          uploadedImages.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            alt: `${name} - Image ${uploadedImages.length + 1}`
          });
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          // Continue with product creation even if some images fail
        }
      }
    }

    // Generate SKU if not provided
    const sku = `${brand?.toUpperCase().slice(0, 3) || 'PRD'}-${Date.now().toString().slice(-6)}`;

    // Create product
    const productData = {
      name,
      description,
      shortDescription,
      category,
      brand: brand || 'Unknown',
      weight: {
        value: weight?.value || 0,
        unit: weight?.unit || 'g'
      },
      pricing: {
        costPrice: pricing?.costPrice || 0,
        sellingPrice: pricing?.sellingPrice || 0,
        discountPrice: pricing?.discountPrice || null,
        currency: pricing?.currency || 'BDT'
      },
      nutrition: nutrition || {},
      allergens: allergens || [],
      ingredients: ingredients || [],
      certifications: certifications || [],
      storage: storage || {},
      origin: origin || {},
      images: uploadedImages,
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
      sku,
      createdBy: req.user._id
    };

    const product = await Product.create([productData], { session });
    const createdProduct = product[0];

    // Create inventory record
    const inventoryData = {
      product: createdProduct._id,
      sku,
      stock: {
        current: initialStock || 0,
        reorderLevel: reorderLevel || 10,
        maxStock: maxStock || 1000
      },
      pricing: {
        costPrice: pricing?.costPrice || 0,
        sellingPrice: pricing?.sellingPrice || 0,
        currency: pricing?.currency || 'BDT'
      },
      supplier: {
        primary: {
          name: 'Default Supplier',
          leadTime: 7,
          minimumOrder: 1
        }
      }
    };

    // Add batch info if provided
    if (batchInfo && initialStock > 0) {
      inventoryData.batches = [{
        batchNumber: batchInfo.batchNumber || `BATCH-${Date.now()}`,
        manufactureDate: batchInfo.manufactureDate || new Date(),
        expiryDate: batchInfo.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        quantity: initialStock,
        costPrice: pricing?.costPrice || 0,
        qualityCheck: {
          passed: true,
          checkedBy: req.user.name,
          checkDate: new Date()
        }
      }];
    }

    await Inventory.create([inventoryData], { session });

    await session.commitTransaction();
    session.endSession();

    // Populate and return the created product
    const populatedProduct = await Product.findById(createdProduct._id)
      .populate('category', 'name slug')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    // Clean up uploaded images if product creation failed
    if (uploadedImages?.length > 0) {
      for (const image of uploadedImages) {
        try {
          await deleteFromCloudinary(image.publicId);
        } catch (deleteError) {
          console.error('Failed to delete uploaded image:', deleteError);
        }
      }
    }
    
    next(error);
  }
};
exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build aggregation pipeline for better performance
    const pipeline = [];

    // Match stage - build query conditions
    let matchQuery = { isActive: true };

    // Search by name, brand, description, or tags
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      matchQuery.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { brand: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } },
        { sku: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Filter by category (support multiple categories)
    if (req.query.category) {
      const categories = Array.isArray(req.query.category) 
        ? req.query.category 
        : req.query.category.split(',');
      
      if (categories.length > 0) {
        matchQuery.category = { $in: categories.map(cat => mongoose.Types.ObjectId(cat)) };
      }
    }

    // Filter by brand (support multiple brands)
    if (req.query.brand) {
      const brands = Array.isArray(req.query.brand) 
        ? req.query.brand 
        : req.query.brand.split(',');
      
      if (brands.length > 0) {
        matchQuery.brand = { $in: brands.map(brand => new RegExp(brand, 'i')) };
      }
    }

    // Price range filter (check both regular and discount price)
    if (req.query.minPrice || req.query.maxPrice) {
      const priceQuery = {};
      if (req.query.minPrice) priceQuery.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) priceQuery.$lte = parseFloat(req.query.maxPrice);
      
      // Match products where either price or discountPrice is in range
      matchQuery.$or = matchQuery.$or || [];
      matchQuery.$or.push(
        { 
          $expr: {
            $and: [
              { $gte: [{ $ifNull: ["$discountPrice", "$price"] }, priceQuery.$gte || 0] },
              { $lte: [{ $ifNull: ["$discountPrice", "$price"] }, priceQuery.$lte || Number.MAX_VALUE] }
            ]
          }
        }
      );
    }

    // Filter by stock availability
    if (req.query.inStock === 'true') {
      matchQuery.stock = { $gt: 0 };
    }

    // Filter by featured products
    if (req.query.featured === 'true') {
      matchQuery.isFeatured = true;
    }

    // Rating filter
    if (req.query.minRating) {
      matchQuery.averageRating = { $gte: parseFloat(req.query.minRating) };
    }

    pipeline.push({ $match: matchQuery });

    // Add category lookup
    pipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    });

    pipeline.push({
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true
      }
    });

    // Add calculated fields for sorting
    pipeline.push({
      $addFields: {
        effectivePrice: { $ifNull: ["$discountPrice", "$price"] },
        hasDiscount: { $gt: ["$discountPrice", 0] },
        discountAmount: { 
          $cond: {
            if: { $gt: ["$discountPrice", 0] },
            then: { $subtract: ["$price", "$discountPrice"] },
            else: 0
          }
        },
        discountPercentage: {
          $cond: {
            if: { $and: [{ $gt: ["$discountPrice", 0] }, { $gt: ["$price", 0] }] },
            then: { 
              $multiply: [
                { $divide: [{ $subtract: ["$price", "$discountPrice"] }, "$price"] },
                100
              ]
            },
            else: 0
          }
        }
      }
    });

    // Handle sorting
    let sortStage = {};
    
    switch (req.query.sort) {
      case 'price_low_high':
        sortStage = { effectivePrice: 1 };
        break;
      case 'price_high_low':
        sortStage = { effectivePrice: -1 };
        break;
      case 'popularity':
        sortStage = { totalPurchases: -1, averageRating: -1 };
        break;
      case 'rating':
        sortStage = { averageRating: -1, totalReviews: -1 };
        break;
      case 'newest':
        sortStage = { createdAt: -1 };
        break;
      case 'oldest':
        sortStage = { createdAt: 1 };
        break;
      case 'name_asc':
        sortStage = { name: 1 };
        break;
      case 'name_desc':
        sortStage = { name: -1 };
        break;
      case 'discount':
        sortStage = { discountPercentage: -1 };
        break;
      default:
        sortStage = { createdAt: -1, _id: -1 }; // Add _id for consistent sorting
    }

    pipeline.push({ $sort: sortStage });

    // Count total documents for pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await Product.aggregate(countPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Select fields to return
    pipeline.push({
      $project: {
        name: 1,
        description: 1,
        price: 1,
        discountPrice: 1,
        effectivePrice: 1,
        discountPercentage: 1,
        brand: 1,
        images: { $slice: ["$images", 1] }, // Only return first image for list view
        stock: 1,
        averageRating: 1,
        totalReviews: 1,
        isFeatured: 1,
        sku: 1,
        weight: 1,
        tags: 1,
        createdAt: 1,
        category: {
          _id: 1,
          name: 1,
          slug: 1
        }
      }
    });

    const products = await Product.aggregate(pipeline);

    // Get filter options for frontend
    const filterOptions = await this.getFilterOptions();

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: await this.getFilterOptions(),
      query: req.query // Return applied filters for frontend state
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get filter options
exports.getFilterOptions = async (req, res, next) => {
  try {
    const [categories, brands, priceRange] = await Promise.all([
      // Get all active categories with product count
      Product.aggregate([
        { $match: { isActive: true } },
        { 
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category._id',
            name: { $first: '$category.name' },
            slug: { $first: '$category.slug' },
            productCount: { $sum: 1 }
          }
        },
        { $sort: { name: 1 } }
      ]),

      // Get all brands with product count
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$brand',
            productCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Get price range
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            minPrice: { 
              $min: { 
                $cond: {
                  if: { $gt: ['$discountPrice', 0] },
                  then: '$discountPrice',
                  else: '$price'
                }
              }
            },
            maxPrice: { 
              $max: { 
                $cond: {
                  if: { $gt: ['$discountPrice', 0] },
                  then: '$discountPrice',
                  else: '$price'
                }
              }
            }
          }
        }
      ])
    ]);

    const filterOptions = {
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        slug: cat.slug,
        productCount: cat.productCount
      })),
      brands: brands.map(brand => ({
        name: brand._id,
        productCount: brand.productCount
      })).filter(brand => brand.name), // Remove empty brands
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 1000 },
      sortOptions: [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'price_low_high', label: 'Price: Low to High' },
        { value: 'price_high_low', label: 'Price: High to Low' },
        { value: 'name_asc', label: 'Name: A to Z' },
        { value: 'name_desc', label: 'Name: Z to A' },
        { value: 'popularity', label: 'Most Popular' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'discount', label: 'Biggest Discount' }
      ]
    };

    if (res) {
      // If called as an endpoint
      res.status(200).json({
        success: true,
        data: filterOptions
      });
    } else {
      // If called as helper function
      return filterOptions;
    }
  } catch (error) {
    if (next) {
      next(error);
    } else {
      throw error;
    }
  }
};

// @desc    Get search suggestions
// @route   GET /api/products/search/suggestions
// @access  Public
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          products: [],
          brands: [],
          categories: []
        }
      });
    }

    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, 'i');

    const [products, brands, categories] = await Promise.all([
      // Product suggestions
      Product.find({
        $and: [
          { isActive: true },
          {
            $or: [
              { name: searchRegex },
              { brand: searchRegex },
              { tags: searchRegex }
            ]
          }
        ]
      })
      .select('name brand images')
      .limit(5)
      .lean(),

      // Brand suggestions
      Product.distinct('brand', {
        isActive: true,
        brand: searchRegex
      }).limit(5),

      // Category suggestions
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        { $match: { 'category.name': searchRegex } },
        {
          $group: {
            _id: '$category._id',
            name: { $first: '$category.name' },
            slug: { $first: '$category.slug' }
          }
        },
        { $limit: 5 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        products: products.map(p => ({
          id: p._id,
          name: p.name,
          brand: p.brand,
          image: p.images?.[0]?.url
        })),
        brands: brands,
        categories: categories.map(c => ({
          id: c._id,
          name: c.name,
          slug: c.slug
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await uploadToCloudinary(file.buffer, 'products');
        imageUrls.push(imageUrl);
      }
    }

    const productData = {
      ...req.body,
      images: imageUrls
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      // Delete old images from cloudinary
      for (const oldImage of product.images) {
        await deleteFromCloudinary(oldImage);
      }

      // Upload new images
      let imageUrls = [];
      for (const file of req.files) {
        const imageUrl = await uploadToCloudinary(file.buffer, 'products');
        imageUrls.push(imageUrl);
      }
      req.body.images = imageUrls;
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete images from cloudinary
    for (const image of product.images) {
      await deleteFromCloudinary(image);
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products for admin (including inactive)
// @route   GET /api/products/admin/all
// @access  Private/Admin
exports.getAdminProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query (admin can see all products)
    let query = {};

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Filter by featured status
    if (req.query.isFeatured !== undefined) {
      query.isFeatured = req.query.isFeatured === 'true';
    }

    // Search by name, description, or SKU
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { sku: searchRegex },
        { brand: searchRegex }
      ];
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query['pricing.sellingPrice'] = {};
      if (req.query.minPrice) query['pricing.sellingPrice'].$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query['pricing.sellingPrice'].$lte = parseFloat(req.query.maxPrice);
    }

    // Build sort
    let sort = {};
    if (req.query.sort) {
      const sortField = req.query.sort;
      const sortOrder = req.query.order === 'asc' ? 1 : -1;
      sort[sortField] = sortOrder;
    } else {
      sort = { createdAt: -1 };
    }

    // Execute query with inventory data
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get inventory data for each product
    const productIds = products.map(p => p._id);
    const inventories = await Inventory.find({ product: { $in: productIds } })
      .select('product stock batches alerts')
      .lean();

    // Merge inventory data with products
    const enrichedProducts = products.map(product => {
      const inventory = inventories.find(inv => inv.product.toString() === product._id.toString());
      return {
        ...product,
        inventory: inventory ? {
          stock: inventory.stock,
          batchCount: inventory.batches?.length || 0,
          hasAlerts: inventory.alerts?.some(alert => alert.isActive) || false,
          stockStatus: inventory.stock?.current <= 0 ? 'out_of_stock' : 
                      inventory.stock?.current <= inventory.stock?.reorderLevel ? 'low_stock' : 'in_stock'
        } : null
      };
    });

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      data: enrichedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product stock (Admin only)
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
exports.updateProductStock = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { action, quantity, reason, batchInfo } = req.body;

    if (!['add', 'reduce', 'set'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "add", "reduce", or "set"'
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    // Find product and inventory
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let inventory = await Inventory.findOne({ product: productId });
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found for this product'
      });
    }

    const oldStock = inventory.stock.current;
    let newStock;

    switch (action) {
      case 'add':
        newStock = oldStock + quantity;
        // Add new batch if batch info provided
        if (batchInfo) {
          inventory.batches.push({
            batchNumber: batchInfo.batchNumber || `BATCH-${Date.now()}`,
            manufactureDate: batchInfo.manufactureDate || new Date(),
            expiryDate: batchInfo.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            quantity: quantity,
            costPrice: batchInfo.costPrice || inventory.pricing.costPrice,
            qualityCheck: {
              passed: true,
              checkedBy: req.user.name,
              checkDate: new Date()
            }
          });
        }
        break;
        
      case 'reduce':
        if (quantity > oldStock) {
          return res.status(400).json({
            success: false,
            message: `Cannot reduce stock by ${quantity}. Current stock is ${oldStock}`
          });
        }
        newStock = oldStock - quantity;
        // Use FIFO method to reduce from oldest batches
        inventory.batches = inventory.batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        let remainingToReduce = quantity;
        for (let batch of inventory.batches) {
          if (remainingToReduce <= 0) break;
          if (batch.quantity > 0) {
            const reduceFromBatch = Math.min(batch.quantity, remainingToReduce);
            batch.quantity -= reduceFromBatch;
            remainingToReduce -= reduceFromBatch;
          }
        }
        break;
        
      case 'set':
        newStock = quantity;
        // Reset batches with single batch
        inventory.batches = [{
          batchNumber: batchInfo?.batchNumber || `BATCH-${Date.now()}`,
          manufactureDate: batchInfo?.manufactureDate || new Date(),
          expiryDate: batchInfo?.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          quantity: newStock,
          costPrice: batchInfo?.costPrice || inventory.pricing.costPrice,
          qualityCheck: {
            passed: true,
            checkedBy: req.user.name,
            checkDate: new Date()
          }
        }];
        break;
    }

    // Update inventory
    inventory.stock.current = newStock;
    
    // Add movement record
    inventory.movements.push({
      type: action === 'add' ? 'in' : action === 'reduce' ? 'out' : 'adjustment',
      quantity: action === 'set' ? Math.abs(newStock - oldStock) : quantity,
      reason: reason || `Stock ${action} by admin`,
      reference: `ADMIN-${Date.now()}`,
      date: new Date(),
      user: req.user._id,
      notes: `Stock ${action}: ${oldStock} -> ${newStock}`
    });

    // Check for alerts
    if (newStock <= inventory.stock.reorderLevel && newStock > 0) {
      inventory.alerts.push({
        type: 'low_stock',
        message: `Stock is low: ${newStock} units remaining`,
        severity: 'medium',
        isActive: true
      });
    } else if (newStock === 0) {
      inventory.alerts.push({
        type: 'out_of_stock',
        message: 'Product is out of stock',
        severity: 'high',
        isActive: true
      });
    }

    await inventory.save();

    // Update product's lastRestockDate if stock was added
    if (action === 'add' || (action === 'set' && newStock > oldStock)) {
      product.lastRestockDate = new Date();
      await product.save();
    }

    res.status(200).json({
      success: true,
      message: `Stock ${action}ed successfully`,
      data: {
        productId,
        productName: product.name,
        oldStock,
        newStock,
        stockChange: newStock - oldStock,
        action,
        stockStatus: newStock <= 0 ? 'out_of_stock' : 
                    newStock <= inventory.stock.reorderLevel ? 'low_stock' : 'in_stock'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product inventory details (Admin only)
// @route   GET /api/products/:id/inventory
// @access  Private/Admin
exports.getProductInventory = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    
    const product = await Product.findById(productId).select('name sku');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const inventory = await Inventory.findOne({ product: productId })
      .populate('movements.user', 'name email')
      .populate('alerts.resolvedBy', 'name email');
      
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found'
      });
    }

    // Calculate additional stats
    const stats = {
      availableStock: inventory.stock.current - inventory.stock.reserved,
      stockValue: inventory.stock.current * inventory.pricing.sellingPrice,
      activeBatches: inventory.batches.filter(batch => batch.quantity > 0).length,
      expiringBatches: inventory.batches.filter(batch => 
        new Date(batch.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).length,
      recentMovements: inventory.movements.slice(-10),
      activeAlerts: inventory.alerts.filter(alert => alert.isActive).length
    };

    res.status(200).json({
      success: true,
      data: {
        product: product,
        inventory: inventory,
        stats: stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update products (Admin only)
// @route   PUT /api/products/bulk-update
// @access  Private/Admin
exports.bulkUpdateProducts = async (req, res, next) => {
  try {
    const { productIds, updateData, action } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    let result;
    
    switch (action) {
      case 'activate':
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { isActive: true, updatedBy: req.user._id }
        );
        break;
        
      case 'deactivate':
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { isActive: false, updatedBy: req.user._id }
        );
        break;
        
      case 'feature':
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { isFeatured: true, updatedBy: req.user._id }
        );
        break;
        
      case 'unfeature':
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { isFeatured: false, updatedBy: req.user._id }
        );
        break;
        
      case 'update':
        if (!updateData) {
          return res.status(400).json({
            success: false,
            message: 'Update data is required for update action'
          });
        }
        updateData.updatedBy = req.user._id;
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          updateData
        );
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Supported actions: activate, deactivate, feature, unfeature, update'
        });
    }

    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      isFeatured: true
    })
      .populate('category', 'name slug')
      .limit(8)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};
