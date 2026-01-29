const Product = require('../models/Product');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const { validationResult } = require('express-validator');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/helpers');
const mongoose = require('mongoose');

// @desc    Create new product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false;
  
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Log raw request body for debugging
    console.log('=== Raw Request Body ===');
    console.log('Body keys:', Object.keys(req.body));
    console.log('pricing:', req.body.pricing);
    console.log('weight:', req.body.weight);
    console.log('allergens:', req.body.allergens);
    console.log('certifications:', req.body.certifications);
    console.log('ingredients:', req.body.ingredients);

    // Helper function to deeply parse JSON strings
    const deepParse = (value) => {
      if (typeof value !== 'string') return value;
      
      try {
        const parsed = JSON.parse(value);
        // If parsed result is still a string, try parsing again (nested JSON)
        if (typeof parsed === 'string') {
          return deepParse(parsed);
        }
        // If it's an array, parse each element
        if (Array.isArray(parsed)) {
          return parsed.map(item => deepParse(item));
        }
        return parsed;
      } catch (e) {
        return value;
      }
    };

    // Parse JSON strings from FormData
    const parsedBody = {};
    for (const key in req.body) {
      parsedBody[key] = deepParse(req.body[key]);
    }
    
    console.log('=== After Deep Parse ===');
    console.log('Parsed pricing:', parsedBody.pricing);
    console.log('Parsed allergens:', parsedBody.allergens);
    console.log('Parsed certifications:', parsedBody.certifications);

    const {
      name,
      description,
      shortDescription,
      category,
      brand,
      weight: weightRaw,
      pricing: pricingRaw,
      nutrition,
      allergens,
      certifications,
      isActive,
      isFeatured,
      // Inventory data
      initialStock
    } = parsedBody;

    const weight = typeof weightRaw === 'string' ? deepParse(weightRaw) : (weightRaw || {});
    const pricing = typeof pricingRaw === 'string' ? deepParse(pricingRaw) : (pricingRaw || {});

    const getNumber = (...vals) => {
      for (const v of vals) {
        if (v === undefined || v === null || v === '') continue;
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
      }
      return undefined;
    };

    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, and category'
      });
    }

    // Log parsed data for debugging
    console.log('=== Product Creation Debug ===');
    console.log('Parsed pricing:', pricing);
    console.log('Parsed weight:', weight);
    console.log('Parsed allergens:', allergens);
    console.log('Parsed certifications:', certifications);
    console.log('Initial stock:', initialStock);

    // Require at least one image
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one product image'
      });
    }

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
          const imageUrl = await uploadToCloudinary(file.buffer, 'products');
          
          uploadedImages.push({
            url: imageUrl,
            alt: `${name} - Image ${uploadedImages.length + 1}`,
            isPrimary: uploadedImages.length === 0
          });
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
    }

    // SKU no longer required; leave blank or derive if provided
    const sku = req.body?.sku || '';

    // Map pricing data to price field with fallbacks to raw body keys
    const price = getNumber(
      pricing?.sellingPrice,
      pricing?.price,
      req.body?.sellingPrice,
      req.body?.price,
      req.body?.['pricing.sellingPrice'],
      req.body?.['pricing["sellingPrice"]'],
      req.body?.['pricing["price"]']
    );

    const discountPrice = getNumber(
      pricing?.discountPrice,
      req.body?.discountPrice,
      req.body?.['pricing.discountPrice'],
      req.body?.['pricing["discountPrice"]']
    ) ?? 0;

    if (price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide selling price'
      });
    }
    
    // Calculate discount percentage if discount price is provided
    const discountPercentage = discountPrice > 0 && price > 0 
      ? Math.round(((price - discountPrice) / price) * 100) 
      : 0;

    // Helper to ensure array parsing
    const ensureArray = (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed;
        } catch (_) {
          /* fall through */
        }
        // fallback: split comma/whitespace for simple strings
        if (value.includes(',')) {
          return value.split(',').map(v => v.trim()).filter(Boolean);
        }
        return value ? [value] : [];
      }
      return [];
    };

    const allowedAllergens = ['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'fish', 'shellfish', 'sesame', 'gluten'];
    // Ensure allergens are arrays, map to lowercase, and keep only allowed enums
    const allergenArray = ensureArray(allergens);
    const mappedAllergens = allergenArray
      .map(a => (typeof a === 'string' ? a : String(a)).toLowerCase().trim())
      .filter(a => allowedAllergens.includes(a));
      
    const allowedCertifications = ['organic', 'fair-trade', 'non-gmo', 'halal', 'kosher', 'vegan', 'gluten-free'];
    // Ensure certifications are arrays, map to lowercase-with-hyphens, keep only allowed enums
    const certificationArray = ensureArray(certifications);
    const mappedCertifications = certificationArray
      .map(c => (typeof c === 'string' ? c : String(c)).toLowerCase().trim().replace(/\s+/g, '-'))
      .filter(c => allowedCertifications.includes(c));

    // Set default dates
    const manufactureDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Default 1 year from now

    // Normalize weight unit (frontend may send "pieces" but schema expects "piece")
    const weightUnit = weight?.unit === 'pieces' ? 'piece' : (weight?.unit || req.body?.['weight.unit'] || 'piece');

    const weightValue = getNumber(weight?.value, req.body?.['weight.value']);
    if (weightValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide weight value'
      });
    }

    // Create product
    const productData = {
      name,
      description,
      shortDescription: shortDescription || '',
      price: price || 0,
      discountPrice: discountPrice || 0,
      discountPercentage,
      category,
      brand: brand || 'Unknown',
      weight: {
        value: weightValue,
        unit: weightUnit
      },
      expiryDate,
      manufactureDate,
      sku,
      images: uploadedImages,
      stock: parseInt(initialStock) || 0,
      lowStockThreshold: 10,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
      allergens: mappedAllergens,
      certifications: mappedCertifications,
      createdBy: req.user._id
    };

    console.log('=== Final Product Data ===');
    console.log('Price:', productData.price, typeof productData.price);
    console.log('Weight:', JSON.stringify(productData.weight));
    console.log('Allergens:', JSON.stringify(productData.allergens), 'isArray:', Array.isArray(productData.allergens));
    console.log('Certifications:', JSON.stringify(productData.certifications), 'isArray:', Array.isArray(productData.certifications));
    console.log('Images:', JSON.stringify(productData.images), 'isArray:', Array.isArray(productData.images));
    console.log('SKU:', productData.sku);
    console.log('ManufactureDate:', productData.manufactureDate);
    console.log('ExpiryDate:', productData.expiryDate);

    const product = await Product.create([productData], { session });
    const createdProduct = product[0];

    await session.commitTransaction();
    committed = true;
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
    if (!committed) {
      await session.abortTransaction().catch(() => {});
    }
    session.endSession();

    console.error('Product creation error:', error);
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
        // Check if categories are ObjectIds or names/slugs
        const categoryIds = [];
        
        for (const cat of categories) {
          // Check if it's a valid ObjectId
          if (mongoose.Types.ObjectId.isValid(cat) && cat.length === 24) {
            categoryIds.push(new mongoose.Types.ObjectId(cat));
          } else {
            // It's a category name or slug, look up the ObjectId
            const categoryDoc = await Category.findOne({
              $or: [
                { name: { $regex: new RegExp(`^${cat}$`, 'i') } },
                { slug: cat.toLowerCase() }
              ]
            });
            if (categoryDoc) {
              categoryIds.push(categoryDoc._id);
            }
          }
        }
        
        if (categoryIds.length > 0) {
          matchQuery.category = { $in: categoryIds };
        }
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

    // Helper function to deeply parse JSON strings
    const deepParse = (value) => {
      if (typeof value !== 'string') return value;
      
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'string') {
          return deepParse(parsed);
        }
        if (Array.isArray(parsed)) {
          return parsed.map(item => deepParse(item));
        }
        return parsed;
      } catch (e) {
        return value;
      }
    };

    // Parse JSON strings from FormData
    const parsedBody = {};
    for (const key in req.body) {
      parsedBody[key] = deepParse(req.body[key]);
    }

    const {
      name,
      description,
      shortDescription,
      category,
      brand,
      weight: weightRaw,
      price,
      discountPrice,
      discountPercentage,
      currency,
      allergens,
      certifications,
      isActive,
      isFeatured,
      stock
    } = parsedBody;

    const weight = typeof weightRaw === 'string' ? deepParse(weightRaw) : (weightRaw || {});

    // Handle new image uploads
    let updatedImages = product.images;
    if (req.files && req.files.length > 0) {
      // Upload new images
      const uploadedImages = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'products');
        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
          alt: name || product.name
        });
      }
      updatedImages = uploadedImages;
    }

    // Prepare update data
    const updateData = {
      name: name || product.name,
      description: description || product.description,
      shortDescription: shortDescription !== undefined ? shortDescription : product.shortDescription,
      price: parseFloat(price) || product.price,
      discountPrice: parseFloat(discountPrice) || 0,
      discountPercentage: parseFloat(discountPercentage) || 0,
      currency: currency || product.currency,
      category: category || product.category,
      brand: brand || product.brand,
      weight: {
        value: parseFloat(weight?.value) || product.weight?.value,
        unit: weight?.unit || product.weight?.unit
      },
      images: updatedImages,
      stock: parseInt(stock) !== undefined ? parseInt(stock) : product.stock,
      isActive: isActive !== undefined ? isActive : product.isActive,
      isFeatured: isFeatured !== undefined ? isFeatured : product.isFeatured,
      allergens: allergens || product.allergens,
      certifications: certifications || product.certifications,
      updatedBy: req.user._id
    };

    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('category', 'name slug')
     .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Product update error:', error);
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
    if (req.query.isActive !== undefined && req.query.isActive !== '') {
      query.isActive = req.query.isActive === 'true';
    }

    // Filter by featured status
    if (req.query.isFeatured !== undefined && req.query.isFeatured !== '') {
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
