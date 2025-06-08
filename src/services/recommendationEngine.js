const tf = require('@tensorflow/tfjs');
const ProductModel = require('../models/Product');
const UserModel = require('../models/User');

class RecommendationEngine {
  constructor() {
    this.model = null;
    this.userFeatures = {};
    this.productFeatures = {};
  }

  async initialize() {
    // Load pre-trained model or create new one
    try {
      this.model = await tf.loadLayersModel('file://./recommendation-model/model.json');
      console.log('Recommendation model loaded successfully');
    } catch (error) {
      console.log('Creating new recommendation model...');
      await this.trainModel();
    }
    
    // Load product and user data for recommendations
    await this.loadProductFeatures();
    await this.loadUserPreferences();
  }

  async loadProductFeatures() {
    const products = await ProductModel.find({});
    products.forEach(product => {
      this.productFeatures[product._id] = {
        ecoScore: product.sustainability.ecoScore,
        carbonFootprint: product.sustainability.carbonFootprint,
        materialScore: product.sustainability.materialScore,
        category: product.category,
        tags: product.tags
      };
    });
  }

  async loadUserPreferences() {
    const users = await UserModel.find({});
    users.forEach(user => {
      const preferences = user.sustainabilityPreferences || {};
      this.userFeatures[user._id] = {
        preferredEcoScore: preferences.minEcoScore || 3,
        preferredCategories: preferences.categories || [],
        previousPurchases: user.purchaseHistory || [],
        carbonSavingGoal: preferences.carbonSavingGoal || 0
      };
    });
  }

  async trainModel() {
    // Create and train TensorFlow.js model using user-product interactions and eco-metrics
    // This is a simplified version - real implementation would be more complex
    const model = tf.sequential();
    model.add(tf.layers.dense({units: 50, activation: 'relu', inputShape: [10]}));
    model.add(tf.layers.dense({units: 30, activation: 'relu'}));
    model.add(tf.layers.dense({units: 20, activation: 'relu'}));
    model.add(tf.layers.dense({units: 1, activation: 'sigmoid'}));
    
    model.compile({
      optimizer: tf.train.adam(),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    // In a real implementation, we would train on actual user-product interaction data
    this.model = model;
    await this.model.save('file://./recommendation-model/model.json');
  }

  async getRecommendationsForUser(userId) {
    const user = this.userFeatures[userId];
    if (!user) return [];
    
    // Get products matching user's preferred eco categories
    const allProducts = await ProductModel.find({
      'sustainability.ecoScore': { $gte: user.preferredEcoScore }
    });
    
    // Calculate recommendation scores based on user preferences and product sustainability
    const recommendations = allProducts.map(product => {
      // Calculate hybrid score based on sustainability metrics and user preferences
      const sustainabilityMatch = this.calculateSustainabilityMatch(product, user);
      const userPreferenceMatch = this.calculateUserPreferenceMatch(product, user);
      
      const score = 0.7 * sustainabilityMatch + 0.3 * userPreferenceMatch;
      
      return {
        product: product,
        score: score
      };
    });
    
    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(rec => rec.product);
  }

  calculateSustainabilityMatch(product, userPreferences) {
    // Calculate how well product sustainability matches user's eco preferences
    let score = 0;
    score += (product.sustainability.ecoScore / 5) * 0.5;
    score += (1 - (product.sustainability.carbonFootprint / 100)) * 0.3;
    score += (product.sustainability.materialScore / 5) * 0.2;
    return score;
  }

  calculateUserPreferenceMatch(product, userPreferences) {
    // Match product with user's preferences
    let score = 0;
    
    // Category match
    if (userPreferences.preferredCategories.includes(product.category)) {
      score += 0.4;
    }
    
    // Previous purchase pattern match
    const previousPurchases = userPreferences.previousPurchases || [];
    const purchasedSimilarCategory = previousPurchases.some(
      purchase => purchase.category === product.category
    );
    if (purchasedSimilarCategory) score += 0.3;
    
    // Tags match with previous interests
    const userTags = this.extractTagsFromPurchaseHistory(previousPurchases);
    const matchingTags = product.tags.filter(tag => userTags.includes(tag));
    score += (matchingTags.length / Math.max(product.tags.length, 1)) * 0.3;
    
    return score;
  }

  extractTagsFromPurchaseHistory(purchaseHistory) {
    const tags = new Set();
    purchaseHistory.forEach(purchase => {
      if (purchase.tags) {
        purchase.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }
}

module.exports = new RecommendationEngine();