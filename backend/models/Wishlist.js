const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    notes: {
      type: String,
      maxlength: 200
    },
    priceWhenAdded: {
      type: Number,
      required: true
    },
    currentPrice: Number,
    notifyOnDiscount: {
      type: Boolean,
      default: true
    },
    targetPrice: {
      type: Number,
      min: 0
    },
    inStock: {
      type: Boolean,
      default: true
    },
    lastChecked: {
      type: Date,
      default: Date.now
    }
  }],
  categories: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    items: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowSharing: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      priceDrops: { type: Boolean, default: true },
      backInStock: { type: Boolean, default: true },
      discounts: { type: Boolean, default: true }
    },
    autoRemoveAfterPurchase: {
      type: Boolean,
      default: true
    },
    maxItems: {
      type: Number,
      default: 100,
      max: 200
    }
  },
  stats: {
    totalItemsAdded: { type: Number, default: 0 },
    totalItemsPurchased: { type: Number, default: 0 },
    totalItemsRemoved: { type: Number, default: 0 },
    averageDaysToPurchase: { type: Number, default: 0 },
    totalSavings: { type: Number, default: 0 }, // From price drops
    lastActivity: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Virtual for total items in wishlist
wishlistSchema.virtual('totalItems').get(function() {
  return this.items.length;
});

// Virtual for high priority items
wishlistSchema.virtual('highPriorityItems').get(function() {
  return this.items.filter(item => item.priority === 'high').length;
});

// Virtual for items with price drops
wishlistSchema.virtual('itemsWithPriceDrops').get(function() {
  return this.items.filter(item => 
    item.currentPrice && item.currentPrice < item.priceWhenAdded
  ).length;
});

// Virtual for out of stock items
wishlistSchema.virtual('outOfStockItems').get(function() {
  return this.items.filter(item => !item.inStock).length;
});

// Method to add item to wishlist
wishlistSchema.methods.addItem = function(productId, price, options = {}) {
  // Check if item already exists
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );
  
  if (existingItemIndex >= 0) {
    // Update existing item
    this.items[existingItemIndex].priority = options.priority || this.items[existingItemIndex].priority;
    this.items[existingItemIndex].notes = options.notes || this.items[existingItemIndex].notes;
    this.items[existingItemIndex].targetPrice = options.targetPrice || this.items[existingItemIndex].targetPrice;
    this.items[existingItemIndex].notifyOnDiscount = options.notifyOnDiscount !== undefined ? 
      options.notifyOnDiscount : this.items[existingItemIndex].notifyOnDiscount;
    this.items[existingItemIndex].addedAt = new Date();
    return this.save();
  }
  
  // Check if max items limit reached
  if (this.items.length >= this.settings.maxItems) {
    throw new Error(`Wishlist limit of ${this.settings.maxItems} items reached`);
  }
  
  // Add new item
  const newItem = {
    product: productId,
    priceWhenAdded: price,
    currentPrice: price,
    priority: options.priority || 'medium',
    notes: options.notes || '',
    targetPrice: options.targetPrice,
    notifyOnDiscount: options.notifyOnDiscount !== false
  };
  
  this.items.push(newItem);
  this.stats.totalItemsAdded += 1;
  this.stats.lastActivity = new Date();
  
  return this.save();
};

// Method to remove item from wishlist
wishlistSchema.methods.removeItem = function(productId) {
  const itemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );
  
  if (itemIndex >= 0) {
    this.items.splice(itemIndex, 1);
    this.stats.totalItemsRemoved += 1;
    this.stats.lastActivity = new Date();
    return this.save();
  }
  
  throw new Error('Item not found in wishlist');
};

// Method to update item priority
wishlistSchema.methods.updateItemPriority = function(productId, priority) {
  const item = this.items.find(
    item => item.product.toString() === productId.toString()
  );
  
  if (item) {
    item.priority = priority;
    this.stats.lastActivity = new Date();
    return this.save();
  }
  
  throw new Error('Item not found in wishlist');
};

