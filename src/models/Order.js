const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: String,
  image: String,
  price: Number,
  quantity: Number
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  items: [orderItemSchema],

  totalAmount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['Placed', 'Packed', 'Shipped', 'Delivered'],
    default: 'Placed'
  },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },

  shippingAddress: {
    type: String,
    required: true
  }
,
trackingHistory: [
  {
    status: String,
    date: {
      type: Date,
      default: Date.now
    }
  }
]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);