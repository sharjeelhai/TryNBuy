const Order = require('../models/Order');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');

const VALID_STATUS = ["Placed", "Packed", "Shipped", "Delivered"];


// ==============================
// CREATE ORDER (Checkout)
// ==============================
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, items, totalAmount: reqTotalAmount } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address required" });
    }

    let orderItems = [];
    let totalAmount = 0;

    if (items && items.length > 0) {
      // Use items from request body directly
      orderItems = items.map(item => {
        const orderItem = {
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity
        };
        // Only include product if it's a valid ObjectId, otherwise it will crash Order.create
        if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
          orderItem.product = item.product;
        }
        return orderItem;
      });
      totalAmount = reqTotalAmount || orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    } else {
      const cart = await Cart.findOne({ user: req.user._id })
        .populate('items.product');

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Prepare order items
      orderItems = cart.items.map(item => ({
        product: item.product._id,
        name: item.product.name,
        image: item.product.image,
        price: item.price,
        quantity: item.quantity
      }));

      // Calculate total
      totalAmount = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentStatus: 'Paid',
      status: "Placed",
      trackingHistory: [{ status: "Placed" }]
    });

    // Clear cart
    await Cart.findOneAndDelete({ user: req.user._id });

    res.status(201).json({
      message: "Order placed successfully",
      order
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// GET USER ORDERS
// ==============================
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// GET SINGLE ORDER (SECURE)
// ==============================
exports.getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Security: user can only see own order
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// UPDATE ORDER STATUS (Admin)
// ==============================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value"
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update status
    order.status = status;

    // Add to tracking history
    order.trackingHistory.push({
      status,
      date: new Date()
    });

    await order.save();

    res.json({
      message: "Order status updated",
      order
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// GET ORDER TRACKING
// ==============================
exports.getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Security check
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      orderId: order._id,
      currentStatus: order.status,
      trackingHistory: order.trackingHistory
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};