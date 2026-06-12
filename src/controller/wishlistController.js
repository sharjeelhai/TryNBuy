const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');


// ==============================
// ADD TO WISHLIST
// ==============================
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: []
      });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
    }

    await wishlist.save();

    res.json({ message: "Added to wishlist", wishlist });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// GET WISHLIST
// ==============================
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('products');

    if (!wishlist) {
      return res.json({ products: [] });
    }

    res.json(wishlist);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// REMOVE FROM WISHLIST
// ==============================
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    wishlist.products = wishlist.products.filter(
      p => p.toString() !== productId
    );

    await wishlist.save();

    res.json({ message: "Removed from wishlist", wishlist });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};