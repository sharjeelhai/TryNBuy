const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,

  price: {
    type: Number,
    required: true
  },

  category: {
    type: String,
    required: true
  },

  sizes: [String], // S, M, L
  colors: [String],

  image: {
    type: String, // main image
    required: true
  },

  tryOnImage: {
    type: String // transparent PNG for AI try-on
  },

  stock: {
    type: Number,
    default: 0
  },
  averageRating: {
  type: Number,
  default: 0
},
numReviews: {
  type: Number,
  default: 0
}

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);