// Method to move item to cart
wishlistSchema.methods.moveToCart = async function(productId, quantity = 1) {
  const Cart = mongoose.model('Cart');
  const itemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );
  
  if (itemIndex >= 0) {
    const item = this.items[itemIndex];
    
    // Add to cart
    let cart = await Cart.findOne({ user: this.user });
    if (!cart) {
      cart = new Cart({ user: this.user, items: [] });
    }
    
    await cart.addItem(productId, quantity);
    
    // Calculate days to purchase
    const daysToMove = Math.floor((Date.now() - item.addedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Update stats
    this.stats.totalItemsPurchased += 1;
    
    // Update average days to purchase
    const totalPurchases = this.stats.totalItemsPurchased;
    const currentAverage = this.stats.averageDaysToPurchase || 0;
    this.stats.averageDaysToPurchase = ((currentAverage * (totalPurchases - 1)) + daysToMove) / totalPurchases;
    
    // Calculate savings if price dropped
    if (item.currentPrice && item.currentPrice < item.priceWhenAdded) {
      this.stats.totalSavings += (item.priceWhenAdded - item.currentPrice) * quantity;
    }
    
    // Remove from wishlist if auto-remove is enabled
    if (this.settings.autoRemoveAfterPurchase) {
      this.items.splice(itemIndex, 1);
    }
    
    this.stats.lastActivity = new Date();
    return this.save();
  }
  
  throw new Error('Item not found in wishlist');
};

// Method to create wishlist category
wishlistSchema.methods.createCategory = function(name, itemIds = []) {
  // Check if category already exists
  const existingCategory = this.categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  if (existingCategory) {
    throw new Error('Category with this name already exists');
  }
  
  this.categories.push({
    name,
    items: itemIds,
    createdAt: new Date()
  });
  
  this.stats.lastActivity = new Date();
  return this.save();
};

// Method to add item to category
wishlistSchema.methods.addItemToCategory = function(categoryName, productId) {
  const category = this.categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
  if (!category) {
    throw new Error('Category not found');
  }
  
  // Check if item is in wishlist
  const itemExists = this.items.some(item => item.product.toString() === productId.toString());
  if (!itemExists) {
    throw new Error('Item not found in wishlist');
  }
  
  // Add to category if not already there
  if (!category.items.includes(productId)) {
    category.items.push(productId);
    this.stats.lastActivity = new Date();
    return this.save();
  }
  
  return this;
};

// Method to update stock status of items
wishlistSchema.methods.updateStockStatus = async function() {
  const Product = mongoose.model('Product');
  const Inventory = mongoose.model('Inventory');
  
  for (const item of this.items) {
    const inventory = await Inventory.findOne({ product: item.product });
    if (inventory) {
      const wasOutOfStock = !item.inStock;
      item.inStock = inventory.availableStock > 0;
      
      // If item is back in stock and user wants notifications
      if (wasOutOfStock && item.inStock && this.settings.emailNotifications.backInStock) {
        // Trigger back in stock notification
        // This would typically emit an event or add to a notification queue
        console.log(`Item ${item.product} is back in stock for user ${this.user}`);
      }
      
      item.lastChecked = new Date();
    }
  }
  
  return this.save();
};

// Method to update prices and check for drops
wishlistSchema.methods.updatePrices = async function() {
  const Product = mongoose.model('Product');
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product) {
      const oldPrice = item.currentPrice;
      item.currentPrice = product.pricing.sellingPrice;
      
      // Check for price drop
      const priceDrop = oldPrice && item.currentPrice < oldPrice;
      const targetPriceMet = item.targetPrice && item.currentPrice <= item.targetPrice;
      
      if ((priceDrop || targetPriceMet) && 
          item.notifyOnDiscount && 
          this.settings.emailNotifications.priceDrops) {
        // Trigger price drop notification
        console.log(`Price drop alert for item ${item.product} for user ${this.user}`);
      }
      
      item.lastChecked = new Date();
    }
  }
  
  this.stats.lastActivity = new Date();
  return this.save();
};

// Method to get items by priority
wishlistSchema.methods.getItemsByPriority = function(priority) {
  return this.items.filter(item => item.priority === priority);
};

// Method to get items with price drops
wishlistSchema.methods.getItemsWithPriceDrops = function() {
  return this.items.filter(item => 
    item.currentPrice && item.currentPrice < item.priceWhenAdded
  );
};

// Method to get out of stock items
wishlistSchema.methods.getOutOfStockItems = function() {
  return this.items.filter(item => !item.inStock);
};

// Method to share wishlist (generate shareable link)
wishlistSchema.methods.generateShareableLink = function() {
  if (!this.settings.allowSharing) {
    throw new Error('Wishlist sharing is disabled');
  }
  
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/wishlist/shared/${this._id}`;
};

// Static method to get public wishlist
wishlistSchema.statics.getPublicWishlist = function(wishlistId) {
  return this.findById(wishlistId)
    .where('settings.isPublic', true)
    .populate('items.product', 'name price images')
    .select('items user createdAt');
};

// Static method to get trending wishlist items
wishlistSchema.statics.getTrendingItems = function(limit = 10) {
  return this.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        count: { $sum: 1 },
        avgPriority: { $avg: { $switch: {
          branches: [
            { case: { $eq: ['$items.priority', 'low'] }, then: 1 },
            { case: { $eq: ['$items.priority', 'medium'] }, then: 2 },
            { case: { $eq: ['$items.priority', 'high'] }, then: 3 }
          ]
        }}},
        totalUsers: { $addToSet: '$user' }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        product: 1,
        count: 1,
        avgPriority: 1,
        uniqueUsers: { $size: '$totalUsers' },
        score: { $multiply: ['$count', '$avgPriority'] }
      }
    },
    { $sort: { score: -1 } },
    { $limit: limit }
  ]);
};

// Indexes for better performance
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ 'items.product': 1 });
wishlistSchema.index({ 'items.priority': 1 });
wishlistSchema.index({ 'items.addedAt': -1 });
wishlistSchema.index({ 'settings.isPublic': 1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);