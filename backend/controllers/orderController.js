const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Inventory = require('../models/Inventory');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../utils/emailService');

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

      // Check product stock
      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${cartItem.quantity}`
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

    // Calculate order totals based on location
    const subtotal = cart.subtotal;
    const tax = cart.tax || 0;
    const city = shippingAddress.city?.toLowerCase() || '';
    const division = shippingAddress.division || '';
    
    // Calculate delivery fee
    let shippingCost;
    if (city.includes('uttara')) {
      shippingCost = 0; // Free delivery for Uttara
    } else if (division === 'Dhaka') {
      shippingCost = 60; // Inside Dhaka
    } else {
      shippingCost = 120; // Outside Dhaka
    }
    
    const discount = cart.discount || 0;
    const totalAmount = subtotal + tax + shippingCost - discount;

    // Generate order number
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `ORD-${timestamp}-${random}`;

    const order = await Order.create([{
      orderNumber,
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
      orderStatus: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        updatedBy: req.user._id,
        note: 'Order placed'
      }]
    }], { session });

    const createdOrder = order[0];

    // Update product stock
    for (const cartItem of cart.items) {
      await Product.findByIdAndUpdate(
        cartItem.product._id,
        { $inc: { stock: -cartItem.quantity } },
        { session }
      );
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

    // Send order confirmation email (async, don't wait)
    const customerEmail = shippingAddress.email || req.user.email;
    if (customerEmail) {
      sendOrderConfirmation(populatedOrder, customerEmail).catch(err => {
        console.error('Failed to send confirmation email:', err);
      });
    }

    // Send website inbox copy (configured Nodemailer mailbox)
    const websiteInboxEmail = process.env.STORE_NOTIFICATION_EMAIL || process.env.EMAIL_USER;
    if (websiteInboxEmail && websiteInboxEmail !== customerEmail) {
      sendOrderConfirmation(populatedOrder, websiteInboxEmail).catch(err => {
        console.error('Failed to send website inbox order email:', err);
      });
    }

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
      .populate('items.product', 'name images ratings');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order.
    // Guard null user for legacy/deleted-account orders.
    if (req.user.role !== 'admin') {
      const orderUserId = order.user?._id?.toString();
      if (!orderUserId || orderUserId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this order'
        });
      }
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

    // Group filter for easier admin handling
    // completed => delivered + paid
    // active => everything else
    if (req.query.group === 'completed') {
      query.orderStatus = 'delivered';
      query.paymentStatus = 'paid';
    } else if (req.query.group === 'active') {
      query.$or = [
        { orderStatus: { $ne: 'delivered' } },
        { paymentStatus: { $ne: 'paid' } }
      ];
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
    const { orderStatus, paymentStatus, note } = req.body;

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.orderStatus;

    if (orderStatus) {
      order.orderStatus = orderStatus;
      
      // Add to status history
      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      
      order.statusHistory.push({
        status: orderStatus,
        timestamp: new Date(),
        updatedBy: req.user._id,
        note: note || `Status changed from ${oldStatus} to ${orderStatus}`
      });
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    // Send status update email if status changed
    if (orderStatus && orderStatus !== oldStatus) {
      const customerEmail = order.shippingAddress.email || order.user?.email;
      if (customerEmail) {
        sendOrderStatusUpdate(order, customerEmail).catch(err => {
          console.error('Failed to send status update email:', err);
        });
      }
    }

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
