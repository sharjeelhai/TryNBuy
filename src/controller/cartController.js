const Cart = require('../models/Cart.js');
const Product = require('../models/Product');


// ==============================
// ADD TO CART
// ==============================
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: []
      });
    }

    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({
        product: productId,
        quantity: quantity || 1,
        price: product.price
      });
    }

    await cart.save();

    res.json({ message: "Item added to cart", cart });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// GET CART
// ==============================
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');

    if (!cart) {
      return res.json({ items: [] });
    }

    res.json(cart);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// UPDATE QUANTITY
// ==============================
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      item => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = quantity;

    await cart.save();

    res.json({ message: "Cart updated", cart });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// REMOVE ITEM
// ==============================
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();

    res.json({ message: "Item removed", cart });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// CLEAR CART
// ==============================
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });

    res.json({ message: "Cart cleared" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};