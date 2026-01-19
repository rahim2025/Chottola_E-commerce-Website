const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Inventory = require('../models/Inventory');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
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

    const { shippingAddress, paymentMethod, notes } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id, isActive: true })
      .populate('items.product')
      .session(session);
      
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate stock availability and prepare order items
    const orderItems = [];
    
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${product?.name || 'unknown'} is no longer available`
        });
      }

      // Check inventory
      const inventory = await Inventory.findOne({ product: product._id }).session(session);
      if (!inventory || inventory.stock.current < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${inventory?.stock.current || 0}, Required: ${cartItem.quantity}`
        });
      }

      // Prepare order item
      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        image: product.images[0]?.url || '',
        price: cartItem.discountPrice > 0 ? cartItem.discountPrice : cartItem.price,
        originalPrice: cartItem.price,
        quantity: cartItem.quantity,
        total: (cartItem.discountPrice > 0 ? cartItem.discountPrice : cartItem.price) * cartItem.quantity
      });
    }

    // Calculate order totals
    const subtotal = cart.subtotal;
    const tax = cart.tax || 0;
    const shippingCost = cart.shippingCost || (subtotal > 1000 ? 0 : 60); // Free shipping over ৳1000
    const discount = cart.discount || 0;
    const totalAmount = subtotal + tax + shippingCost - discount;

    const order = await Order.create([{
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      tax,
      shippingCost,
      discount,
      couponCode: cart.couponCode,
      totalAmount,
      notes,
      status: 'pending'
    }], { session });

    const createdOrder = order[0];

    // Update inventory and create movements
    for (const cartItem of cart.items) {
      const inventory = await Inventory.findOne({ product: cartItem.product._id }).session(session);
      
      // Reduce stock
      inventory.stock.current -= cartItem.quantity;
      inventory.stock.reserved += cartItem.quantity;
      
      // Add movement record
      inventory.movements.push({
        type: 'out',
        quantity: cartItem.quantity,
        reason: 'Order placed',
        reference: `ORDER-${createdOrder._id}`,
        date: new Date(),
        user: req.user._id,
        notes: `Order: ${createdOrder._id}`
      });

      // Update batches (FIFO)
      let remainingToReduce = cartItem.quantity;
      for (let batch of inventory.batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))) {
        if (remainingToReduce <= 0) break;
        if (batch.quantity > 0) {
          const reduceFromBatch = Math.min(batch.quantity, remainingToReduce);
          batch.quantity -= reduceFromBatch;
          remainingToReduce -= reduceFromBatch;
        }
      }

      await inventory.save({ session });
    }

    // Clear the cart
    await cart.clearCart();
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate order for response
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user._id })
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Order.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by status
    if (req.query.status) {
      query.orderStatus = req.query.status;
    }

    // Filter by payment status
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order statistics (Admin)
// @route   GET /api/orders/stats/dashboard
// @access  Private/Admin
exports.getOrderStats = async (req, res, next) => {
  try {
    // Total orders
    const totalOrders = await Order.countDocuments();

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Total revenue
    const revenueData = await Order.aggregate([
      {
        $match: { paymentStatus: 'paid' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .limit(5)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        ordersByStatus,
        totalRevenue,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};
