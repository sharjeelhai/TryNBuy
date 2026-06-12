const express = require('express');
const router = express.Router();
const { register, login , getProfile, changePassword} = require('../controller/authController');
const  authMiddleware = require("../middleware/authMiddleware")
router.post('/register', register);
router.post('/login', login);

// Protected Routes
router.get('/profile', authMiddleware, getProfile);
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;