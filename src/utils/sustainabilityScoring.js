/**
 * Sustainability Scoring System for Green-Commerce
 * Calculates eco-score based on various product attributes
 */
class SustainabilityScoring {
  /**
   * Calculate overall eco-score for a product (1-5 scale)
   * @param {Object} product - Product data
   * @return {Number} score from 1-5
   */
  calculateEcoScore(product) {
    // Weights for different factors
    const weights = {
      materials: 0.3,
      packaging: 0.2,
      production: 0.2,
      carbonFootprint: 0.2,
      certification: 0.1
    };
    
    // Calculate individual component scores
    const materialScore = this.scoreMaterials(product.materials);
    const packagingScore = this.scorePackaging(product.packaging);
    const productionScore = this.scoreProduction(product.production);
    const carbonScore = this.scoreCarbonFootprint(product.carbonFootprint);
    const certScore = this.scoreCertifications(product.certifications);
    
    // Calculate weighted average
    const weightedScore = 
      materialScore * weights.materials + 
      packagingScore * weights.packaging +
      productionScore * weights.production +
      carbonScore * weights.carbonFootprint +
      certScore * weights.certification;
    
    // Round to nearest 0.5
    return Math.round(weightedScore * 2) / 2;
  }
  
  /**
   * Score product materials (1-5 scale)
   */
  scoreMaterials(materials) {
    if (!materials) return 1;
    
    // Define material types and their eco-friendly scores
    const materialScores = {
      'organic': 5,
      'recycled': 4.5,
      'biodegradable': 4,
      'renewable': 4,
      'sustainable': 3.5,
      'natural': 3,
      'synthetic-eco': 2.5,
      'mixed': 2,
      'synthetic': 1.5,
      'plastic': 1
    };
    
    // Calculate average score of all materials
    let totalScore = 0;
    let materialCount = 0;
    
    materials.forEach(material => {
      for (const [type, score] of Object.entries(materialScores)) {
        if (material.toLowerCase().includes(type)) {
          totalScore += score;
          materialCount++;
          break;
        }
      }
    });
    
    return materialCount > 0 ? totalScore / materialCount : 1;
  }
  
  /**
   * Score product packaging (1-5 scale)
   */
  scorePackaging(packaging) {
    if (!packaging) return 1;
    
    const packagingScores = {
      'plastic-free': 5,
      'biodegradable': 4.5,
      'compostable': 4.5,
      'recycled': 4,
      'minimal': 3.5,
      'recyclable': 3,
      'paper': 3,
      'mixed': 2,
      'plastic': 1
    };
    
    // Find the best matching packaging description
    let bestScore = 1;
    
    for (const [type, score] of Object.entries(packagingScores)) {
      if (packaging.toLowerCase().includes(type)) {
        bestScore = Math.max(bestScore, score);
      }
    }
    
    return bestScore;
  }
  
  /**
   * Score production methods (1-5 scale)
   */
  scoreProduction(production) {
    if (!production) return 1;
    
    const productionScores = {
      'carbon-neutral': 5,
      'solar-powered': 4.5,
      'renewable-energy': 4.5,
      'low-impact': 4,
      'handmade': 3.5,
      'local': 3.5,
      'fair-trade': 3,
      'standard': 2,
      'conventional': 1.5
    };
    
    let bestScore = 1;
    
    for (const [type, score] of Object.entries(productionScores)) {
      if (production.toLowerCase().includes(type)) {
        bestScore = Math.max(bestScore, score);
      }
    }
    
    return bestScore;
  }
  
  /**
   * Score carbon footprint (1-5 scale)
   * Lower carbon footprint = higher score
   */
  scoreCarbonFootprint(carbonFootprint) {
    if (!carbonFootprint || typeof carbonFootprint !== 'number') return 1;
    
    // Score based on carbon footprint in kg CO2e
    if (carbonFootprint <= 1) return 5;
    if (carbonFootprint <= 5) return 4.5;
    if (carbonFootprint <= 10) return 4;
    if (carbonFootprint <= 25) return 3.5;
    if (carbonFootprint <= 50) return 3;
    if (carbonFootprint <= 100) return 2.5;
    if (carbonFootprint <= 250) return 2;
    if (carbonFootprint <= 500) return 1.5;
    return 1;
  }
  
  /**
   * Score certifications (1-5 scale)
   */
  scoreCertifications(certifications) {
    if (!certifications || certifications.length === 0) return 1;
    
    const certScores = {
      'cradle-to-cradle': 5,
      'b-corp': 4.5,
      'fairtrade': 4, 
      'organic': 4,
      'rainforest-alliance': 4,
      'energy-star': 3.5,
      'fsc': 3.5,
      'green-seal': 3.5,
      'ecolabel': 3,
      'iso': 2.5
    };
    
    let totalScore = 0;
    let matchedCerts = 0;
    
    certifications.forEach(cert => {
      const certLower = cert.toLowerCase();
      for (const [type, score] of Object.entries(certScores)) {
        if (certLower.includes(type)) {
          totalScore += score;
          matchedCerts++;
          break;
        }
      }
    });
    
    // Bonus for multiple certifications
    const baseScore = matchedCerts > 0 ? totalScore / matchedCerts : 1;
    const certBonus = Math.min(certifications.length * 0.2, 1);
    
    return Math.min(baseScore + certBonus, 5);
  }
  
  /**
   * Generate display label based on eco-score
   */
  getEcoLabel(score) {
    if (score >= 4.5) return 'Exceptional';
    if (score >= 4.0) return 'Excellent';
    if (score >= 3.5) return 'Very Good';
    if (score >= 3.0) return 'Good';
    if (score >= 2.5) return 'Fair';
    if (score >= 2.0) return 'Basic';
    return 'Minimal';
  }
  
  /**
   * Calculate carbon savings compared to conventional product
   */
  calculateCarbonSavings(product, conventionalFootprint = null) {
    if (!product.carbonFootprint) return 0;
    
    // If conventional product carbon footprint not provided, estimate based on category
    if (!conventionalFootprint) {
      const categoryBaselines = {
        'clothing': 20,
        'electronics': 100,
        'food': 15,
        'beauty': 25,
        'home': 40,
        'default': 30
      };
      
      conventionalFootprint = categoryBaselines[product.category] || categoryBaselines.default;
    }
    
    return Math.max(0, conventionalFootprint - product.carbonFootprint);
  }
}

module.exports = new SustainabilityScoring();