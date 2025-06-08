const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  images: [String],
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  tags: [String],
  
  // Sustainability metrics
  sustainability: {
    ecoScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    ecoLabel: {
      type: String,
      default: 'Not Rated'
    },
    carbonFootprint: {
      type: Number,  // in kg CO2e
      default: null
    },
    materialScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    packagingScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    productionScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    }
  },
  
  // Detailed sustainability information
  materials: [String],
  packaging: {
    type: String,
    default: 'Standard'
  },
  production: {
    type: String,
    default: 'Standard'
  },
  certifications: [String],
  
  // Packaging options (for checkout)
  packagingOptions: [{
    name: String,
    description: String,
    ecoImpact: {
      type: String,
      enum: ['Low', 'Medium', 'High']
    },
    carbonSaving: Number,  // kg CO2e saved compared to standard
    additionalPrice: {
      type: Number,
      default: 0
    }
  }],
  
  // Group buying settings
  groupBuying: {
    enabled: {
      type: Boolean,
      default: false
    },
    threshold: {
      type: Number,
      default: 10
    },
    carbonSavingPercent: {
      type: Number,
      default: 15
    },
    discountPercent: {
      type: Number,
      default: 10
    },
    expiryDays: {
      type: Number,
      default: 7
    },
    currentParticipants: {
      type: Number,
      default: 0
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for eco-score based queries
ProductSchema.index({ 'sustainability.ecoScore': -1 });

// Pre-save hook to update eco scores
ProductSchema.pre('save', async function(next) {
  // If this is where we'd typically calculate the sustainability score
  // But since we reference a utility that needs to be required, we'll handle
  // this in the controller instead
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;