const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  createProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct
} = require('../controller/productController');

// Public
router.get('/', getProducts);
router.get('/:id', getSingleProduct);

// Admin only
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'tryOnImage', maxCount: 1 }
  ]),
  createProduct
);

router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'tryOnImage', maxCount: 1 }
  ]),
  updateProduct
);

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  deleteProduct
);
module.exports = router;