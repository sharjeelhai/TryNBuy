const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// DB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Admin UI
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));
app.get('/admin', (req, res) => {
	res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/uploads', express.static('uploads'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
module.exports = app;