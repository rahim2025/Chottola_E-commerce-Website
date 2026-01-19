const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: [true, 'Price is required']
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    default: null
  },
  currency: {
    type: String,
    default: 'BDT',
    enum: ['BDT', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 7776000 // 90 days in seconds
  }
}, {
  timestamps: true
});

// Virtual for cart total calculation
cartSchema.virtual('calculatedTotal').get(function() {
  return this.subtotal + this.tax + this.shippingCost;
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  // Calculate subtotal and total items
  this.subtotal = this.items.reduce((total, item) => {
    const itemPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
    return total + (itemPrice * item.quantity);
  }, 0);
  
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  
  // Calculate total with tax, shipping, and discount
  this.total = this.subtotal + this.tax + this.shippingCost - this.discount;
  
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity, price, discountPrice = 0) {
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );
  
  if (existingItemIndex >= 0) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].price = price;
    this.items[existingItemIndex].discountPrice = discountPrice;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      price,
      discountPrice
    });
  }
  
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(
    item => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const itemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = quantity;
    }
  }
  
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.subtotal = 0;
  this.totalItems = 0;
  this.total = 0;
  return this.save();
};

// Index for better performance
cartSchema.index({ user: 1 });
cartSchema.index({ updatedAt: -1 });
cartSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Cart', cartSchema);