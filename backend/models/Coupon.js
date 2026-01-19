const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscount: {
    type: Number,
    min: 0 // Maximum discount amount for percentage coupons
  },
  minimumPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludeProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludeCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  targetCustomers: {
    type: {
      type: String,
      enum: ['all', 'new_customers', 'returning_customers', 'loyalty_tier', 'specific_users'],
      default: 'all'
    },
    loyaltyTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum']
    },
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    newCustomerDays: {
      type: Number,
      default: 30 // Consider as new customer within 30 days
    }
  },
  usage: {
    totalLimit: {
      type: Number,
      min: 1,
      default: null // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    perUserLimit: {
      type: Number,
      min: 1,
      default: 1
    },
    perUserUsed: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      count: {
        type: Number,
        default: 1,
        min: 1
      },
      lastUsed: {
        type: Date,
        default: Date.now
      }
    }]
  },
  validity: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    timezone: {
      type: String,
      default: 'Asia/Dhaka'
    }
  },
  conditions: {
    firstOrderOnly: {
      type: Boolean,
      default: false
    },
    minItemQuantity: {
      type: Number,
      min: 1
    },
    maxItemQuantity: {
      type: Number,
      min: 1
    },
    dayOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    timeRange: {
      start: String, // e.g., "09:00"
      end: String    // e.g., "18:00"
    },
    paymentMethods: [{
      type: String,
      enum: ['cash_on_delivery', 'bkash', 'nagad', 'rocket', 'card', 'bank_transfer']
    }]
  },
  buyXGetY: {
    buyQuantity: {
      type: Number,
      min: 1
    },
    getQuantity: {
      type: Number,
      min: 1
    },
    getProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    autoApply: {
      type: Boolean,
      default: true
    }
  },
  stackable: {
    type: Boolean,
    default: false // Can be used with other coupons
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10 // Higher number means higher priority
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoApply: {
    type: Boolean,
    default: false // Automatically apply if conditions are met
  },
  stats: {
    totalUsage: {
      type: Number,
      default: 0
    },
    totalDiscountGiven: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual to check if coupon is currently valid
couponSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.validity.startDate && 
         now <= this.validity.endDate &&
         (this.usage.totalLimit === null || this.usage.usedCount < this.usage.totalLimit);
});

// Virtual to check if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return new Date() > this.validity.endDate;
});

// Virtual to get remaining uses
couponSchema.virtual('remainingUses').get(function() {
  if (this.usage.totalLimit === null) return 'Unlimited';
  return Math.max(0, this.usage.totalLimit - this.usage.usedCount);
});

// Method to check if user can use this coupon
couponSchema.methods.canUserUseCoupon = async function(userId) {
  // Check if coupon is currently valid
  if (!this.isCurrentlyValid) {
    return { canUse: false, reason: 'Coupon is not valid or expired' };
  }
  
  // Check per-user usage limit
  const userUsage = this.usage.perUserUsed.find(u => u.user.toString() === userId.toString());
  const userUsageCount = userUsage ? userUsage.count : 0;
  
  if (userUsageCount >= this.usage.perUserLimit) {
    return { canUse: false, reason: 'Usage limit exceeded for this user' };
  }
  
  // Check target customer criteria
  if (this.targetCustomers.type !== 'all') {
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user) {
      return { canUse: false, reason: 'User not found' };
    }
    
    switch (this.targetCustomers.type) {
      case 'new_customers':
        const daysSinceRegistration = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceRegistration > this.targetCustomers.newCustomerDays) {
          return { canUse: false, reason: 'Coupon is only for new customers' };
        }
        break;
        
      case 'returning_customers':
        if (!user.stats || user.stats.totalOrders < 2) {
          return { canUse: false, reason: 'Coupon is only for returning customers' };
        }
        break;
        
      case 'loyalty_tier':
        if (user.loyalty.tier !== this.targetCustomers.loyaltyTier) {
          return { canUse: false, reason: 'Coupon is not available for your loyalty tier' };
        }
        break;
        
      case 'specific_users':
        if (!this.targetCustomers.specificUsers.includes(userId)) {
          return { canUse: false, reason: 'Coupon is not available for your account' };
        }
        break;
    }
  }
  
  // Check first order condition
  if (this.conditions.firstOrderOnly) {
    const Order = mongoose.model('Order');
    const orderCount = await Order.countDocuments({ user: userId, status: { $ne: 'cancelled' } });
    if (orderCount > 0) {
      return { canUse: false, reason: 'Coupon is only valid for first orders' };
    }
  }
  
  return { canUse: true };
};

