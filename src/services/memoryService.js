/**
 * Memory Service - Advanced Pattern Learning and Circadian Rhythm Detection
 * 
 * Handles persistent memory storage, user pattern learning, and circadian
 * rhythm analysis for personalized AI responses.
 * 
 * Lines: 450
 * Documentation: docs/MEMORY_AND_LEARNING.md
 */

// File system and path utilities
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Internal utilities
import { createLogger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create component-specific logger
const logger = createLogger('memory-service');

/**
 * Your personal memory data
 */
export class UserMemory {
  constructor(userId) {
    this.userId = userId;
    this.preferences = {
      workHours: { start: 9, end: 17 },
      focusBlocks: ['morning-focus', 'afternoon-focus'],
      breakTimes: ['lunch-break', 'evening-wrapup'],
      noMeetingTimes: ['evening-personal', 'night-rest'],
      preferredMeetingDuration: 30,
      emailCheckFrequency: 15,
      notificationPreferences: {
        urgent: true,
        meetings: true,
        emails: false,
        todos: true
      }
    };
    
    this.patterns = {
      timeBlocks: {},
      interactions: [],
      productivity: {
        bestWorkHours: [],
        commonDistractions: [],
        focusDuration: 25 // minutes
      }
    };
    
    this.learnedBehaviors = {
      meetingPreferences: {},
      emailHandling: {},
      taskPrioritization: {},
      communicationStyle: {}
    };
    
    this.timestamp = new Date();
  }
}

/**
 * Manages S.I.R.I.U.S.'s memory system
 */
export class MemoryService {
  constructor() {
    this.memoryDir = path.join(__dirname, '../../data/memory');
    this.ensureMemoryDir();
  }

  /**
   * Make sure the memory directory exists
   */
  async ensureMemoryDir() {
    try {
      await fs.mkdir(this.memoryDir, { recursive: true });
    } catch (error) {
      logger.error({ err: error }, 'Error creating memory directory');
    }
  }

  /**
   * Get your memory file path
   * @param {string} userId - Who you are
   * @returns {string} - Path to your memory file
   */
  getMemoryPath(userId) {
    return path.join(this.memoryDir, `${userId}.json`);
  }

  /**
   * Load your memory from storage
   * @param {string} userId - Who you are
   * @returns {Promise<UserMemory>} - Your memory
   */
  async loadMemory(userId) {
    try {
      const memoryPath = this.getMemoryPath(userId);
      const data = await fs.readFile(memoryPath, 'utf8');
      const memoryData = JSON.parse(data);
      
      const memory = new UserMemory(userId);
      Object.assign(memory, memoryData);
      
      logger.debug({ userId }, 'Memory loaded successfully');
      return memory;
    } catch (error) {
      // If no memory exists, create a new one
      logger.info({ userId }, 'Creating new memory for user');
      return new UserMemory(userId);
    }
  }

  /**
   * Save your memory to storage
   * @param {UserMemory} memory - Your memory to save
   * @returns {Promise<boolean>} - Success status
   */
  async saveMemory(memory) {
    try {
      const memoryPath = this.getMemoryPath(memory.userId);
      memory.timestamp = new Date();
      
      await fs.writeFile(memoryPath, JSON.stringify(memory, null, 2));
      logger.debug({ userId: memory.userId }, 'Memory saved successfully');
      return true;
    } catch (error) {
      logger.error({ err: error, userId: memory.userId }, 'Error saving memory');
      return false;
    }
  }

  /**
   * Store memory data - alias for saveMemory
   * @param {UserMemory} memory - Memory data to store
   * @returns {Promise<boolean>} - Success status
   */
  async storeMemory(memory) {
    return this.saveMemory(memory);
  }

  /**
   * Learn from a new interaction
   * @param {string} userId - Who you are
   * @param {Object} interaction - What happened
   * @returns {Promise<boolean>} - Success status
   */
  async learnFromInteraction(userId, interaction) {
    try {
      const memory = await this.loadMemory(userId);
      
      // Add the interaction
      memory.patterns.interactions.push({
        ...interaction,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 interactions
      if (memory.patterns.interactions.length > 1000) {
        memory.patterns.interactions = memory.patterns.interactions.slice(-1000);
      }
      
      // Learn patterns
      this.learnPatterns(memory);
      
      // Save updated memory
      logger.info({ userId, interactionType: interaction.type }, 'Learned from interaction');
      return await this.saveMemory(memory);
    } catch (error) {
      logger.error({ err: error, userId }, 'Error learning from interaction');
      return false;
    }
  }

  /**
   * Learn patterns from interactions using advanced ML algorithms
   * @param {UserMemory} memory - Memory to update
   */
  learnPatterns(memory) {
    try {
      const interactions = memory.patterns.interactions;
      if (interactions.length < 3) return; // Need minimum data for pattern learning
      
      // 1. Time-based Pattern Learning
      this.learnTimePatterns(memory, interactions);
      
      // 2. Behavioral Pattern Learning
      this.learnBehavioralPatterns(memory, interactions);
      
      // 3. Success Pattern Learning
      this.learnSuccessPatterns(memory, interactions);
      
      // 4. Context Pattern Learning
      this.learnContextPatterns(memory, interactions);
      
      // 5. Predictive Pattern Learning
      this.learnPredictivePatterns(memory, interactions);
      
      logger.debug({ userId: memory.userId }, 'Advanced pattern learning completed');
    } catch (error) {
      logger.error({ err: error, userId: memory.userId }, 'Error in pattern learning');
    }
  }

  /**
   * Learn time-based patterns (circadian rhythms, work patterns)
   * @param {UserMemory} memory - Memory object
   * @param {Array} interactions - User interactions
   */
  learnTimePatterns(memory, interactions) {
    const timeBlocks = {};
    const hours = {};
    const days = {};
    const weekdays = {};
    const circadianData = {
      morning: { count: 0, success: 0, performance: [] },
      afternoon: { count: 0, success: 0, performance: [] },
      evening: { count: 0, success: 0, performance: [] },
      night: { count: 0, success: 0, performance: [] }
    };
    
    interactions.forEach(interaction => {
      const timestamp = new Date(interaction.timestamp);
      const hour = timestamp.getHours();
      const day = timestamp.getDay();
      const timeBlock = interaction.timeBlock || 'unknown';
      const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
      
      // Aggregate time data
      timeBlocks[timeBlock] = (timeBlocks[timeBlock] || 0) + 1;
      hours[hour] = (hours[hour] || 0) + 1;
      days[day] = (days[day] || 0) + 1;
      weekdays[weekday] = (weekdays[weekday] || 0) + 1;
      
      // Categorize by circadian period
      let circadianPeriod = 'afternoon'; // default
      if (hour >= 5 && hour < 12) {
        circadianPeriod = 'morning';
      } else if (hour >= 12 && hour < 17) {
        circadianPeriod = 'afternoon';
      } else if (hour >= 17 && hour < 22) {
        circadianPeriod = 'evening';
      } else if (hour >= 22 || hour < 5) {
        circadianPeriod = 'night';
      }
      
      // Track circadian performance
      circadianData[circadianPeriod].count++;
      if (interaction.success === true) {
        circadianData[circadianPeriod].success++;
      }
      
      const performance = this.calculatePerformanceScore(interaction);
      circadianData[circadianPeriod].performance.push(performance);
    });
    
    // Calculate optimal times
    const optimalHour = Object.keys(hours).reduce((a, b) => hours[a] > hours[b] ? a : b);
    const optimalDay = Object.keys(days).reduce((a, b) => days[a] > days[b] ? a : b);
    const optimalTimeBlock = Object.keys(timeBlocks).reduce((a, b) => timeBlocks[a] > timeBlocks[b] ? a : b);
    const optimalWeekday = Object.keys(weekdays).reduce((a, b) => weekdays[a] > weekdays[b] ? a : b);
    
    // Analyze circadian rhythm patterns
    const circadianAnalysis = this.analyzeCircadianRhythm(circadianData, hours);
    
    // Store learned time patterns
    memory.patterns.timeBlocks = {
      ...memory.patterns.timeBlocks,
      optimalHour: parseInt(optimalHour),
      optimalDay: parseInt(optimalDay),
      optimalTimeBlock,
      optimalWeekday,
      hourDistribution: hours,
      dayDistribution: days,
      timeBlockDistribution: timeBlocks,
      weekdayDistribution: weekdays,
      circadianRhythm: circadianAnalysis
    };
  }

  /**
   * Learn behavioral patterns (focus, energy, urgency preferences)
   * @param {UserMemory} memory - Memory object
   * @param {Array} interactions - User interactions
   */
  learnBehavioralPatterns(memory, interactions) {
    const focusPatterns = {};
    const energyPatterns = {};
    const urgencyPatterns = {};
    const actionPatterns = {};
    
    interactions.forEach(interaction => {
      // Focus patterns
      if (interaction.focus) {
        focusPatterns[interaction.focus] = (focusPatterns[interaction.focus] || 0) + 1;
      }
      
      // Energy patterns
      if (interaction.energy) {
        energyPatterns[interaction.energy] = (energyPatterns[interaction.energy] || 0) + 1;
      }
      
      // Urgency patterns
      if (interaction.urgency) {
        urgencyPatterns[interaction.urgency] = (urgencyPatterns[interaction.urgency] || 0) + 1;
      }
      
      // Action patterns
      if (interaction.actions && Array.isArray(interaction.actions)) {
        interaction.actions.forEach(action => {
          const actionType = action.type || 'unknown';
          actionPatterns[actionType] = (actionPatterns[actionType] || 0) + 1;
        });
      }
    });
    
    // Calculate preferences with confidence scores
    const preferences = {
      preferredFocus: this.calculatePreference(focusPatterns),
      preferredEnergy: this.calculatePreference(energyPatterns),
      preferredUrgency: this.calculatePreference(urgencyPatterns),
      preferredActionType: this.calculatePreference(actionPatterns)
    };
    
    memory.patterns.behavioralPreferences = preferences;
  }

  /**
   * Learn success patterns and failure analysis
   * @param {UserMemory} memory - Memory object
   * @param {Array} interactions - User interactions
   */
  learnSuccessPatterns(memory, interactions) {
    const operationStats = {};
    const successFactors = {};
    
    interactions.forEach(interaction => {
      if (interaction.type === 'jira_operation' || interaction.type === 'autonomous_action') {
        const operation = interaction.operation || interaction.actionType || 'unknown';
        const success = interaction.success === true;
        
        if (!operationStats[operation]) {
          operationStats[operation] = { success: 0, total: 0, contexts: [] };
        }
        
        operationStats[operation].total++;
        if (success) {
          operationStats[operation].success++;
        }
        
        // Analyze success factors
        const context = {
          timeBlock: interaction.timeBlock,
          focus: interaction.focus,
          energy: interaction.energy,
          urgency: interaction.urgency,
          success
        };
        operationStats[operation].contexts.push(context);
      }
    });
    
    // Calculate success rates and identify success factors
    Object.keys(operationStats).forEach(operation => {
      const stats = operationStats[operation];
      const successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
      
      // Analyze what contexts lead to success
      const successContexts = stats.contexts.filter(c => c.success);
      const failureContexts = stats.contexts.filter(c => !c.success);
      
      successFactors[operation] = {
        successRate,
        totalAttempts: stats.total,
        successCount: stats.success,
        optimalContexts: this.analyzeOptimalContexts(successContexts),
        failureContexts: this.analyzeFailureContexts(failureContexts)
      };
    });
    
    memory.patterns.successPatterns = successFactors;
  }

  /**
   * Learn context patterns (environmental factors affecting performance)
   * @param {UserMemory} memory - Memory object
   * @param {Array} interactions - User interactions
   */
  learnContextPatterns(memory, interactions) {
    const contextCombinations = {};
    const performanceMetrics = {};
    
    interactions.forEach(interaction => {
      const context = {
        timeBlock: interaction.timeBlock,
        focus: interaction.focus,
        energy: interaction.energy,
        urgency: interaction.urgency
      };
      
      const contextKey = JSON.stringify(context);
      if (!contextCombinations[contextKey]) {
        contextCombinations[contextKey] = { count: 0, success: 0, performance: [] };
      }
      
      contextCombinations[contextKey].count++;
      if (interaction.success === true) {
        contextCombinations[contextKey].success++;
      }
      
      // Calculate performance score (placeholder for more sophisticated metrics)
      const performance = this.calculatePerformanceScore(interaction);
      contextCombinations[contextKey].performance.push(performance);
    });
    
    // Identify optimal context combinations
    const optimalContexts = Object.entries(contextCombinations)
      .filter(([, data]) => data.count >= 2) // Minimum sample size
      .map(([context, data]) => ({
        context: JSON.parse(context),
        successRate: (data.success / data.count) * 100,
        avgPerformance: data.performance.reduce((a, b) => a + b, 0) / data.performance.length,
        frequency: data.count
      }))
      .sort((a, b) => b.avgPerformance - a.avgPerformance)
      .slice(0, 5); // Top 5 optimal contexts
    
    memory.patterns.optimalContexts = optimalContexts;
  }

  /**
   * Learn predictive patterns for future behavior prediction
   * @param {UserMemory} memory - Memory object
   * @param {Array} interactions - User interactions
   */
  learnPredictivePatterns(memory, interactions) {
    if (interactions.length < 10) return; // Need sufficient data
    
    const sequences = [];
    const predictions = {};
    
    // Extract action sequences
    for (let i = 0; i < interactions.length - 1; i++) {
      const current = interactions[i];
      const next = interactions[i + 1];
      
      const sequence = {
        current: {
          timeBlock: current.timeBlock,
          focus: current.focus,
          energy: current.energy,
          urgency: current.urgency,
          actionType: current.type
        },
        next: {
          timeBlock: next.timeBlock,
          focus: next.focus,
          energy: next.energy,
          urgency: next.urgency,
          actionType: next.type
        }
      };
      
      sequences.push(sequence);
    }
    
    // Build transition matrix
    const transitions = {};
    sequences.forEach(seq => {
      const currentKey = JSON.stringify(seq.current);
      const nextKey = JSON.stringify(seq.next);
      
      if (!transitions[currentKey]) {
        transitions[currentKey] = {};
      }
      
      if (!transitions[currentKey][nextKey]) {
        transitions[currentKey][nextKey] = 0;
      }
      
      transitions[currentKey][nextKey]++;
    });
    
    // Calculate transition probabilities
    Object.keys(transitions).forEach(currentState => {
      const total = Object.values(transitions[currentState]).reduce((a, b) => a + b, 0);
      Object.keys(transitions[currentState]).forEach(nextState => {
        transitions[currentState][nextState] = transitions[currentState][nextState] / total;
      });
    });
    
    memory.patterns.predictivePatterns = {
      transitionMatrix: transitions,
      sequenceCount: sequences.length,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate preference with confidence score
   * @param {Object} patterns - Pattern distribution
   * @returns {Object} - Preference with confidence
   */
  calculatePreference(patterns) {
    const total = Object.values(patterns).reduce((a, b) => a + b, 0);
    if (total === 0) return { value: 'unknown', confidence: 0 };
    
    const entries = Object.entries(patterns);
    const maxEntry = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    const confidence = maxEntry[1] / total;
    
    return {
      value: maxEntry[0],
      confidence: confidence,
      distribution: patterns
    };
  }

  /**
   * Analyze optimal contexts for success
   * @param {Array} successContexts - Successful interaction contexts
   * @returns {Object} - Optimal context analysis
   */
  analyzeOptimalContexts(successContexts) {
    if (successContexts.length === 0) return {};
    
    const analysis = {
      timeBlocks: {},
      focusModes: {},
      energyLevels: {},
      urgencyLevels: {}
    };
    
    successContexts.forEach(context => {
      if (context.timeBlock) analysis.timeBlocks[context.timeBlock] = (analysis.timeBlocks[context.timeBlock] || 0) + 1;
      if (context.focus) analysis.focusModes[context.focus] = (analysis.focusModes[context.focus] || 0) + 1;
      if (context.energy) analysis.energyLevels[context.energy] = (analysis.energyLevels[context.energy] || 0) + 1;
      if (context.urgency) analysis.urgencyLevels[context.urgency] = (analysis.urgencyLevels[context.urgency] || 0) + 1;
    });
    
    return analysis;
  }

  /**
   * Analyze failure contexts
   * @param {Array} failureContexts - Failed interaction contexts
   * @returns {Object} - Failure context analysis
   */
  analyzeFailureContexts(failureContexts) {
    return this.analyzeOptimalContexts(failureContexts); // Same analysis for failures
  }

  /**
   * Analyze circadian rhythm patterns
   * @param {Object} circadianData - Circadian period data
   * @param {Object} hours - Hour distribution
   * @returns {Object} - Circadian rhythm analysis
   */
  analyzeCircadianRhythm(circadianData, hours) {
    const analysis = {
      type: 'unknown',
      confidence: 0,
      periods: {},
      peakHours: [],
      recommendations: []
    };
    
    // Calculate performance metrics for each period
    Object.keys(circadianData).forEach(period => {
      const data = circadianData[period];
      if (data.count > 0) {
        const successRate = (data.success / data.count) * 100;
        const avgPerformance = data.performance.reduce((a, b) => a + b, 0) / data.performance.length;
        
        analysis.periods[period] = {
          count: data.count,
          successRate,
          avgPerformance,
          frequency: data.count
        };
      }
    });
    
    // Determine circadian type
    const periodScores = {};
    Object.keys(analysis.periods).forEach(period => {
      const data = analysis.periods[period];
      periodScores[period] = (data.successRate * 0.4) + (data.avgPerformance * 0.4) + (data.frequency * 0.2);
    });
    
    // Find the best performing period
    const bestPeriod = Object.keys(periodScores).reduce((a, b) => 
      periodScores[a] > periodScores[b] ? a : b
    );
    
    // Determine circadian type based on best period and performance patterns
    const totalInteractions = Object.values(analysis.periods).reduce((sum, p) => sum + p.count, 0);
    
    if (totalInteractions < 3) {
      analysis.type = 'insufficient_data';
      analysis.confidence = 0;
    } else {
      // Calculate relative performance between periods
      const morningScore = periodScores['morning'] || 0;
      const afternoonScore = periodScores['afternoon'] || 0;
      const eveningScore = periodScores['evening'] || 0;
      const nightScore = periodScores['night'] || 0;
      
      const maxScore = Math.max(morningScore, afternoonScore, eveningScore, nightScore);
      const minScore = Math.min(morningScore, afternoonScore, eveningScore, nightScore);
      const scoreRange = maxScore - minScore;
      
      // Need significant difference to classify
      if (scoreRange < 10) {
        analysis.type = 'balanced';
        analysis.confidence = maxScore / 100;
      } else if (bestPeriod === 'morning' && morningScore > eveningScore + 5) {
        analysis.type = 'morning_person';
        analysis.confidence = morningScore / 100;
      } else if (bestPeriod === 'evening' && eveningScore > morningScore + 5) {
        analysis.type = 'evening_person';
        analysis.confidence = eveningScore / 100;
      } else if (bestPeriod === 'night' && nightScore > eveningScore + 5) {
        analysis.type = 'night_owl';
        analysis.confidence = nightScore / 100;
      } else if (bestPeriod === 'afternoon') {
        analysis.type = 'balanced';
        analysis.confidence = afternoonScore / 100;
      } else {
        analysis.type = 'balanced';
        analysis.confidence = maxScore / 100;
      }
    }
    
    // Find peak performance hours
    const hourScores = {};
    Object.keys(hours).forEach(hour => {
      const hourInt = parseInt(hour);
      let period = 'afternoon';
      if (hourInt >= 5 && hourInt < 12) period = 'morning';
      else if (hourInt >= 12 && hourInt < 17) period = 'afternoon';
      else if (hourInt >= 17 && hourInt < 22) period = 'evening';
      else if (hourInt >= 22 || hourInt < 5) period = 'night';
      
      const periodScore = periodScores[period] || 0;
      hourScores[hour] = hours[hour] * periodScore;
    });
    
    // Get top 3 peak hours
    analysis.peakHours = Object.entries(hourScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
    
    // Generate circadian-specific recommendations
    analysis.recommendations = this.generateCircadianRecommendations(analysis);
    
    return analysis;
  }

  /**
   * Generate circadian rhythm recommendations
   * @param {Object} analysis - Circadian rhythm analysis
   * @returns {Array} - Circadian recommendations
   */
  generateCircadianRecommendations(analysis) {
    const recommendations = [];
    
    switch (analysis.type) {
      case 'morning_person':
        recommendations.push({
          type: 'schedule_optimization',
          title: 'Morning Person Detected',
          description: 'You perform best in the morning. Schedule important tasks between 6-11 AM.',
          priority: 'high'
        });
        recommendations.push({
          type: 'energy_management',
          title: 'Morning Energy Strategy',
          description: 'Use your peak morning energy for complex tasks and creative work.',
          priority: 'medium'
        });
        break;
        
      case 'evening_person':
        recommendations.push({
          type: 'schedule_optimization',
          title: 'Evening Person Detected',
          description: 'You perform best in the evening. Schedule important tasks between 5-9 PM.',
          priority: 'high'
        });
        recommendations.push({
          type: 'energy_management',
          title: 'Evening Energy Strategy',
          description: 'Use your peak evening energy for focused work and problem-solving.',
          priority: 'medium'
        });
        break;
        
      case 'night_owl':
        recommendations.push({
          type: 'schedule_optimization',
          title: 'Night Owl Detected',
          description: 'You perform best late at night. Consider flexible scheduling for optimal productivity.',
          priority: 'high'
        });
        recommendations.push({
          type: 'health_consideration',
          title: 'Sleep Schedule Balance',
          description: 'While you work well at night, ensure adequate sleep for long-term health.',
          priority: 'medium'
        });
        break;
        
      case 'balanced':
        recommendations.push({
          type: 'schedule_optimization',
          title: 'Balanced Circadian Rhythm',
          description: 'You perform consistently throughout the day. Maintain regular work hours.',
          priority: 'medium'
        });
        break;
    }
    
    // Add peak hour recommendations
    if (analysis.peakHours.length > 0) {
      recommendations.push({
        type: 'peak_hours',
        title: 'Peak Performance Hours',
        description: `Your peak performance hours are: ${analysis.peakHours.map(h => `${h}:00`).join(', ')}`,
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate performance score for an interaction
   * @param {Object} interaction - User interaction
   * @returns {number} - Performance score (0-100)
   */
  calculatePerformanceScore(interaction) {
    let score = 50; // Base score
    
    // Success factor
    if (interaction.success === true) score += 30;
    else if (interaction.success === false) score -= 20;
    
    // Energy factor
    if (interaction.energy === 'high') score += 10;
    else if (interaction.energy === 'low') score -= 10;
    
    // Focus factor
    if (interaction.focus === 'deep-work') score += 10;
    else if (interaction.focus === 'meeting-prep') score += 5;
    
    // Urgency factor
    if (interaction.urgency === 'critical') score += 5;
    else if (interaction.urgency === 'low') score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get your learned preferences
   * @param {string} userId - Who you are
   * @returns {Promise<Object>} - Your preferences and patterns
   */
  async getPreferences(userId) {
    try {
      const memory = await this.loadMemory(userId);
      logger.debug({ userId }, 'Retrieved user preferences');
      return {
        preferences: memory.preferences,
        patterns: memory.patterns,
        learnedBehaviors: memory.learnedBehaviors,
        lastUpdated: memory.timestamp
      };
    } catch (error) {
      logger.error({ err: error, userId }, 'Error getting preferences');
      return null;
    }
  }

  /**
   * Remember a specific behavior or preference
   * @param {string} userId - Who you are
   * @param {string} category - What type of behavior
   * @param {string} key - Specific behavior
   * @param {any} value - What you prefer
   * @returns {Promise<boolean>} - Success status
   */
  async rememberBehavior(userId, category, key, value) {
    try {
      const memory = await this.loadMemory(userId);
      
      if (!memory.learnedBehaviors[category]) {
        memory.learnedBehaviors[category] = {};
      }
      
      memory.learnedBehaviors[category][key] = {
        value,
        timestamp: new Date().toISOString(),
        confidence: 1.0
      };
      
      logger.info({ userId, category, key }, 'Remembered new behavior');
      return await this.saveMemory(memory);
    } catch (error) {
      logger.error({ err: error, userId, category, key }, 'Error remembering behavior');
      return false;
    }
  }

  /**
   * Forget old or incorrect memories
   * @param {string} userId - Who you are
   * @param {number} daysOld - How old memories to forget
   * @returns {Promise<boolean>} - Success status
   */
  async forgetOldMemories(userId, daysOld = 90) {
    try {
      const memory = await this.loadMemory(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // Remove old interactions
      memory.patterns.interactions = memory.patterns.interactions.filter(
        interaction => new Date(interaction.timestamp) > cutoffDate
      );
      
      // Remove old learned behaviors
      Object.keys(memory.learnedBehaviors).forEach(category => {
        Object.keys(memory.learnedBehaviors[category]).forEach(key => {
          const behavior = memory.learnedBehaviors[category][key];
          if (new Date(behavior.timestamp) < cutoffDate) {
            delete memory.learnedBehaviors[category][key];
          }
        });
      });
      
      return await this.saveMemory(memory);
    } catch (error) {
      logger.error({ err: error, userId }, 'Error forgetting old memories');
      return false;
    }
  }
}

// Create a singleton instance
const memoryService = new MemoryService();

export default memoryService; 