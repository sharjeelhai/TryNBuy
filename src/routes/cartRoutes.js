const express = require('express');
const router = express.Router();

const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controller/cartController');

const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/add', addToCart);
router.get('/', getCart);
router.put('/update', updateCartItem);
router.delete('/remove', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;