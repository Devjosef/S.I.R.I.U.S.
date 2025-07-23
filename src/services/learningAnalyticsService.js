/**
 * Learning Analytics Service - Pattern Analysis
 * 
 * Analyzes learning patterns and provides insights for
 * improving user experience and system performance.
 * 
 * Lines: 280
 */

// Memory service integration
import { MemoryService } from './memoryService.js';

// Internal utilities
import { createLogger } from '../utils/logger.js';

const logger = createLogger('learning-analytics-service');
const memoryService = new MemoryService();

/**
 * Get comprehensive learning analytics for a user
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} - Learning analytics data
 */
export const getLearningAnalytics = async (userId) => {
  try {
    const memory = await memoryService.loadMemory(userId);
    
    // Analyze startup plan generation patterns
    const startupPlanMetrics = analyzeStartupPlanMetrics(memory);
    
    // Analyze user interaction patterns
    const userPatterns = analyzeUserPatterns(memory);
    
    // Analyze learning progress
    const learningProgress = analyzeLearningProgress(memory);
    
    // Analyze RLVR learning
    const rlvrMetrics = analyzeRLVRMetrics(memory);
    
    // Generate recommendations
    const recommendations = generateRecommendations(startupPlanMetrics, userPatterns, learningProgress);
    
    const analytics = {
      userId,
      startupPlanMetrics,
      userPatterns,
      learningProgress,
      rlvrMetrics,
      recommendations,
      lastUpdated: new Date().toISOString()
    };
    
    logger.info({ userId }, 'Learning analytics generated successfully');
    return analytics;
    
  } catch (error) {
    logger.error({ err: error, userId }, 'Error generating learning analytics');
    throw error;
  }
};

/**
 * Analyze startup plan generation metrics
 * @param {Object} memory - User memory data
 * @returns {Object} - Startup plan metrics
 */
const analyzeStartupPlanMetrics = (memory) => {
  const startupPlans = memory.startupPlans || [];
  const feedback = memory.learnedBehaviors?.startup_plan_feedback || {};
  
  return {
    plansGenerated: startupPlans.length,
    averageSatisfaction: calculateAverageSatisfaction(feedback),
    completionRate: calculateCompletionRate(startupPlans),
    industryPreferences: analyzeIndustryPreferences(startupPlans),
    contentPreferences: analyzeContentPreferences(startupPlans),
    generationPatterns: analyzeGenerationPatterns(startupPlans),
    feedbackAnalysis: analyzeFeedbackPatterns(feedback)
  };
};

/**
 * Analyze user interaction patterns
 * @param {Object} memory - User memory data
 * @returns {Object} - User pattern analysis
 */
const analyzeUserPatterns = (memory) => {
  const interactions = memory.patterns?.interactions || [];
  
  return {
    preferredContentTypes: analyzeContentTypePreferences(interactions),
    optimalGenerationTimes: analyzeTimingPatterns(interactions),
    commonQuestions: extractCommonQuestions(interactions),
    interactionFrequency: analyzeInteractionFrequency(interactions),
    focusPatterns: analyzeFocusPatterns(interactions),
    energyPatterns: analyzeEnergyPatterns(interactions)
  };
};

/**
 * Analyze learning progress
 * @param {Object} memory - User memory data
 * @returns {Object} - Learning progress metrics
 */
const analyzeLearningProgress = (memory) => {
  const rlvrExperience = memory.rlvrExperience || [];
  const policyUpdates = memory.policyUpdates || [];
  const feedback = memory.startupPlanFeedback || {};
  
  return {
    rlvrExperienceCount: rlvrExperience.length,
    policyUpdatesCount: policyUpdates.length,
    improvementRate: calculateImprovementRate(feedback),
    learningVelocity: calculateLearningVelocity(rlvrExperience),
    patternRecognition: analyzePatternRecognition(memory),
    adaptationSpeed: calculateAdaptationSpeed(policyUpdates)
  };
};

/**
 * Analyze RLVR learning metrics
 * @param {Object} memory - User memory data
 * @returns {Object} - RLVR metrics
 */
