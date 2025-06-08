const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const SustainabilityScoring = require('../utils/sustainabilityScoring');
const RecommendationEngine = require('../services/recommendationEngine');
const GroupBuyingService = require('../services/groupBuyingService');
const mongoose = require('mongoose');

// Get eco-friendly product recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;
    
    // Initialize recommendation engine if not already initialized
    if (!RecommendationEngine.model) {
      await RecommendationEngine.initialize();
    }
    
    // Get recommendations for user
    const recommendations = await RecommendationEngine.getRecommendationsForUser(userId);
    
    // Filter by category if provided
    const filteredRecommendations = category
      ? recommendations.filter(product => product.category === category)
      : recommendations;
    
    return res.json({
      success: true,
      count: filteredRecommendations.length,
      data: filteredRecommendations
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching recommendations'
    });
  }
};

// Get user carbon dashboard data
exports.getCarbonDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with carbon impact data
    const user = await User.findById(userId).select(
      'carbonImpact purchaseHistory groupBuyingParticipation'
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Calculate category savings
    const categorySavings = await Order.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$productDetails.category',
          value: { $sum: '$products.carbonSaving' }
        }
      },
      { $project: { name: '$_id', value: 1, _id: 0 } }
    ]);
    
    // Send dashboard data
    return res.json({
      ...user.toObject(),
      categorySavings
    });
  } catch (error) {
    console.error('Error fetching carbon dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching carbon dashboard'
    });
  }
};

// Calculate product sustainability score
exports.calculateProductScore = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Calculate sustainability scores
    const ecoScore = SustainabilityScoring.calculateEcoScore(product);
    const ecoLabel = SustainabilityScoring.getEcoLabel(ecoScore);
    const materialScore = SustainabilityScoring.scoreMaterials(product.materials);
    const packagingScore = SustainabilityScoring.scorePackaging(product.packaging);
    const productionScore = SustainabilityScoring.scoreProduction(product.production);
    const carbonSavings = SustainabilityScoring.calculateCarbonSavings(product);
    
    // Update product with scores
    product.sustainability = {
      ecoScore,
      ecoLabel,
      materialScore,
      packagingScore,
      productionScore,
      carbonFootprint: product.carbonFootprint,
    };
    
    