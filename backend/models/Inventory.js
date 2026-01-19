const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  stock: {
    current: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    },
    available: {
      type: Number,
      default: 0,
      min: 0
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0
    },
    maxStock: {
      type: Number,
      default: 1000,
      min: 0
    }
  },
  batches: [{
    batchNumber: {
      type: String,
      required: true
    },
    manufactureDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    supplierInfo: {
      name: String,
      contact: String,
      batchCertificate: String
    },
    qualityCheck: {
      passed: { type: Boolean, default: false },
      checkedBy: String,
      checkDate: Date,
      notes: String
    },
    status: {
      type: String,
      enum: ['fresh', 'near_expiry', 'expired', 'recalled'],
      default: 'fresh'
    },
    location: {
      warehouse: String,
      section: String,
      shelf: String,
      position: String
    }
  }],
  movements: [{
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment', 'return', 'damaged', 'expired'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    batchNumber: String,
    reason: String,
    reference: {
      type: String, // Order ID, Purchase Order ID, etc.
    },
    date: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['low_stock', 'out_of_stock', 'near_expiry', 'expired', 'recalled'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  pricing: {
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discountPrice: {
      type: Number,
      min: 0
    },
    margin: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'BDT'
    },
    priceHistory: [{
      price: Number,
      effectiveDate: Date,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  supplier: {
    primary: {
      name: { type: String, required: true },
      contact: String,
      email: String,
      address: String,
      leadTime: { type: Number, default: 7 }, // days
      minimumOrder: { type: Number, default: 1 }
    },
    alternatives: [{
      name: String,
      contact: String,
      email: String,
      leadTime: Number,
      lastOrderDate: Date,
      reliability: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
      }
    }]
  },
  storage: {
    temperature: {
      type: String,
      enum: ['ambient', 'cool', 'chilled', 'frozen'],
      default: 'ambient'
    },
    humidity: {
      min: Number,
      max: Number
    },
    specialRequirements: [String],
    location: {
      warehouse: String,
      zone: String,
      aisle: String,
      shelf: String
    }
  },
  stats: {
    totalSold: { type: Number, default: 0 },
    totalReceived: { type: Number, default: 0 },
    averageSalesPerMonth: { type: Number, default: 0 },
    lastSaleDate: Date,
    lastRestockDate: Date,
    turnoverRate: { type: Number, default: 0 },
    daysInStock: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Virtual for available stock (current - reserved)
inventorySchema.virtual('availableStock').get(function() {
  return this.stock.current - this.stock.reserved;
});

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  const available = this.availableStock;
  if (available <= 0) return 'out_of_stock';
  if (available <= this.stock.reorderLevel) return 'low_stock';
  if (available >= this.stock.maxStock * 0.9) return 'overstock';
  return 'in_stock';
});

// Virtual for profit margin
inventorySchema.virtual('profitMargin').get(function() {
  const cost = this.pricing.costPrice;
  const price = this.pricing.sellingPrice;
  return cost > 0 ? ((price - cost) / cost) * 100 : 0;
});

// Pre-save middleware to calculate available stock
inventorySchema.pre('save', function(next) {
  this.stock.available = this.stock.current - this.stock.reserved;
  
  // Calculate profit margin
  if (this.pricing.costPrice && this.pricing.sellingPrice) {
    this.pricing.margin = this.pricing.sellingPrice - this.pricing.costPrice;
  }
  
  next();
});

// Method to add stock (receiving inventory)
inventorySchema.methods.addStock = function(quantity, batchInfo, user) {
  // Add to batches
  if (batchInfo) {
    this.batches.push({
      ...batchInfo,
      quantity
    });
  }
  
  // Update current stock
  this.stock.current += quantity;
  
  // Record movement
  this.movements.push({
    type: 'in',
    quantity,
    batchNumber: batchInfo?.batchNumber,
    reason: 'Stock received',
    user,
    date: new Date()
  });
  
  // Update stats
  this.stats.totalReceived += quantity;
  this.stats.lastRestockDate = new Date();
  
  return this.save();
};

// Method to reduce stock (selling/using inventory)
inventorySchema.methods.reduceStock = function(quantity, reason = 'Sale', reference, user) {
  if (this.availableStock < quantity) {
    throw new Error('Insufficient stock available');
  }
  
  // Use FIFO method - reduce from oldest batches first
  let remainingToReduce = quantity;
  for (let batch of this.batches.sort((a, b) => a.expiryDate - b.expiryDate)) {
    if (remainingToReduce <= 0) break;
    
    if (batch.quantity > 0) {
      const reduceFromBatch = Math.min(batch.quantity, remainingToReduce);
      batch.quantity -= reduceFromBatch;
      remainingToReduce -= reduceFromBatch;
    }
  }
  
  // Update current stock
  this.stock.current -= quantity;
  
  // Record movement
  this.movements.push({
    type: 'out',
    quantity,
    reason,
    reference,
    user,
    date: new Date()
  });
  
  // Update stats
  this.stats.totalSold += quantity;
  this.stats.lastSaleDate = new Date();
  
  return this.save();
};

// Method to reserve stock
inventorySchema.methods.reserveStock = function(quantity, reference, user) {
  if (this.availableStock < quantity) {
    throw new Error('Insufficient stock available for reservation');
  }
  
  this.stock.reserved += quantity;
  
  // Record movement
  this.movements.push({
    type: 'adjustment',
    quantity: -quantity,
    reason: 'Stock reserved',
    reference,
    user,
    date: new Date()
  });
  
  return this.save();
};

// Method to release reserved stock
inventorySchema.methods.releaseReservedStock = function(quantity, reference, user) {
  this.stock.reserved = Math.max(0, this.stock.reserved - quantity);
  
  // Record movement
  this.movements.push({
    type: 'adjustment',
    quantity,
    reason: 'Reserved stock released',
    reference,
    user,
    date: new Date()
  });
  
  return this.save();
};

// Method to check for expired batches
inventorySchema.methods.checkExpiredBatches = function() {
  const now = new Date();
  const expiredBatches = this.batches.filter(batch => 
    batch.expiryDate <= now && batch.quantity > 0
  );
  
  if (expiredBatches.length > 0) {
    // Create alert for expired batches
    this.alerts.push({
      type: 'expired',
      message: `${expiredBatches.length} batch(es) have expired`,
      severity: 'high',
      isActive: true
    });
    
    // Mark batches as expired
    expiredBatches.forEach(batch => {
      batch.status = 'expired';
    });
  }
  
  return expiredBatches;
};

// Method to check for near-expiry batches
inventorySchema.methods.checkNearExpiryBatches = function(daysThreshold = 30) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);
  
  const nearExpiryBatches = this.batches.filter(batch => 
    batch.expiryDate <= threshold && batch.expiryDate > new Date() && batch.quantity > 0
  );
  
  if (nearExpiryBatches.length > 0) {
    this.alerts.push({
      type: 'near_expiry',
      message: `${nearExpiryBatches.length} batch(es) expiring within ${daysThreshold} days`,
      severity: 'medium',
      isActive: true
    });
    
    nearExpiryBatches.forEach(batch => {
      batch.status = 'near_expiry';
    });
  }
  
  return nearExpiryBatches;
};

// Method to generate reorder recommendation
inventorySchema.methods.getReorderRecommendation = function() {
  const currentStock = this.availableStock;
  const reorderLevel = this.stock.reorderLevel;
  const averageSales = this.stats.averageSalesPerMonth || 0;
  const leadTime = this.supplier.primary.leadTime || 7;
  
  if (currentStock <= reorderLevel) {
    const recommendedQuantity = Math.max(
      this.supplier.primary.minimumOrder || 1,
      Math.ceil(averageSales * (leadTime / 30) * 2) // 2x safety factor
    );
    
    return {
      shouldReorder: true,
      recommendedQuantity,
      urgency: currentStock === 0 ? 'critical' : currentStock <= reorderLevel * 0.5 ? 'high' : 'medium',
      reason: currentStock === 0 ? 'Out of stock' : 'Below reorder level'
    };
  }
  
  return { shouldReorder: false };
};

// Static method to get low stock items
inventorySchema.statics.getLowStockItems = function() {
  return this.aggregate([
    {
      $addFields: {
        availableStock: { $subtract: ['$stock.current', '$stock.reserved'] }
      }
    },
    {
      $match: {
        $expr: { $lte: ['$availableStock', '$stock.reorderLevel'] }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $sort: { availableStock: 1 }
    }
  ]);
};

// Static method to get expiring items
inventorySchema.statics.getExpiringItems = function(daysThreshold = 30) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);
  
  return this.aggregate([
    { $unwind: '$batches' },
    {
      $match: {
        'batches.expiryDate': { $lte: threshold, $gt: new Date() },
        'batches.quantity': { $gt: 0 }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $sort: { 'batches.expiryDate': 1 }
    }
  ]);
};

// Indexes for better performance
inventorySchema.index({ product: 1 });
inventorySchema.index({ sku: 1 });
inventorySchema.index({ barcode: 1 });
inventorySchema.index({ 'stock.current': 1 });
inventorySchema.index({ 'batches.expiryDate': 1 });
inventorySchema.index({ 'alerts.isActive': 1 });

module.exports = mongoose.model('Inventory', inventorySchema);