const analyzeRLVRMetrics = (memory) => {
  const rlvrExperience = memory.rlvrExperience || [];
  const visualStates = memory.visualStates || [];
  
  return {
    experienceCount: rlvrExperience.length,
    visualStateCount: visualStates.length,
    rewardDistribution: analyzeRewardDistribution(rlvrExperience),
    actionEffectiveness: analyzeActionEffectiveness(rlvrExperience),
    policyConvergence: analyzePolicyConvergence(memory),
    learningEfficiency: calculateLearningEfficiency(rlvrExperience)
  };
};

/**
 * Generate personalized recommendations
 * @param {Object} startupPlanMetrics - Startup plan metrics
 * @param {Object} userPatterns - User pattern analysis
 * @param {Object} learningProgress - Learning progress metrics
 * @returns {Array} - Recommendations
 */
const generateRecommendations = (startupPlanMetrics, userPatterns, learningProgress) => {
  const recommendations = [];
  
  // Content personalization recommendations
  if (startupPlanMetrics.plansGenerated > 0) {
    recommendations.push({
      type: 'content_personalization',
      title: 'Enhance Content Personalization',
      description: `Based on ${startupPlanMetrics.plansGenerated} plans generated, consider personalizing content for ${startupPlanMetrics.industryPreferences.topIndustry || 'your industry'}`,
      priority: 'high',
      confidence: 0.8
    });
  }
  
  // Timing optimization recommendations
  if (userPatterns.optimalGenerationTimes.length > 0) {
    recommendations.push({
      type: 'timing_optimization',
      title: 'Optimize Generation Timing',
      description: `Your optimal plan generation times are: ${userPatterns.optimalGenerationTimes.join(', ')}`,
      priority: 'medium',
      confidence: 0.7
    });
  }
  
  // Learning improvement recommendations
  if (learningProgress.improvementRate < 0.5) {
    recommendations.push({
      type: 'learning_improvement',
      title: 'Improve Learning Rate',
      description: 'Consider providing more feedback to improve learning effectiveness',
      priority: 'high',
      confidence: 0.9
    });
  }
  
  return recommendations;
};

// Helper functions for calculations
const calculateAverageSatisfaction = (feedback) => {
  const feedbackValues = Object.values(feedback).map(f => f.value?.satisfaction || 0);
  return feedbackValues.length > 0 ? feedbackValues.reduce((a, b) => a + b, 0) / feedbackValues.length : 0;
};

const calculateCompletionRate = (plans) => {
  if (plans.length === 0) return 0;
  const completedPlans = plans.filter(plan => plan.status === 'completed').length;
  return (completedPlans / plans.length) * 100;
};

const analyzeIndustryPreferences = (plans) => {
  const industries = plans.map(plan => plan.industry).filter(Boolean);
  const industryCount = {};
  industries.forEach(industry => {
    industryCount[industry] = (industryCount[industry] || 0) + 1;
  });
  
  const sortedIndustries = Object.entries(industryCount)
    .sort(([,a], [,b]) => b - a);
  
  return {
    topIndustry: sortedIndustries[0]?.[0] || 'Unknown',
    industryDistribution: industryCount,
    totalIndustries: Object.keys(industryCount).length
  };
};

const analyzeContentPreferences = (plans) => {
  const contentTypes = plans.map(plan => plan.contentType || 'standard').filter(Boolean);
  const typeCount = {};
  contentTypes.forEach(type => {
    typeCount[type] = (typeCount[type] || 0) + 1;
  });
  
  return {
    preferredTypes: Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .map(([type]) => type),
    typeDistribution: typeCount
  };
};

const analyzeGenerationPatterns = (plans) => {
  const timestamps = plans.map(plan => new Date(plan.createdAt)).filter(Boolean);
  const hours = timestamps.map(ts => ts.getHours());
  const days = timestamps.map(ts => ts.getDay());
  
  return {
    preferredHours: getMostFrequent(hours, 3),
    preferredDays: getMostFrequent(days, 3),
    generationFrequency: plans.length / Math.max(1, (Date.now() - Math.min(...timestamps.map(t => t.getTime()))) / (1000 * 60 * 60 * 24))
  };
};

