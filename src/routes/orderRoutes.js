const express = require('express');
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getSingleOrder,
  updateOrderStatus,
  getOrderTracking
} = require('../controller/orderController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
router.get('/:id/tracking', authMiddleware, getOrderTracking);

router.use(authMiddleware);

router.post('/create', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getSingleOrder);

// Admin 

router.put(
  '/:id/status',
  authMiddleware,
  adminMiddleware,
  updateOrderStatus
);
module.exports = router;