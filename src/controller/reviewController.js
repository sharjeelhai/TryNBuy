const Review = require('../models/Review');
const Product = require('../models/Product');


// ==============================
// ADD / UPDATE REVIEW
// ==============================
exports.addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    let review = await Review.findOne({
      user: req.user._id,
      product: productId
    });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment;
      await review.save();
    } else {
      review = await Review.create({
        user: req.user._id,
        product: productId,
        rating,
        comment
      });
    }

    // Recalculate product rating
    const reviews = await Review.find({ product: productId });

    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      averageRating: avg,
      numReviews: reviews.length
    });

    res.json({
      message: "Review submitted",
      review
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// GET PRODUCT REVIEWS
// ==============================
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId
    }).populate('user', 'name');

    res.json(reviews);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// DELETE REVIEW
// ==============================
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};