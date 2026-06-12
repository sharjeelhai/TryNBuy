const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error);

    if (process.env.ALLOW_DEMO_FALLBACK !== 'false') {
      console.warn('MongoDB is unavailable. Starting in demo mode with hardcoded admin login.');
      process.env.DEMO_MODE = 'true';
      return;
    }

    process.exit(1);
  }
};

module.exports = connectDB;