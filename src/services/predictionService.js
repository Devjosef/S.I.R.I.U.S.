/**
 * Prediction Service - ML-Based Predictions
 * 
 * Handles machine learning predictions for user behavior,
 * task prioritization, and optimal timing recommendations.
 * 
 * Lines: 320
 */

// Memory service integration
import { MemoryService } from './memoryService.js';

// Internal utilities
import { createLogger } from '../utils/logger.js';

const logger = createLogger('prediction-service');
const memoryService = new MemoryService();

/**
 * Predict next likely action based on current context
 * @param {string} userId - User identifier
 * @param {Object} currentContext - Current context
 * @returns {Promise<Object>} - Prediction results
 */
export const predictNextAction = async (userId, currentContext) => {
  try {
    const memory = await memoryService.loadMemory(userId);
    const predictivePatterns = memory.patterns.predictivePatterns;
    
    if (!predictivePatterns || !predictivePatterns.transitionMatrix) {
      return {
        confidence: 0,
        predictions: [],
        message: 'Insufficient data for prediction'
      };
    }
    
    const currentState = {
      timeBlock: currentContext.timeBlock,
      focus: currentContext.focus,
      energy: currentContext.energy,
      urgency: currentContext.urgency,
      actionType: currentContext.actionType
    };
    
    const currentKey = JSON.stringify(currentState);
    const transitions = predictivePatterns.transitionMatrix[currentKey];
    
    if (!transitions) {
      return {
        confidence: 0,
        predictions: [],
        message: 'No patterns found for current context'
      };
    }
    
    // Get top predictions
    const predictions = Object.entries(transitions)
      .map(([nextState, probability]) => ({
        nextState: JSON.parse(nextState),
        probability: probability,
        confidence: probability
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3);
    
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    
    return {
      confidence: avgConfidence,
      predictions,
      currentContext: currentState,
      totalPatterns: predictivePatterns.sequenceCount
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Error predicting next action');
    return {
      confidence: 0,
      predictions: [],
      error: error.message
    };
  }
};

/**
 * Predict optimal timing for a specific action
 * @param {string} userId - User identifier
 * @param {string} actionType - Type of action
 * @returns {Promise<Object>} - Optimal timing prediction
 */
export const predictOptimalTiming = async (userId, actionType) => {
  try {
    const memory = await memoryService.loadMemory(userId);
    const timeBlocks = memory.patterns.timeBlocks;
    const successPatterns = memory.patterns.successPatterns;
    
    if (!timeBlocks || !successPatterns) {
      return {
        confidence: 0,
        recommendations: [],
        message: 'Insufficient timing data'
      };
    }
    
    const recommendations = [];
    
        // Time-based recommendations
    if (timeBlocks.optimalHour !== undefined) {
      recommendations.push({
        type: 'optimal_hour',
        value: timeBlocks.optimalHour,
        confidence: calculateTimeConfidence(timeBlocks.hourDistribution),
        description: `You're most active at ${timeBlocks.optimalHour}:00`
      });
    }
    
    // Circadian rhythm recommendations
    if (timeBlocks.circadianRhythm) {
      const circadian = timeBlocks.circadianRhythm;
      recommendations.push({
        type: 'circadian_type',
        value: circadian.type,
        confidence: circadian.confidence,
        description: `You are a ${circadian.type.replace('_', ' ')} (${(circadian.confidence * 100).toFixed(1)}% confidence)`
      });
      
      if (circadian.peakHours && circadian.peakHours.length > 0) {
        recommendations.push({
          type: 'peak_hours',
          value: circadian.peakHours,
          confidence: circadian.confidence,
          description: `Peak performance hours: ${circadian.peakHours.map(h => `${h}:00`).join(', ')}`
        });
      }
    }
     
     if (timeBlocks.optimalTimeBlock) {
       recommendations.push({
         type: 'optimal_time_block',
         value: timeBlocks.optimalTimeBlock,
         confidence: calculateTimeConfidence(timeBlocks.timeBlockDistribution),
         description: `You work best during '${timeBlocks.optimalTimeBlock}' time blocks`
       });
     }
     
     if (timeBlocks.optimalWeekday) {
       recommendations.push({
         type: 'optimal_weekday',
         value: timeBlocks.optimalWeekday,
         confidence: calculateTimeConfidence(timeBlocks.weekdayDistribution),
         description: `You're most productive on ${timeBlocks.optimalWeekday}s`
       });
     }
    
    // Action-specific timing
    if (successPatterns[actionType]) {
      const actionPattern = successPatterns[actionType];
      if (actionPattern.optimalContexts && actionPattern.optimalContexts.timeBlocks) {
        const optimalTimeBlock = Object.keys(actionPattern.optimalContexts.timeBlocks)
          .reduce((a, b) => actionPattern.optimalContexts.timeBlocks[a] > actionPattern.optimalContexts.timeBlocks[b] ? a : b);
        
        recommendations.push({
          type: 'action_specific_timing',
          value: optimalTimeBlock,
          confidence: actionPattern.successRate / 100,
          description: `This action has ${actionPattern.successRate.toFixed(1)}% success rate during '${optimalTimeBlock}' time blocks`
        });
      }
    }
    
    return {
      confidence: recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length,
      recommendations: recommendations.sort((a, b) => b.confidence - a.confidence),
      actionType
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Error predicting optimal timing');
    return {
      confidence: 0,
      recommendations: [],
      error: error.message
    };
  }
};

/**
 * Predict success probability for an action
 * @param {string} userId - User identifier
 * @param {Object} actionContext - Action context
 * @returns {Promise<Object>} - Success probability prediction
 */
export const predictSuccessProbability = async (userId, actionContext) => {
  try {
    const memory = await memoryService.loadMemory(userId);
    const successPatterns = memory.patterns.successPatterns;
    const optimalContexts = memory.patterns.optimalContexts;
    
    if (!successPatterns || !optimalContexts) {
      return {
        probability: 0.5,
        confidence: 0,
        factors: [],
        message: 'Insufficient data for prediction'
      };
    }
    
    const actionType = actionContext.actionType || actionContext.operation;
    const actionPattern = successPatterns[actionType];
    
    let baseProbability = 0.5;
    let confidence = 0;
    const factors = [];
    
    // Base success rate from historical data
    if (actionPattern) {
      baseProbability = actionPattern.successRate / 100;
      confidence = Math.min(actionPattern.totalAttempts / 10, 1); // More attempts = higher confidence
      factors.push({
        factor: 'historical_success_rate',
        value: actionPattern.successRate,
        impact: 'high'
      });
    }
    
         // Context matching with optimal contexts
     const contextMatch = calculateContextMatch(actionContext, optimalContexts);
     if (contextMatch.bestMatch) {
       const contextImpact = contextMatch.bestMatch.avgPerformance / 100;
       baseProbability = (baseProbability + contextImpact) / 2;
       factors.push({
         factor: 'context_optimization',
         value: contextMatch.bestMatch.avgPerformance,
         impact: 'medium'
       });
     }
     
     // Behavioral preference matching
     const behavioralMatch = calculateBehavioralMatch(actionContext, memory.patterns.behavioralPreferences);
    if (behavioralMatch.score > 0) {
      baseProbability = (baseProbability + behavioralMatch.score) / 2;
      factors.push({
        factor: 'behavioral_preference',
        value: behavioralMatch.score * 100,
        impact: 'medium'
      });
    }
    
    return {
      probability: Math.max(0, Math.min(1, baseProbability)),
      confidence: Math.min(confidence + contextMatch.confidence, 1),
      factors: factors.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      }),
      contextMatch,
      behavioralMatch
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Error predicting success probability');
    return {
      probability: 0.5,
      confidence: 0,
      factors: [],
      error: error.message
    };
  }
};

/**
 * Generate personalized recommendations
 * @param {string} userId - User identifier
 * @param {Object} currentContext - Current context
 * @returns {Promise<Object>} - Personalized recommendations
 */
export const generatePersonalizedRecommendations = async (userId, currentContext) => {
  try {
    const memory = await memoryService.loadMemory(userId);
    const recommendations = [];
    
    // Time-based recommendations
    const timingPrediction = await predictOptimalTiming(userId, currentContext.actionType);
    if (timingPrediction.recommendations.length > 0) {
      recommendations.push({
        category: 'timing',
        recommendations: timingPrediction.recommendations,
        priority: 'high'
      });
    }
    
    // Success optimization recommendations
    const successPrediction = await predictSuccessProbability(userId, currentContext);
    if (successPrediction.probability < 0.7) {
      recommendations.push({
        category: 'success_optimization',
        recommendations: generateSuccessOptimizationRecommendations(successPrediction, memory),
        priority: 'high'
      });
    }
    
         // Behavioral optimization recommendations
     const behavioralRecommendations = generateBehavioralRecommendations(currentContext, memory);
     if (behavioralRecommendations.length > 0) {
       recommendations.push({
         category: 'behavioral_optimization',
         recommendations: behavioralRecommendations,
         priority: 'medium'
       });
     }
     
     // Productivity recommendations
     const productivityRecommendations = generateProductivityRecommendations(memory);
    if (productivityRecommendations.length > 0) {
      recommendations.push({
        category: 'productivity',
        recommendations: productivityRecommendations,
        priority: 'medium'
      });
    }
    
    return {
      userId,
      timestamp: new Date().toISOString(),
      currentContext,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      summary: {
        totalRecommendations: recommendations.reduce((sum, cat) => sum + cat.recommendations.length, 0),
        highPriorityCount: recommendations.filter(cat => cat.priority === 'high').length
      }
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Error generating personalized recommendations');
    return {
      userId,
      timestamp: new Date().toISOString(),
      recommendations: [],
      error: error.message
    };
  }
};

/**
 * Calculate time confidence based on distribution
 * @param {Object} distribution - Time distribution
 * @returns {number} - Confidence score
 */
const calculateTimeConfidence = (distribution) => {
  if (!distribution || Object.keys(distribution).length === 0) return 0;
  
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const max = Math.max(...Object.values(distribution));
  
  return Math.min(max / total, 1);
};

/**
 * Calculate context match with optimal contexts
 * @param {Object} context - Current context
 * @param {Array} optimalContexts - Optimal contexts
 * @returns {Object} - Context match results
 */
const calculateContextMatch = (context, optimalContexts) => {
  if (!optimalContexts || optimalContexts.length === 0) {
    return { bestMatch: null, confidence: 0 };
  }
  
  let bestMatch = null;
  let bestScore = 0;
  
  optimalContexts.forEach(optimal => {
    const score = calculateContextSimilarity(context, optimal.context);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { ...optimal, similarityScore: score };
    }
  });
  
  return {
    bestMatch: bestMatch,
    confidence: bestScore,
    allMatches: optimalContexts.map(opt => ({
      ...opt,
      similarityScore: calculateContextSimilarity(context, opt.context)
    })).sort((a, b) => b.similarityScore - a.similarityScore)
  };
};

/**
 * Calculate context similarity score
 * @param {Object} context1 - First context
 * @param {Object} context2 - Second context
 * @returns {number} - Similarity score (0-1)
 */
const calculateContextSimilarity = (context1, context2) => {
  let matches = 0;
  let total = 0;
  
  const fields = ['timeBlock', 'focus', 'energy', 'urgency'];
  
  fields.forEach(field => {
    if (context1[field] && context2[field]) {
      total++;
      if (context1[field] === context2[field]) {
        matches++;
      }
    }
  });
  
  return total > 0 ? matches / total : 0;
};

/**
 * Calculate behavioral match
 * @param {Object} context - Current context
 * @param {Object} preferences - Behavioral preferences
 * @returns {Object} - Behavioral match results
 */
const calculateBehavioralMatch = (context, preferences) => {
  if (!preferences) return { score: 0, matches: [] };
  
  const matches = [];
  let totalScore = 0;
  let totalWeight = 0;
  
  // Check focus preference
  if (preferences.preferredFocus && context.focus) {
    const focusMatch = preferences.preferredFocus.value === context.focus;
    const weight = preferences.preferredFocus.confidence;
    matches.push({
      factor: 'focus',
      match: focusMatch,
      weight,
      preference: preferences.preferredFocus.value,
      current: context.focus
    });
    totalScore += focusMatch ? weight : 0;
    totalWeight += weight;
  }
  
  // Check energy preference
  if (preferences.preferredEnergy && context.energy) {
    const energyMatch = preferences.preferredEnergy.value === context.energy;
    const weight = preferences.preferredEnergy.confidence;
    matches.push({
      factor: 'energy',
      match: energyMatch,
      weight,
      preference: preferences.preferredEnergy.value,
      current: context.energy
    });
    totalScore += energyMatch ? weight : 0;
    totalWeight += weight;
  }
  
  // Check urgency preference
  if (preferences.preferredUrgency && context.urgency) {
    const urgencyMatch = preferences.preferredUrgency.value === context.urgency;
    const weight = preferences.preferredUrgency.confidence;
    matches.push({
      factor: 'urgency',
      match: urgencyMatch,
      weight,
      preference: preferences.preferredUrgency.value,
      current: context.urgency
    });
    totalScore += urgencyMatch ? weight : 0;
    totalWeight += weight;
  }
  
  return {
    score: totalWeight > 0 ? totalScore / totalWeight : 0,
    matches,
    totalWeight
  };
};

/**
 * Generate success optimization recommendations
 * @param {Object} successPrediction - Success prediction results
 * @param {Object} memory - User memory
 * @returns {Array} - Success optimization recommendations
 */
const generateSuccessOptimizationRecommendations = (successPrediction, memory) => {
  const recommendations = [];
  
  if (successPrediction.probability < 0.5) {
    recommendations.push({
      type: 'timing_optimization',
      title: 'Consider Optimal Timing',
      description: 'Your success rate is low. Try scheduling this action during your optimal time blocks.',
      priority: 'high'
    });
  }
  
  if (successPrediction.contextMatch && successPrediction.contextMatch.bestMatch) {
    const optimalContext = successPrediction.contextMatch.bestMatch.context;
    recommendations.push({
      type: 'context_optimization',
      title: 'Optimize Context',
      description: `Try this action when you're in ${optimalContext.focus} mode with ${optimalContext.energy} energy.`,
      priority: 'medium'
    });
  }
  
  return recommendations;
};

/**
 * Generate behavioral recommendations
 * @param {Object} currentContext - Current context
 * @param {Object} memory - User memory
 * @returns {Array} - Behavioral recommendations
 */
const generateBehavioralRecommendations = (currentContext, memory) => {
  const recommendations = [];
  const preferences = memory.patterns.behavioralPreferences;
  
  if (preferences && preferences.preferredFocus && currentContext.focus !== preferences.preferredFocus.value) {
    recommendations.push({
      type: 'focus_optimization',
      title: 'Optimize Focus Mode',
      description: `You typically perform better in '${preferences.preferredFocus.value}' mode. Consider switching.`,
      priority: 'medium'
    });
  }
  
  if (preferences && preferences.preferredEnergy && currentContext.energy !== preferences.preferredEnergy.value) {
    recommendations.push({
      type: 'energy_optimization',
      title: 'Energy Management',
      description: `You work best with ${preferences.preferredEnergy.value} energy. Consider taking a break or energizing.`,
      priority: 'medium'
    });
  }
  
  return recommendations;
};

/**
 * Generate productivity recommendations
 * @param {Object} memory - User memory
 * @returns {Array} - Productivity recommendations
 */
const generateProductivityRecommendations = (memory) => {
  const recommendations = [];
  const timeBlocks = memory.patterns.timeBlocks;
  
  if (timeBlocks && timeBlocks.optimalHour !== undefined) {
    const currentHour = new Date().getHours();
    const hourDiff = Math.abs(currentHour - timeBlocks.optimalHour);
    
    if (hourDiff <= 2) {
      recommendations.push({
        type: 'peak_performance',
        title: 'Peak Performance Window',
        description: `You're in your optimal performance window (${timeBlocks.optimalHour}:00). Focus on important tasks.`,
        priority: 'high'
      });
    }
  }
  
  return recommendations;
};