const analyzeFeedbackPatterns = (feedback) => {
  const feedbackValues = Object.values(feedback).map(f => f.value).filter(Boolean);
  
  return {
    totalFeedback: feedbackValues.length,
    averageSatisfaction: calculateAverageSatisfaction(feedback),
    commonSuggestions: extractCommonSuggestions(feedbackValues),
    feedbackTrend: analyzeFeedbackTrend(feedbackValues)
  };
};

const analyzeContentTypePreferences = (interactions) => {
  const contentTypes = interactions
    .filter(i => i.type === 'content_interaction')
    .map(i => i.contentType)
    .filter(Boolean);
  
  return getMostFrequent(contentTypes, 5);
};

const analyzeTimingPatterns = (interactions) => {
  const timestamps = interactions
    .filter(i => i.type === 'startup_plan_generation')
    .map(i => new Date(i.timestamp))
    .filter(Boolean);
  
  const hours = timestamps.map(ts => ts.getHours());
  return getMostFrequent(hours, 3).map(h => `${h}:00`);
};

const extractCommonQuestions = (interactions) => {
  const questions = interactions
    .filter(i => i.type === 'question' || i.type === 'help_request')
    .map(i => i.content)
    .filter(Boolean);
  
  return getMostFrequent(questions, 5);
};

const analyzeInteractionFrequency = (interactions) => {
  const recentInteractions = interactions.filter(i => {
    const interactionTime = new Date(i.timestamp).getTime();
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return interactionTime > oneWeekAgo;
  });
  
  return {
    dailyAverage: recentInteractions.length / 7,
    totalInteractions: interactions.length,
    recentActivity: recentInteractions.length
  };
};

const analyzeFocusPatterns = (interactions) => {
  const focusTypes = interactions
    .map(i => i.focus)
    .filter(Boolean);
  
  return getMostFrequent(focusTypes, 3);
};

const analyzeEnergyPatterns = (interactions) => {
  const energyLevels = interactions
    .map(i => i.energy)
    .filter(Boolean);
  
  return getMostFrequent(energyLevels, 3);
};

