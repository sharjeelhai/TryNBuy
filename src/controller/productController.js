const Product = require('../models/Product');


// Helper to build full URL
const getFullUrl = (req, path) => {
  if (!path) return null;
  return `${req.protocol}://${req.get('host')}/${path}`;
};


// ==============================
// ADD PRODUCT (Admin)
// ==============================
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      sizes,
      colors,
      stock
    } = req.body;

    const files = req.files || {};

    const image = files.image ? files.image[0].path : null;
    const tryOnImage = files.tryOnImage ? files.tryOnImage[0].path : null;

    // Validation
    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Name, price and category are required"
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      sizes: sizes ? JSON.parse(sizes) : [],
      colors: colors ? JSON.parse(colors) : [],
      stock: stock || 0,
      image,
      tryOnImage
    });

    // Convert paths to full URLs
    const productObj = product.toObject();
    productObj.image = getFullUrl(req, product.image);
    productObj.tryOnImage = getFullUrl(req, product.tryOnImage);

    res.status(201).json({
      message: "Product created successfully",
      product: productObj
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// GET ALL PRODUCTS
// ==============================
exports.getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    let filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    const updatedProducts = products.map(p => {
      const obj = p.toObject();
      obj.image = getFullUrl(req, obj.image);
      obj.tryOnImage = getFullUrl(req, obj.tryOnImage);
      return obj;
    });

    res.json(updatedProducts);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// GET SINGLE PRODUCT
// ==============================
exports.getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const obj = product.toObject();
    obj.image = getFullUrl(req, obj.image);
    obj.tryOnImage = getFullUrl(req, obj.tryOnImage);

    res.json(obj);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// UPDATE PRODUCT
// ==============================
exports.updateProduct = async (req, res) => {
  try {
    const files = req.files || {};

    let updateData = { ...req.body };

    // Handle JSON fields
    if (updateData.sizes) {
      updateData.sizes = JSON.parse(updateData.sizes);
    }

    if (updateData.colors) {
      updateData.colors = JSON.parse(updateData.colors);
    }

    // Handle images
    if (files.image) {
      updateData.image = files.image[0].path;
    }

    if (files.tryOnImage) {
      updateData.tryOnImage = files.tryOnImage[0].path;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const obj = product.toObject();
    obj.image = getFullUrl(req, obj.image);
    obj.tryOnImage = getFullUrl(req, obj.tryOnImage);

    res.json({
      message: "Product updated successfully",
      product: obj
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ==============================
// DELETE PRODUCT
// ==============================
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};