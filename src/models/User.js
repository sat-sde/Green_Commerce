const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Sustainability preferences
  sustainabilityPreferences: {
    minEcoScore: {
      type: Number,
      default: 3,
      min: 1,
      max: 5
    },
    categories: [String],
    interests: [String],
    carbonSavingGoal: {
      type: Number,
      default: 0  // kg CO2e per month
    },
    preferSustainablePackaging: {
      type: Boolean,
      default: true
    }
  },
  
  // Carbon footprint tracking
  carbonImpact: {
    totalSaved: {
      type: Number,
      default: 0  // kg CO2e saved
    },
    monthlySavings: [{
      month: Number,  // 1-12
      year: Number,
      amount: Number  // kg CO2e saved
    }],
    badges: [{
      name: String,
      description: String,
      earnedAt: Date
    }],
    treesEquivalent: {
      type: Number,
      default: 0
    },
    impact: {
      type: String,
      default: 'Just started' // Dynamic based on total saved
    }
  },
  
  // Purchase history
  purchaseHistory: [{
    orderId: mongoose.Schema.Types.ObjectId,
    date: Date,
    products: [{
      productId: mongoose.Schema.Types.ObjectId,
      name: String,
      ecoScore: Number,
      carbonSaving: Number
    }],
    totalCarbonSaving: Number
  }],
  
  // Group buying participation
  groupBuyingParticipation: [{
    groupId: mongoose.Schema.Types.ObjectId,
    productId: mongoose.Schema.Types.ObjectId,
    productName: String,
    joinedAt: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'active'
    },
    potentialCarbonSaving: Number
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password hash middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Update carbon impact metrics
UserSchema.methods.updateCarbonMetrics = function() {
  // Calculate trees equivalent (1 tree absorbs ~20kg CO2 per year)
  this.carbonImpact.treesEquivalent = +(this.carbonImpact.totalSaved / 20).toFixed(2);
  
  // Set impact label
  if (this.carbonImpact.totalSaved >= 1000) {
    this.carbonImpact.impact = 'Climate Champion';
  } else if (this.carbonImpact.totalSaved >= 500) {
    this.carbonImpact.impact = 'Eco Warrior';
  } else if (this.carbonImpact.totalSaved >= 250) {
    this.carbonImpact.impact = 'Green Advocate';
  } else if (this.carbonImpact.totalSaved >= 100) {
    this.carbonImpact.impact = 'Sustainability Starter';
  } else {
    this.carbonImpact.impact = 'Just Started';
  }
  
  // Check for badge eligibility
  this.checkAndAwardBadges();
};

// Award badges based on achievements
UserSchema.methods.checkAndAwardBadges = function() {
  const badges = [];
  const totalSaved = this.carbonImpact.totalSaved;
  
  // Carbon saving badges
  if (totalSaved >= 10 && !this.hasBadge('First Steps')) {
    badges.push({
      name: 'First Steps',
      description: 'Saved your first 10kg of CO2e',
      earnedAt: new Date()
    });
  }
  
  if (totalSaved >= 100 && !this.hasBadge('Carbon Cutter')) {
    badges.push({
      name: 'Carbon Cutter',
      description: 'Saved 100kg of CO2e through eco-purchases',
      earnedAt: new Date()
    });
  }
  
  if (totalSaved >= 500 && !this.hasBadge('Climate Guardian')) {
    badges.push({
      name: 'Climate Guardian',
      description: 'Saved 500kg of CO2e - you\'re making a difference!',
      earnedAt: new Date()
    });
  }
  
  // Add more badge types and checks here
  
  // Add new badges
  if (badges.length > 0) {
    this.carbonImpact.badges.push(...badges);
  }
};

// Check if user has a specific badge
UserSchema.methods.hasBadge = function(badgeName) {
  return this.carbonImpact.badges.some(badge => badge.name === badgeName);
};

const User = mongoose.model('User', UserSchema);
module.exports = User;