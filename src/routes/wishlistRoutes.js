const express = require('express');
const router = express.Router();

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist
} = require('../controller/wishlistController');

const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/add', addToWishlist);
router.get('/', getWishlist);
router.delete('/remove', removeFromWishlist);

module.exports = router;