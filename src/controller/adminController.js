const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

const isDemoMode = () => process.env.DEMO_MODE === 'true';

const demoUsers = [
  { _id: 'demo-user-1', name: 'Demo Buyer', email: 'buyer@example.com', role: 'user', createdAt: new Date().toISOString() },
  { _id: 'demo-user-2', name: 'Admin User', email: process.env.DEMO_ADMIN_EMAIL || 'admin@trynbuy.com', role: 'admin', createdAt: new Date().toISOString() }
];

const demoProducts = [
  { _id: 'demo-product-1', name: 'Demo T-Shirt', category: 'Clothing', price: 29.99, stock: 12, createdAt: new Date().toISOString() },
  { _id: 'demo-product-2', name: 'Demo Jacket', category: 'Outerwear', price: 89.99, stock: 5, createdAt: new Date().toISOString() }
];

const demoOrders = [
  {
    _id: 'demo-order-1',
    user: { _id: 'demo-user-1', name: 'Demo Buyer', email: 'buyer@example.com', role: 'user' },
    totalAmount: 59.98,
    status: 'Placed',
    paymentStatus: 'Paid',
    shippingAddress: 'Demo Address, City',
    createdAt: new Date().toISOString()
  }
];

function dedupeUsersByEmail(users) {
  const seen = new Map();

  for (const user of users) {
    const emailKey = (user.email || '').trim().toLowerCase();
    if (!emailKey) {
      continue;
    }

    if (!seen.has(emailKey)) {
      seen.set(emailKey, user);
    }
  }

  return [...seen.values()];
}

async function getUniqueUserCount() {
  const count = await User.aggregate([
    {
      $group: {
        _id: { $toLower: '$email' }
      }
    },
    {
      $count: 'total'
    }
  ]);

  return count[0]?.total || 0;
}


// ==============================
// DASHBOARD STATS
// ==============================
exports.getDashboardStats = async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({
        totalUsers: demoUsers.length,
        totalOrders: demoOrders.length,
        totalRevenue: demoOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        recentOrders: demoOrders
      });
    }

    const totalUsers = await getUniqueUserCount();
    const totalOrders = await Order.countDocuments();

    const revenueData = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    const recentOrders = await Order.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      recentOrders
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getMonthlySales = async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json([{ _id: 4, total: 59.98 }]);
    }

    const sales = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json(sales);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getUsers = async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json(demoUsers);
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(dedupeUsersByEmail(users));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getProducts = async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json(demoProducts);
    }

    const products = await Product.find()
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getOrders = async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json(demoOrders);
    }

    const orders = await Order.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};