const calculateImprovementRate = (feedback) => {
  const feedbackValues = Object.values(feedback).map(f => f.value?.satisfaction || 0);
  if (feedbackValues.length < 2) return 0;
  
  const sortedFeedback = feedbackValues.sort((a, b) => a - b);
  const firstHalf = sortedFeedback.slice(0, Math.floor(sortedFeedback.length / 2));
  const secondHalf = sortedFeedback.slice(Math.floor(sortedFeedback.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  return secondHalfAvg - firstHalfAvg;
};

const calculateLearningVelocity = (rlvrExperience) => {
  if (rlvrExperience.length < 2) return 0;
  
  const sortedExperience = rlvrExperience.sort((a, b) => a.timestamp - b.timestamp);
  const firstHalf = sortedExperience.slice(0, Math.floor(sortedExperience.length / 2));
  const secondHalf = sortedExperience.slice(Math.floor(sortedExperience.length / 2));
  
  const firstHalfReward = firstHalf.reduce((sum, exp) => sum + (exp.reward || 0), 0) / firstHalf.length;
  const secondHalfReward = secondHalf.reduce((sum, exp) => sum + (exp.reward || 0), 0) / secondHalf.length;
  
  return secondHalfReward - firstHalfReward;
};

const analyzePatternRecognition = (memory) => {
  const patterns = memory.patterns || {};
  const predictivePatterns = patterns.predictivePatterns || {};
  
  return {
    hasPredictivePatterns: !!predictivePatterns.transitionMatrix,
    patternCount: Object.keys(predictivePatterns.transitionMatrix || {}).length,
    confidence: predictivePatterns.confidence || 0
  };
};

const calculateAdaptationSpeed = (policyUpdates) => {
  if (policyUpdates.length < 2) return 0;
  
  const sortedUpdates = policyUpdates.sort((a, b) => a.timestamp - b.timestamp);
  const timeSpan = sortedUpdates[sortedUpdates.length - 1].timestamp - sortedUpdates[0].timestamp;
  const updateRate = policyUpdates.length / (timeSpan / (1000 * 60 * 60 * 24)); // updates per day
  
  return updateRate;
};

const analyzeRewardDistribution = (rlvrExperience) => {
  const rewards = rlvrExperience.map(exp => exp.reward || 0);
  
  return {
    averageReward: rewards.reduce((a, b) => a + b, 0) / rewards.length,
    maxReward: Math.max(...rewards),
    minReward: Math.min(...rewards),
    rewardVariance: calculateVariance(rewards)
  };
};

const analyzeActionEffectiveness = (rlvrExperience) => {
  const actionTypes = {};
  
  rlvrExperience.forEach(exp => {
    const actionType = exp.action?.type || 'unknown';
    if (!actionTypes[actionType]) {
      actionTypes[actionType] = { count: 0, totalReward: 0 };
    }
    actionTypes[actionType].count++;
    actionTypes[actionType].totalReward += exp.reward || 0;
  });
  
  return Object.entries(actionTypes).map(([type, data]) => ({
    type,
    averageReward: data.totalReward / data.count,
    frequency: data.count
  })).sort((a, b) => b.averageReward - a.averageReward);
};

const analyzePolicyConvergence = (memory) => {
  const policyUpdates = memory.policyUpdates || [];
  if (policyUpdates.length < 3) return { converged: false, confidence: 0 };
  
  const recentUpdates = policyUpdates.slice(-3);
  const changes = recentUpdates.map(update => update.changeMagnitude || 0);
  const averageChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  
  return {
    converged: averageChange < 0.1,
    confidence: Math.max(0, 1 - averageChange),
    averageChange
  };
};

const calculateLearningEfficiency = (rlvrExperience) => {
  if (rlvrExperience.length < 2) return 0;
  
  const sortedExperience = rlvrExperience.sort((a, b) => a.timestamp - b.timestamp);
  const firstQuarter = sortedExperience.slice(0, Math.floor(sortedExperience.length / 4));
  const lastQuarter = sortedExperience.slice(-Math.floor(sortedExperience.length / 4));
  
  const firstQuarterAvg = firstQuarter.reduce((sum, exp) => sum + (exp.reward || 0), 0) / firstQuarter.length;
  const lastQuarterAvg = lastQuarter.reduce((sum, exp) => sum + (exp.reward || 0), 0) / lastQuarter.length;
  
  return (lastQuarterAvg - firstQuarterAvg) / Math.max(1, sortedExperience.length);
};

// Utility functions
const getMostFrequent = (array, count) => {
  const frequency = {};
  array.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, count)
    .map(([item]) => item);
};

const calculateVariance = (array) => {
  const mean = array.reduce((a, b) => a + b, 0) / array.length;
  const squaredDiffs = array.map(x => Math.pow(x - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / array.length;
};

const extractCommonSuggestions = (feedbackValues) => {
  const suggestions = feedbackValues
    .map(f => f.suggestions)
    .filter(Boolean)
    .flat();
  
  return getMostFrequent(suggestions, 5);
};

const analyzeFeedbackTrend = (feedbackValues) => {
  const sortedFeedback = feedbackValues
    .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
  
  if (sortedFeedback.length < 2) return 'insufficient_data';
  
  const firstHalf = sortedFeedback.slice(0, Math.floor(sortedFeedback.length / 2));
  const secondHalf = sortedFeedback.slice(Math.floor(sortedFeedback.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, f) => sum + (f.satisfaction || 0), 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, f) => sum + (f.satisfaction || 0), 0) / secondHalf.length;
  
  if (secondHalfAvg > firstHalfAvg + 0.1) return 'improving';
  if (secondHalfAvg < firstHalfAvg - 0.1) return 'declining';
  return 'stable';
};

export default {
  getLearningAnalytics
};