// Method to validate coupon against cart/order
couponSchema.methods.validateAgainstCart = function(cart) {
  const errors = [];
  
  // Check minimum purchase amount
  if (cart.total < this.minimumPurchase) {
    errors.push(`Minimum purchase amount of ${this.minimumPurchase} required`);
  }
  
  // Check item quantity conditions
  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  
  if (this.conditions.minItemQuantity && totalQuantity < this.conditions.minItemQuantity) {
    errors.push(`Minimum ${this.conditions.minItemQuantity} items required`);
  }
  
  if (this.conditions.maxItemQuantity && totalQuantity > this.conditions.maxItemQuantity) {
    errors.push(`Maximum ${this.conditions.maxItemQuantity} items allowed`);
  }
  
  // Check applicable products/categories
  if (this.applicableProducts.length > 0 || this.applicableCategories.length > 0) {
    const hasApplicableItems = cart.items.some(item => 
      this.applicableProducts.includes(item.product) ||
      this.applicableCategories.includes(item.product.category)
    );
    
    if (!hasApplicableItems) {
      errors.push('Coupon is not applicable to items in your cart');
    }
  }
  
  // Check excluded products/categories
  const hasExcludedItems = cart.items.some(item =>
    this.excludeProducts.includes(item.product) ||
    this.excludeCategories.includes(item.product.category)
  );
  
  if (hasExcludedItems) {
    errors.push('Some items in your cart are excluded from this coupon');
  }
  
  // Check day of week condition
  if (this.conditions.dayOfWeek && this.conditions.dayOfWeek.length > 0) {
    const currentDay = new Date().toLocaleLowerCase().slice(0, 3); // e.g., 'mon'
    const dayMap = {
      sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday',
      thu: 'thursday', fri: 'friday', sat: 'saturday'
    };
    
    if (!this.conditions.dayOfWeek.includes(dayMap[currentDay])) {
      errors.push('Coupon is not valid on this day');
    }
  }
  
  // Check time range condition
  if (this.conditions.timeRange && this.conditions.timeRange.start && this.conditions.timeRange.end) {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    
    if (currentTime < this.conditions.timeRange.start || currentTime > this.conditions.timeRange.end) {
      errors.push(`Coupon is only valid between ${this.conditions.timeRange.start} and ${this.conditions.timeRange.end}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(cart) {
  let discountAmount = 0;
  
  // Filter applicable items
  let applicableAmount = 0;
  let applicableItems = cart.items;
  
  // If specific products/categories are set, filter items
  if (this.applicableProducts.length > 0 || this.applicableCategories.length > 0) {
    applicableItems = cart.items.filter(item =>
      this.applicableProducts.includes(item.product) ||
      this.applicableCategories.includes(item.product.category)
    );
  }
  
  // Exclude items if specified
  if (this.excludeProducts.length > 0 || this.excludeCategories.length > 0) {
    applicableItems = applicableItems.filter(item =>
      !this.excludeProducts.includes(item.product) &&
      !this.excludeCategories.includes(item.product.category)
    );
  }
  
  applicableAmount = applicableItems.reduce((sum, item) => sum + item.subtotal, 0);
  
  switch (this.type) {
    case 'percentage':
      discountAmount = (applicableAmount * this.value) / 100;
      if (this.maxDiscount && discountAmount > this.maxDiscount) {
        discountAmount = this.maxDiscount;
      }
      break;
      
    case 'fixed_amount':
      discountAmount = Math.min(this.value, applicableAmount);
      break;
      
    case 'free_shipping':
      discountAmount = cart.shippingCost || 0;
      break;
      
    case 'buy_x_get_y':
      // Calculate Buy X Get Y discount
      if (this.buyXGetY.buyQuantity && this.buyXGetY.getQuantity) {
        const eligibleQuantity = Math.floor(
          applicableItems.reduce((sum, item) => sum + item.quantity, 0) / this.buyXGetY.buyQuantity
        );
        
        const freeQuantity = eligibleQuantity * this.buyXGetY.getQuantity;
        
        // Find cheapest items to give free
        const sortedItems = applicableItems.sort((a, b) => a.price - b.price);
        let remainingFreeQty = freeQuantity;
        
        for (const item of sortedItems) {
          if (remainingFreeQty <= 0) break;
          const freeQtyForItem = Math.min(remainingFreeQty, item.quantity);
          discountAmount += freeQtyForItem * item.price;
          remainingFreeQty -= freeQtyForItem;
        }
      }
      break;
  }
  
  return Math.min(discountAmount, applicableAmount);
};

// Method to apply coupon usage
couponSchema.methods.applyCouponUsage = function(userId, orderValue = 0, discountGiven = 0) {
  // Increment total usage
  this.usage.usedCount += 1;
  
  // Update or add user usage
  const userUsageIndex = this.usage.perUserUsed.findIndex(u => u.user.toString() === userId.toString());
  if (userUsageIndex >= 0) {
    this.usage.perUserUsed[userUsageIndex].count += 1;
    this.usage.perUserUsed[userUsageIndex].lastUsed = new Date();
  } else {
    this.usage.perUserUsed.push({
      user: userId,
      count: 1,
      lastUsed: new Date()
    });
  }
  
  // Update statistics
  this.stats.totalUsage += 1;
  this.stats.totalDiscountGiven += discountGiven;
  this.stats.totalRevenue += orderValue;
  
  // Recalculate average order value
  this.stats.averageOrderValue = this.stats.totalRevenue / this.stats.totalUsage;
  
  return this.save();
};

// Static method to get available coupons for user
couponSchema.statics.getAvailableCouponsForUser = async function(userId, cartTotal = 0) {
  const now = new Date();
  
  const coupons = await this.find({
    isActive: true,
    'validity.startDate': { $lte: now },
    'validity.endDate': { $gte: now },
    $or: [
      { 'usage.totalLimit': null },
      { $expr: { $lt: ['$usage.usedCount', '$usage.totalLimit'] } }
    ],
    minimumPurchase: { $lte: cartTotal }
  });
  
  const availableCoupons = [];
  
  for (const coupon of coupons) {
    const userCanUse = await coupon.canUserUseCoupon(userId);
    if (userCanUse.canUse) {
      availableCoupons.push(coupon);
    }
  }
  
  return availableCoupons.sort((a, b) => b.priority - a.priority);
};

// Static method to get auto-apply coupons
couponSchema.statics.getAutoApplyCoupons = function(cart, userId) {
  return this.getAvailableCouponsForUser(userId, cart.total)
    .then(coupons => coupons.filter(coupon => coupon.autoApply))
    .then(coupons => coupons.sort((a, b) => b.priority - a.priority));
};

// Indexes for better performance
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ 'validity.startDate': 1, 'validity.endDate': 1 });
couponSchema.index({ 'targetCustomers.type': 1 });
couponSchema.index({ autoApply: 1 });
couponSchema.index({ priority: -1 });

module.exports = mongoose.model('Coupon', couponSchema);