const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { validationResult } = require('express-validator');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id, isActive: true })
      .populate('items.product', 'name images pricing sku isActive');

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
        currency: 'BDT'
      });
    }

    // Filter out inactive products
    cart.items = cart.items.filter(item => item.product && item.product.isActive);
    
    // Update cart if items were filtered out
    if (cart.isModified('items')) {
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { productId, quantity } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive'
      });
    }

    // Check inventory availability
    const inventory = await Inventory.findOne({ product: productId });
    if (inventory && inventory.stock.current < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${inventory.stock.current} items available in stock`
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id, isActive: true });
    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        currency: 'BDT'
      });
    }

    // Add item to cart
    await cart.addItem(
      productId,
      quantity,
      product.pricing.sellingPrice,
      product.pricing.discountPrice || 0
    );

    // Populate cart for response
    await cart.populate('items.product', 'name images pricing sku');

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { productId, quantity } = req.body;

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id, isActive: true });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Check inventory if increasing quantity
    if (quantity > 0) {
      const inventory = await Inventory.findOne({ product: productId });
      if (inventory && inventory.stock.current < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${inventory.stock.current} items available in stock`
        });
      }
    }

    // Update item quantity
    await cart.updateItemQuantity(productId, quantity);

    // Populate cart for response
    await cart.populate('items.product', 'name images pricing sku');

    res.status(200).json({
      success: true,
      message: quantity > 0 ? 'Cart updated successfully' : 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id, isActive: true });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Remove item
    await cart.removeItem(productId);

    // Populate cart for response
    await cart.populate('items.product', 'name images pricing sku');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    // Get cart
    const cart = await Cart.findOne({ user: req.user._id, isActive: true });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Clear cart
    await cart.clearCart();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply coupon to cart
// @route   POST /api/cart/coupon
// @access  Private
exports.applyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id, isActive: true });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // For now, implement a simple coupon system
    // In production, you'd have a Coupon model
    const validCoupons = {
      'SAVE10': { discount: 10, type: 'percentage', minAmount: 500 },
      'SAVE50': { discount: 50, type: 'fixed', minAmount: 1000 },
      'WELCOME20': { discount: 20, type: 'percentage', minAmount: 200 }
    };

    const coupon = validCoupons[couponCode.toUpperCase()];
    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    if (cart.subtotal < coupon.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ৳${coupon.minAmount} required for this coupon`
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (cart.subtotal * coupon.discount) / 100;
    } else {
      discount = coupon.discount;
    }

    // Apply discount (store in a custom field)
    cart.discount = discount;
    cart.couponCode = couponCode.toUpperCase();
    cart.total = cart.subtotal + cart.tax + cart.shippingCost - discount;

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        cart,
        discount,
        couponCode: couponCode.toUpperCase()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync cart with localStorage
// @route   POST /api/cart/sync
// @access  Private
exports.syncCart = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart items'
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id, isActive: true });
    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        currency: 'BDT'
      });
    }

    // Clear existing items
    cart.items = [];

    // Add items from localStorage
    for (const item of items) {
      if (item._id && item.quantity > 0) {
        const product = await Product.findById(item._id);
        if (product && product.isActive) {
          // Check inventory
          const inventory = await Inventory.findOne({ product: item._id });
          const availableStock = inventory ? inventory.stock.current : 0;
          const quantityToAdd = Math.min(item.quantity, availableStock);
          
          if (quantityToAdd > 0) {
            cart.items.push({
              product: item._id,
              quantity: quantityToAdd,
              price: product.pricing.sellingPrice,
              discountPrice: product.pricing.discountPrice || 0
            });
          }
        }
      }
    }

    await cart.save();
    await cart.populate('items.product', 'name images pricing sku');

    res.status(200).json({
      success: true,
      message: 'Cart synchronized successfully',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};