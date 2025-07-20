/**
 * Learning Analytics Service
 * 
 * Provides insights and analytics from S.I.R.I.U.S.'s learning data
 * - Pattern recognition
 * - Productivity insights
 * - Behavioral analysis
 * - Predictive recommendations
 */

import { MemoryService } from './memoryService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('learning-analytics');
const memoryService = new MemoryService();

/**
 * Get comprehensive learning analytics for a user
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} - Learning analytics
 */
export const getLearningAnalytics = async (userId) => {
  try {
    const memory = await memoryService.loadMemory(userId);
    const interactions = memory.patterns.interactions || [];
    
    // Time-based analysis
    const timeAnalysis = analyzeTimePatterns(interactions);
    
    // Operation success rates
    const successRates = analyzeSuccessRates(interactions);
    
    // Behavioral patterns
    const behavioralPatterns = analyzeBehavioralPatterns(interactions);
    
    // Productivity insights
    const productivityInsights = analyzeProductivity(interactions);
    
    // Predictive recommendations
    const recommendations = generateRecommendations(interactions, memory);
    
    return {
      userId,
      timestamp: new Date().toISOString(),
      summary: {
        totalInteractions: interactions.length,
        learningPeriod: calculateLearningPeriod(interactions),
        mostActiveTime: timeAnalysis.mostActiveTime,
        successRate: successRates.overall,
        topOperations: successRates.topOperations
      },
      timeAnalysis,
      successRates,
      behavioralPatterns,
      productivityInsights,
      recommendations
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Error generating learning analytics');
    throw new Error('Failed to generate learning analytics');
  }
};

/**
 * Analyze time-based patterns in interactions
 * @param {Array} interactions - User interactions
 * @returns {Object} - Time analysis results
 */
const analyzeTimePatterns = (interactions) => {
  const timeBlocks = {};
  const hours = {};
  const days = {};
  
  interactions.forEach(interaction => {
    const timestamp = new Date(interaction.timestamp);
    const hour = timestamp.getHours();
    const day = timestamp.getDay();
    const timeBlock = interaction.timeBlock || 'unknown';
    
    // Time block analysis
    timeBlocks[timeBlock] = (timeBlocks[timeBlock] || 0) + 1;
    
    // Hour analysis
    hours[hour] = (hours[hour] || 0) + 1;
    
    // Day analysis
    days[day] = (days[day] || 0) + 1;
  });
  
  const mostActiveTime = Object.keys(hours).reduce((a, b) => hours[a] > hours[b] ? a : b);
  const mostActiveDay = Object.keys(days).reduce((a, b) => days[a] > days[b] ? a : b);
  const mostActiveTimeBlock = Object.keys(timeBlocks).reduce((a, b) => timeBlocks[a] > timeBlocks[b] ? a : b);
  
  return {
    timeBlocks,
    hours,
    days,
    mostActiveTime: parseInt(mostActiveTime),
    mostActiveDay: parseInt(mostActiveDay),
    mostActiveTimeBlock,
    totalInteractions: interactions.length
  };
};

/**
 * Analyze success rates for different operations
 * @param {Array} interactions - User interactions
 * @returns {Object} - Success rate analysis
 */
const analyzeSuccessRates = (interactions) => {
  const operationStats = {};
  let totalSuccess = 0;
  let totalOperations = 0;
  
  interactions.forEach(interaction => {
    if (interaction.type === 'jira_operation' || interaction.type === 'autonomous_action') {
      const operation = interaction.operation || interaction.actionType || 'unknown';
      const success = interaction.success === true;
      
      if (!operationStats[operation]) {
        operationStats[operation] = { success: 0, total: 0 };
      }
      
      operationStats[operation].total++;
      if (success) {
        operationStats[operation].success++;
        totalSuccess++;
      }
      totalOperations++;
    }
  });
  
  // Calculate success rates
  const successRates = {};
  Object.keys(operationStats).forEach(operation => {
    const stats = operationStats[operation];
    successRates[operation] = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
  });
  
  // Get top operations by success rate
  const topOperations = Object.entries(successRates)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([operation, rate]) => ({ operation, successRate: rate }));
  
  return {
    overall: totalOperations > 0 ? (totalSuccess / totalOperations) * 100 : 0,
    byOperation: successRates,
    topOperations,
    operationStats
  };
};

