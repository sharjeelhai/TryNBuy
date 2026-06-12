const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    // Remove "Bearer "
    const actualToken = token.split(" ")[1];

    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

    if (decoded.demo) {
      req.user = {
        _id: decoded.id,
        name: 'Admin',
        email: decoded.email,
        role: decoded.role || 'admin'
      };

      return next();
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;

    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

