const express = require('express');
const router = express.Router();

const {
  addReview,
  getProductReviews,
  deleteReview
} = require('../controller/reviewController');

const authMiddleware = require('../middleware/adminMiddleware');

router.post('/', authMiddleware, addReview);
router.get('/:productId', getProductReviews);
router.delete('/:id', authMiddleware, deleteReview);

module.exports = router;