/**
 * Analyze behavioral patterns
 * @param {Array} interactions - User interactions
 * @returns {Object} - Behavioral analysis
 */
const analyzeBehavioralPatterns = (interactions) => {
  const patterns = {
    focusPatterns: {},
    urgencyPatterns: {},
    energyPatterns: {},
    actionPreferences: {}
  };
  
  interactions.forEach(interaction => {
    // Focus patterns
    if (interaction.focus) {
      patterns.focusPatterns[interaction.focus] = (patterns.focusPatterns[interaction.focus] || 0) + 1;
    }
    
    // Urgency patterns
    if (interaction.urgency) {
      patterns.urgencyPatterns[interaction.urgency] = (patterns.urgencyPatterns[interaction.urgency] || 0) + 1;
    }
    
    // Energy patterns
    if (interaction.energy) {
      patterns.energyPatterns[interaction.energy] = (patterns.energyPatterns[interaction.energy] || 0) + 1;
    }
    
    // Action preferences
    if (interaction.actions && Array.isArray(interaction.actions)) {
      interaction.actions.forEach(action => {
        const actionType = action.type || 'unknown';
        patterns.actionPreferences[actionType] = (patterns.actionPreferences[actionType] || 0) + 1;
      });
    }
  });
  
  return {
    ...patterns,
    preferredFocus: Object.keys(patterns.focusPatterns).reduce((a, b) => 
      patterns.focusPatterns[a] > patterns.focusPatterns[b] ? a : b, 'unknown'),
    preferredUrgency: Object.keys(patterns.urgencyPatterns).reduce((a, b) => 
      patterns.urgencyPatterns[a] > patterns.urgencyPatterns[b] ? a : b, 'unknown'),
    preferredEnergy: Object.keys(patterns.energyPatterns).reduce((a, b) => 
      patterns.energyPatterns[a] > patterns.energyPatterns[b] ? a : b, 'unknown'),
    preferredActionType: Object.keys(patterns.actionPreferences).reduce((a, b) => 
      patterns.actionPreferences[a] > patterns.actionPreferences[b] ? a : b, 'unknown')
  };
};

/**
 * Analyze productivity patterns
 * @param {Array} interactions - User interactions
 * @returns {Object} - Productivity analysis
 */
const analyzeProductivity = (interactions) => {
  const productivity = {
    focusSessions: 0,
    deepWorkSessions: 0,
    meetingPrepSessions: 0,
    urgentTaskHandling: 0,
    averageSessionDuration: 0
  };
  
  let totalDuration = 0;
  let sessionCount = 0;
  
  interactions.forEach(interaction => {
    if (interaction.focus === 'deep-work') {
      productivity.deepWorkSessions++;
    }
    if (interaction.focus === 'meeting-prep') {
      productivity.meetingPrepSessions++;
    }
    if (interaction.urgency === 'critical' || interaction.urgency === 'high') {
      productivity.urgentTaskHandling++;
    }
    if (interaction.actions && interaction.actions.some(a => a.id === 'focus-mode')) {
      productivity.focusSessions++;
    }
    
    // Estimate session duration (placeholder for future implementation)
    if (interaction.type === 'autonomous_action') {
      sessionCount++;
      totalDuration += 25; // Assume 25 minutes per session
    }
  });
  
  productivity.averageSessionDuration = sessionCount > 0 ? totalDuration / sessionCount : 0;
  
  return productivity;
};

/**
 * Generate personalized recommendations
 * @param {Array} interactions - User interactions
 * @param {Object} memory - User memory
 * @returns {Array} - Recommendations
 */
