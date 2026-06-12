const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getMonthlySales,
  getUsers,
  getProducts,
  getOrders
} = require('../controller/adminController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Admin only routes
router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', getDashboardStats);
router.get('/sales', getMonthlySales);
router.get('/users', getUsers);
router.get('/products', getProducts);
router.get('/orders', getOrders);

module.exports = router;