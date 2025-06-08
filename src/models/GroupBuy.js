const mongoose = require('mongoose');

const GroupBuySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  initiatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  threshold: {
    type: Number,
    required: true,
    min: 2
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  carbonSavingPercent: {
    type: Number,
    default: 15
  },
  expiryDate: {
    type: Date,
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'expired', 'cancelled'],
    default: 'active'
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
GroupBuySchema.index({ productId: 1, status: 1 });
GroupBuySchema.index({ 'participants.userId': 1 });
GroupBuySchema.index({ expiryDate: 1, status: 1 });

const GroupBuy = mongoose.model('GroupBuy', GroupBuySchema);
module.exports = GroupBuy;