const generateRecommendations = (interactions, memory) => {
  const recommendations = [];
  
  // Analyze recent patterns
  const recentInteractions = interactions.slice(-10);
  const timeAnalysis = analyzeTimePatterns(recentInteractions);
  const successRates = analyzeSuccessRates(recentInteractions);
  
  // Recommendation 1: Optimal work time
  if (timeAnalysis.mostActiveTime) {
    recommendations.push({
      type: 'optimal_time',
      title: 'Optimal Work Time',
      description: `You're most active at ${timeAnalysis.mostActiveTime}:00. Consider scheduling important tasks during this time.`,
      priority: 'medium',
      confidence: 0.8
    });
  }
  
  // Recommendation 2: Focus improvement
  if (successRates.overall < 80) {
    recommendations.push({
      type: 'focus_improvement',
      title: 'Improve Focus',
      description: `Your success rate is ${successRates.overall.toFixed(1)}%. Consider using focus mode more often.`,
      priority: 'high',
      confidence: 0.7
    });
  }
  
  // Recommendation 3: Time block optimization
  if (timeAnalysis.mostActiveTimeBlock && timeAnalysis.mostActiveTimeBlock !== 'unknown') {
    recommendations.push({
      type: 'time_block_optimization',
      title: 'Optimize Time Blocks',
      description: `You work best during '${timeAnalysis.mostActiveTimeBlock}' time blocks. Schedule deep work during these periods.`,
      priority: 'medium',
      confidence: 0.9
    });
  }
  
  // Recommendation 4: Energy management
  const energyPatterns = analyzeBehavioralPatterns(recentInteractions);
  if (energyPatterns.preferredEnergy === 'high') {
    recommendations.push({
      type: 'energy_management',
      title: 'Energy Management',
      description: 'You perform best with high energy. Consider scheduling breaks to maintain energy levels.',
      priority: 'medium',
      confidence: 0.6
    });
  }
  
  return recommendations;
};

/**
 * Calculate learning period
 * @param {Array} interactions - User interactions
 * @returns {Object} - Learning period info
 */
const calculateLearningPeriod = (interactions) => {
  if (interactions.length === 0) {
    return { days: 0, startDate: null, endDate: null };
  }
  
  const timestamps = interactions.map(i => new Date(i.timestamp)).sort((a, b) => a - b);
  const startDate = timestamps[0];
  const endDate = timestamps[timestamps.length - 1];
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  return {
    days,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
};

/**
 * Get learning insights for a specific time period
 * @param {string} userId - User identifier
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} - Time period insights
 */
export const getTimePeriodInsights = async (userId, startDate, endDate) => {
  try {
    const memory = await memoryService.loadMemory(userId);
    const interactions = memory.patterns.interactions || [];
    
    // Filter interactions by time period
    const filteredInteractions = interactions.filter(interaction => {
      const timestamp = new Date(interaction.timestamp);
      return timestamp >= startDate && timestamp <= endDate;
    });
    
    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      interactions: filteredInteractions.length,
      analytics: await getLearningAnalytics(userId),
      trends: analyzeTrends(filteredInteractions)
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Error getting time period insights');
    throw new Error('Failed to get time period insights');
  }
};

/**
 * Analyze trends in interactions
 * @param {Array} interactions - Filtered interactions
 * @returns {Object} - Trend analysis
 */
const analyzeTrends = (interactions) => {
  // Group by day and analyze trends
  const dailyStats = {};
  
  interactions.forEach(interaction => {
    const date = new Date(interaction.timestamp).toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { count: 0, success: 0, operations: {} };
    }
    
    dailyStats[date].count++;
    if (interaction.success === true) {
      dailyStats[date].success++;
    }
    
    const operation = interaction.operation || interaction.actionType || 'unknown';
    dailyStats[date].operations[operation] = (dailyStats[date].operations[operation] || 0) + 1;
  });
  
  return {
    dailyStats,
    totalDays: Object.keys(dailyStats).length,
    averageDailyInteractions: interactions.length / Object.keys(dailyStats).length || 0
  };
}; 