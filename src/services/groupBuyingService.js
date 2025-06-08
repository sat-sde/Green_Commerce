const GroupBuy = require('../models/GroupBuy');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendGroupBuyingNotification } = require('./notificationService');

class GroupBuyingService {
  /**
   * Create a new group buying opportunity
   */
  async createGroupBuy(productId, userId) {
    try {
      // Get product details
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      if (!product.groupBuying.enabled) {
        throw new Error('Group buying is not enabled for this product');
      }
      
      // Check if there's already an active group buy for this product
      const existingGroup = await GroupBuy.findOne({
        productId,
        status: 'active',
        expiryDate: { $gt: new Date() }
      });
      
      if (existingGroup) {
        return this.joinGroupBuy(existingGroup._id, userId);
      }
      
      // Create a new group buy
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + product.groupBuying.expiryDays);
      
      const newGroupBuy = new GroupBuy({
        productId,
        productName: product.name,
        initiatorId: userId,
        threshold: product.groupBuying.threshold,
        discountPercent: product.groupBuying.discountPercent,
        carbonSavingPercent: product.groupBuying.carbonSavingPercent,
        expiryDate,
        participants: [{
          userId,
          joinedAt: new Date()
        }]
      });
      
      // Update product's current participants count
      product.groupBuying.currentParticipants = 1;
      await product.save();
      
      // Save the new group buy
      const savedGroupBuy = await newGroupBuy.save();
      
      // Update user's group buying participation
      const user = await User.findById(userId);
      if (user) {
        const productCarbonFootprint = product.sustainability.carbonFootprint || 10;
        const potentialSaving = (productCarbonFootprint * product.groupBuying.carbonSavingPercent) / 100;
        
        user.groupBuyingParticipation.push({
          groupId: savedGroupBuy._id,
          productId,
          productName: product.name,
          joinedAt: new Date(),
          status: 'active',
          potentialCarbonSaving: potentialSaving
        });
        
        await user.save();
      }
      
      return savedGroupBuy;
    } catch (error) {
      console.error('Error creating group buy:', error);
      throw error;
    }
  }
  
  /**
   * Join an existing group buying opportunity
   */
  async joinGroupBuy(groupId, userId) {
    try {
      const groupBuy = await GroupBuy.findById(groupId);
      
      if (!groupBuy) {
        throw new Error('Group buy not found');
      }
      
      if (groupBuy.status !== 'active') {
        throw new Error(`Cannot join a ${groupBuy.status} group buy`);
      }
      
      if (new Date() > groupBuy.expiryDate) {
        groupBuy.status = 'expired';
        await groupBuy.save();
        throw new Error('This group buy has expired');
      }
      
      // Check if user is already a participant
      const isParticipant = groupBuy.participants.some(
        p => p.userId.toString() === userId.toString()
      );
      
      if (isParticipant) {
        return { 
          groupBuy, 
          message: 'You are already participating in this group buy' 
        };
      }
      
      // Add user to participants
      groupBuy.participants.push({
        userId,
        joinedAt: new Date()
      });
      
      // Update product's current participants count
      const product = await Product.findById(groupBuy.productId);
      if (product) {
        product.groupBuying.currentParticipants = groupBuy.participants.length;
        await product.save();
      }
      
      // Check if threshold is reached
      if (groupBuy.participants.length >= groupBuy.threshold && groupBuy.status === 'active') {
        groupBuy.status = 'completed';
        groupBuy.completedAt = new Date();
        
        // Notify all participants
        groupBuy.participants.forEach(participant => {
          sendGroupBuyingNotification(
            participant.userId, 
            groupBuy.productId,
            'Group Buy Successful!',
            `Your group purchase for "${groupBuy.productName}" has reached the required number of participants! You can now complete your purchase with a ${groupBuy.discountPercent}% discount.`
          );
        });
      }
      
      await groupBuy.save();
      
      // Update user's group buying participation
      const user = await User.findById(userId);
      if (user && product) {
        const productCarbonFootprint = product.sustainability.carbonFootprint || 10;
        const potentialSaving = (productCarbonFootprint * product.groupBuying.carbonSavingPercent) / 100;
        
        user.groupBuyingParticipation.push({
          groupId: groupBuy._id,
          productId: groupBuy.productId,
          productName: groupBuy.productName,
          joinedAt: new Date(),
          status: groupBuy.status,
          potentialCarbonSaving: potentialSaving
        });
        
        await user.save();
      }
      
      return { groupBuy, message: 'Successfully joined group buy' };
    } catch (error) {
      console.error('Error joining group buy:', error);
      throw error;
    }
  }
  
  /**
   * Get active group buys for a product
   */
  async getActiveGroupBuysForProduct(productId) {
    try {
      return await GroupBuy.find({
        productId,
        status: 'active',
        expiryDate: { $gt: new Date() }
      }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error fetching active group buys:', error);
      throw error;
    }
  }
  
  /**
   * Get group buys that a user is participating in
   */
  async getUserGroupBuys(userId) {
    try {
      return await GroupBuy.find({
        'participants.userId': mongoose.Types.ObjectId(userId)
      }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error fetching user group buys:', error);
      throw error;
    }
  }
  
  /**
   * Check and update expired group buys
   * This should be run periodically by a scheduler
   */
  async checkAndUpdateExpiredGroupBuys() {
    try {
      const expiredGroupBuys = await GroupBuy.find({
        status: 'active',
        expiryDate: { $lt: new Date() }
      });
      
      for (const groupBuy of expiredGroupBuys) {
        groupBuy.status = 'expired';
        await groupBuy.save();
        
        // Update user participation status
        await User.updateMany(
          { 'groupBuyingParticipation.groupId': groupBuy._id },
          { $set: { 'groupBuyingParticipation.$.status': 'expired' } }
        );
        
        // Reset product's current participants
        await Product.findByIdAndUpdate(
          groupBuy.productId,
          { 'groupBuying.currentParticipants': 0 }
        );
      }
      
      return expiredGroupBuys.length;
    } catch (error) {
      console.error('Error checking expired group buys:', error);
      throw error;
    }
  }
  
  /**
   * Calculate the environmental impact of a group buy
   */
  async calculateGroupBuyImpact(groupBuyId) {
    try {
      const groupBuy = await GroupBuy.findById(groupBuyId);
      
      if (!groupBuy) {
        throw new Error('Group buy not found');
      }
      
      const product = await Product.findById(groupBuy.productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      const participantsCount = groupBuy.participants.length;
      const productCarbonFootprint = product.sustainability.carbonFootprint || 10;
      
      // Calculate shipping emissions saved
      // Individual shipping vs. consolidated shipping
      const individualShippingEmissions = participantsCount * 2.5; // 2.5kg CO2 per individual shipment (average)
      const consolidatedShippingEmissions = 2.5 + ((participantsCount - 1) * 0.5); // Base + incremental
      const shippingEmissionsSaved = individualShippingEmissions - consolidatedShippingEmissions;
      
      // Calculate packaging materials saved
      const packagingSaved = participantsCount * 0.2; // 0.2kg packaging materials per order (average)
      
      // Calculate total product-related carbon savings
      const productCarbonSavings = (productCarbonFootprint * participantsCount * groupBuy.carbonSavingPercent) / 100;
      
      // Total impact
      const totalCarbonSaved = shippingEmissionsSaved + productCarbonSavings;
      const totalMaterialsSaved = packagingSaved;
      
      return {
        groupBuyId: groupBuy._id,
        participantsCount,
        shippingEmissionsSaved,
        packagingSaved,
        productCarbonSavings,
        totalCarbonSaved,
        totalMaterialsSaved
      };
    } catch (error) {
      console.error('Error calculating group buy impact:', error);
      throw error;
    }
  }
}

module.exports = new GroupBuyingService();