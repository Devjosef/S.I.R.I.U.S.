/**
 * Autonomous Action Engine - ML-Based Decision Making
 * 
 * Handles autonomous actions, trigger management, and machine learning
 * based decision making for automated tasks.
 * 
 * Lines: 380
 */

// Core services
import contextEngine from './contextEngine.js';
import memoryService from './memoryService.js';
import { generateIntelligentSummary } from './ollamaService.js';
import workerManager from '../utils/workerManager.js';
import { RLVRService } from './rlvrService.js';

/**
 * Different types of actions S.I.R.I.U.S. can take
 */
export const ActionTypes = {
  CALENDAR: 'calendar',
  EMAIL: 'email',
  TODO: 'todo',
  NOTIFICATION: 'notification',
  PRODUCTIVITY: 'productivity',
  WELLNESS: 'wellness',
  COMMUNICATION: 'communication'
};

/**
 * Priority levels for actions
 */
export const ActionPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * A smart trigger that can activate autonomous actions
 */
export class SmartTrigger {
  constructor(condition, action, priority = ActionPriority.MEDIUM) {
    this.id = `trigger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.condition = condition;
    this.action = action;
    this.priority = priority;
    this.enabled = true;
    this.lastTriggered = null;
    this.triggerCount = 0;
    this.sensitivityMultiplier = 1.0; // ML learning parameter
    this.createdAt = new Date();
  }

  /**
   * Check if this trigger should fire
   * @param {Object} context - Current context
   * @returns {boolean} - Should trigger fire
   */
  shouldTrigger(context) {
    if (!this.enabled) return false;
    
    // Check cooldown (don't trigger too frequently)
    if (this.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - this.lastTriggered.getTime();
      const cooldownMs = this.getAdjustedCooldownMs(); // Use ML-adjusted cooldown
      if (timeSinceLastTrigger < cooldownMs) return false;
    }
    
    return this.condition.evaluate(context);
  }

  /**
   * Get cooldown time based on priority
   * @returns {number} - Cooldown in milliseconds
   */
  getCooldownMs() {
    switch (this.priority) {
      case ActionPriority.CRITICAL: return 0; // No cooldown for critical
      case ActionPriority.HIGH: return 5 * 60 * 1000; // 5 minutes
      case ActionPriority.MEDIUM: return 15 * 60 * 1000; // 15 minutes
      case ActionPriority.LOW: return 60 * 60 * 1000; // 1 hour
      default: return 15 * 60 * 1000;
    }
  }

  /**
   * Mark this trigger as fired
   */
  markTriggered() {
    this.lastTriggered = new Date();
    this.triggerCount++;
  }

  /**
   * Adjust trigger sensitivity based on ML learning
   * @param {number} multiplier - Sensitivity multiplier (0.5 = 50% less sensitive, 2.0 = 200% more sensitive)
   */
  adjustSensitivity(multiplier) {
    this.sensitivityMultiplier = Math.max(0.1, Math.min(5.0, multiplier)); // Clamp between 0.1 and 5.0
    console.log(`🔧 Adjusted trigger sensitivity for ${this.action.title}: ${this.sensitivityMultiplier}x`);
  }

  /**
   * Get adjusted cooldown time based on sensitivity
   * @returns {number} - Adjusted cooldown in milliseconds
   */
  getAdjustedCooldownMs() {
    const baseCooldown = this.getCooldownMs();
    return Math.floor(baseCooldown / this.sensitivityMultiplier);
  }
}

/**
 * An autonomous action that can be executed
 */
export class AutonomousAction {
  constructor(type, title, description, executeFn, options = {}) {
    this.id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.title = title;
    this.description = description;
    this.executeFn = executeFn;
    this.options = {
      requiresConfirmation: false,
      canBeUndone: true,
      timeoutMs: 30000, // 30 seconds
      retryCount: 3,
      ...options
    };
    this.createdAt = new Date();
  }

  /**
   * Execute this action
   * @param {Object} context - Current context
   * @param {string} userId - User ID
   * @returns {Promise<ActionResult>} - Result of the action
   */
  async execute(context, userId) {
    try {
      const startTime = Date.now();
      const result = await this.executeFn(context, userId);
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        actionId: this.id,
        actionType: this.type,
        title: this.title,
        result,
        duration,
        timestamp: new Date(),
        context: {
          urgency: context.urgency,
          focus: context.focus,
          energy: context.energy
        }
      };
    } catch (error) {
      return {
        success: false,
        actionId: this.id,
        actionType: this.type,
        title: this.title,
        error: error.message,
        timestamp: new Date(),
        context: {
          urgency: context.urgency,
          focus: context.focus,
          energy: context.energy
        }
      };
    }
  }
}

/**
 * Result of an autonomous action
 */
export class ActionResult {
  constructor(success, data, error = null) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.timestamp = new Date();
  }
}

/**
 * Fallback function for context analysis when worker is not available
 * @param {Object} data - Worker data
 * @returns {Promise<Object>} - Context analysis result
 */
const contextAnalysisFallback = async (data) => {
  const { userId } = data;
  return contextEngine.analyzeContext(userId);
};

// Register context analysis fallback
workerManager.registerFallback('context', contextAnalysisFallback);

/**
 * Fallback function for action execution when worker is not available
 * @param {Object} data - Worker data
 * @returns {Promise<Object>} - Action execution result
 */
const actionExecutionFallback = async (data) => {
  const { action: actionData, context, userId } = data;
  try {
    const action = JSON.parse(actionData);
    return await action.execute(context, userId);
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

// Register action execution fallback
workerManager.registerFallback('action', actionExecutionFallback);

/**
 * The main autonomous action engine
 */
export class AutonomousActionEngine {
  constructor() {
    this.triggers = new Map();
    this.actions = new Map();
    this.actionHistory = [];
    this.isRunning = false;
    this.checkInterval = 60000; // Check every minute
    this.checkTimer = null;
    
    // Work time tracking for neuroscience triggers
    this.workStartTimes = new Map();
    this.lastBreakTimes = new Map();
    this.circadianData = new Map();
  }

  /**
   * Start the autonomous action engine
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.checkTimer = setInterval(() => {
      this.checkTriggers();
    }, this.checkInterval);
    
    console.log('🚀 Autonomous Action Engine started');
  }

  /**
   * Stop the autonomous action engine
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    
    console.log('🛑 Autonomous Action Engine stopped');
  }

  /**
   * Add a smart trigger
   * @param {SmartTrigger} trigger - The trigger to add
   */
  addTrigger(trigger) {
    this.triggers.set(trigger.id, trigger);
    console.log(`➕ Added trigger: ${trigger.action.title}`);
  }

  /**
   * Remove a smart trigger
   * @param {string} triggerId - ID of the trigger to remove
   */
  removeTrigger(triggerId) {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      this.triggers.delete(triggerId);
      console.log(`➖ Removed trigger: ${trigger.action.title}`);
    }
  }

  /**
   * Add an autonomous action
   * @param {AutonomousAction} action - The action to add
   */
  addAction(action) {
    this.actions.set(action.id, action);
    console.log(`➕ Added action: ${action.title}`);
  }

  /**
   * Check all triggers and execute actions if needed
   */
  async checkTriggers() {
    if (!this.isRunning) return;
    
    try {
      // Get current context for all users (in a real app, you'd track active users)
      const userId = 'default-user'; // For now, use default user
      
      // Use worker thread for context analysis to avoid blocking the main thread
      let context;
      try {
        context = await workerManager.runInWorker('context', { userId }, contextAnalysisFallback);
      } catch (error) {
        console.warn('Context worker failed, using fallback:', error.message);
        // Fall back to direct context analysis if worker fails
        context = await contextEngine.analyzeContext(userId);
      }
      
      // Check each trigger
      for (const trigger of this.triggers.values()) {
        if (trigger.shouldTrigger(context)) {
          console.log(`🔔 Trigger activated: ${trigger.action.title}`);
          
          // Mark as triggered before execution to prevent duplicate triggers
          trigger.markTriggered();
          
          // Execute the action
          const result = await this.executeAction(trigger.action, context, userId);
          
          // Store in history
          this.actionHistory.unshift(result);
          
          // Learn from the action result
          await this.learnFromAction(result, context, userId);
        }
      }
      
      // Trim history to last 100 actions
      if (this.actionHistory.length > 100) {
        this.actionHistory = this.actionHistory.slice(0, 100);
      }
    } catch (error) {
      console.error('Error checking triggers:', error);
    }
  }

  /**
   * Execute an action with proper error handling and timeout
   * @param {AutonomousAction} action - Action to execute
   * @param {Object} context - Current context
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Action result
   */
  async executeAction(action, context, userId) {
    console.log(`▶️ Executing action: ${action.title}`);
    
    try {
      // Use worker thread for CPU-intensive actions
      if (action.type === ActionTypes.PRODUCTIVITY || action.type === ActionTypes.COMMUNICATION) {
        return await workerManager.runInWorker(
          'action', 
          { 
            action: JSON.stringify(action),
            context,
            userId
          },
          actionExecutionFallback
        );
      } else {
        // For simpler actions, execute directly
        return await action.execute(context, userId);
      }
    } catch (error) {
      console.error(`❌ Action failed: ${action.title}`, error);
      return {
        success: false,
        actionId: action.id,
        actionType: action.type,
        title: action.title,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Learn from action execution results with RLVR
   * @param {ActionResult} result - Action result
   * @param {Object} context - Context when action was executed
   * @param {string} userId - User ID
   */
  async learnFromAction(result, context, userId) {
    try {
      // Skip learning from failed actions
      if (!result.success) return;
      
      // Store the action result in memory for learning
      await memoryService.rememberBehavior(userId, 'action_history', result.actionId, {
        actionId: result.actionId,
        actionType: result.actionType,
        title: result.title,
        success: result.success,
        timestamp: result.timestamp,
        context: {
          urgency: context.urgency,
          focus: context.focus,
          energy: context.energy
        }
      });
      
      // RLVR Learning: Learn from visual feedback
      try {
        const visualState = RLVRService.createVisualState(context, {
          activeComponents: ['autonomous-action'],
          userFocus: context.focus,
          taskQueue: [],
          notifications: [],
          currentAction: result.actionType
        });
        
        const userFeedback = {
          positive: result.success,
          helpful: result.success && !result.error,
          efficient: result.executionTime < (result.expectedTime || 5000),
          neutral: !result.success && !result.error
        };
        
        await RLVRService.learnFromVisualFeedback(
          visualState,
          {
            type: result.actionType,
            title: result.title,
            executionTime: result.executionTime,
            expectedTime: result.expectedTime || 5000
          },
          userFeedback
        );
        
        console.log(`🧠 RLVR learning completed for: ${result.title}`);
        
      } catch (rlvrError) {
        console.warn(`⚠️ RLVR learning failed for ${result.title}:`, rlvrError.message);
      }
      
      // Machine learning: Analyze patterns to improve trigger conditions
      await this.analyzeActionPatterns(userId, result, context);
    } catch (error) {
      console.error('Error learning from action:', error);
    }
  }

  /**
   * Analyze action patterns to improve trigger conditions
   * @param {string} userId - User ID
   * @param {Object} result - Action result
   * @param {Object} context - Context when action was executed
   */
  async analyzeActionPatterns(userId, result, context) {
    try {
      // Get recent action history for pattern analysis
      const recentActions = this.actionHistory.slice(0, 20);
      const similarActions = recentActions.filter(action => 
        action.actionType === result.actionType && 
        action.success === result.success
      );

      if (similarActions.length >= 3) {
        // Analyze successful patterns
        const successPatterns = similarActions.filter(action => action.success);
        const failurePatterns = similarActions.filter(action => !action.success);

        if (successPatterns.length > failurePatterns.length) {
          // This action type is generally successful in this context
          await this.optimizeTriggerConditions(userId, result.actionType, context, true);
        } else {
          // This action type often fails in this context
          await this.optimizeTriggerConditions(userId, result.actionType, context, false);
        }
      }
    } catch (error) {
      console.error('Error analyzing action patterns:', error);
    }
  }

  /**
   * Optimize trigger conditions based on success/failure patterns
   * @param {string} userId - User ID
   * @param {string} actionType - Type of action
   * @param {Object} context - Context when action was executed
   * @param {boolean} wasSuccessful - Whether the action was successful
   */
  async optimizeTriggerConditions(userId, actionType, context, wasSuccessful) {
    try {
      // Store optimization data in memory
      await memoryService.rememberBehavior(userId, 'trigger_optimization', `${actionType}_${Date.now()}`, {
        actionType,
        context: {
          urgency: context.urgency,
          focus: context.focus,
          energy: context.energy,
          timeOfDay: new Date().getHours(),
          dayOfWeek: new Date().getDay()
        },
        wasSuccessful,
        timestamp: new Date().toISOString()
      });

      // Adjust trigger sensitivity based on success patterns
      const triggers = Array.from(this.triggers.values())
        .filter(trigger => trigger.action.type === actionType);

      triggers.forEach(trigger => {
        if (wasSuccessful) {
          // Increase sensitivity for successful patterns
          trigger.adjustSensitivity(1.1); // 10% more sensitive
        } else {
          // Decrease sensitivity for failure patterns
          trigger.adjustSensitivity(0.9); // 10% less sensitive
        }
      });
    } catch (error) {
      console.error('Error optimizing trigger conditions:', error);
    }
  }

  /**
   * Get recent action history
   * @param {number} limit - Max number of actions to return
   * @returns {Array} - Recent actions
   */
  getActionHistory(limit = 20) {
    return this.actionHistory.slice(0, limit);
  }

  /**
   * Get statistics about triggers
   * @returns {Object} - Trigger stats
   */
  getTriggerStats() {
    const stats = {
      total: this.triggers.size,
      enabled: 0,
      disabled: 0,
      byPriority: {
        [ActionPriority.LOW]: 0,
        [ActionPriority.MEDIUM]: 0,
        [ActionPriority.HIGH]: 0,
        [ActionPriority.CRITICAL]: 0
      },
      byType: {}
    };
    
    for (const trigger of this.triggers.values()) {
      // Count enabled/disabled
      if (trigger.enabled) {
        stats.enabled++;
      } else {
        stats.disabled++;
      }
      
      // Count by priority
      stats.byPriority[trigger.priority]++;
      
      // Count by action type
      const type = trigger.action.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }
    
    return stats;
  }

  /**
   * Create neuroscience-backed default triggers
   */
  createDefaultTriggers() {
    // 1. 4-Hour Neuroscience Hard Stop (Maximum effective work period)
    const fourHourStopCondition = {
      evaluate: (context) => {
        const userId = context.userId;
        const now = new Date();
        const workStartTime = this.getWorkStartTime(userId);
        if (!workStartTime) return false;
        
        const workDuration = now - workStartTime;
        const fourHoursMs = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
        
        return workDuration >= fourHoursMs;
      }
    };
    
    const fourHourStopAction = new AutonomousAction(
      ActionTypes.WELLNESS,
      'Neuroscience 4-Hour Stop',
      'You\'ve reached the maximum effective 4-hour work period. Time for a significant break.',
      async (context, userId) => {
        this.resetWorkStartTime(userId);
        return {
          message: '4-hour neuroscience limit reached. Take a significant break.',
          actions: [
            'Step away from work completely',
            'Go for a walk or exercise',
            'Have a proper meal',
            'Rest your brain for at least 1 hour',
            'Consider switching to non-cognitive tasks'
          ],
          neuroscience: {
            reason: 'Maximum effective cognitive work period reached',
            recommendation: 'Significant break required for brain recovery',
            duration: 'Minimum 1 hour break recommended'
          }
        };
      }
    );
    
    const fourHourStopTrigger = new SmartTrigger(
      fourHourStopCondition,
      fourHourStopAction,
      ActionPriority.CRITICAL
    );
    
    // 2. 25-Minute Pomodoro with Energy Boost Break
    const pomodoroCondition = {
      evaluate: (context) => {
        const userId = context.userId;
        const now = new Date();
        const lastBreak = this.getLastBreakTime(userId);
        if (!lastBreak) return false;
        
        const timeSinceBreak = now - lastBreak;
        const pomodoroMs = 25 * 60 * 1000; // 25 minutes
        
        return timeSinceBreak >= pomodoroMs;
      }
    };
    
    const pomodoroAction = new AutonomousAction(
      ActionTypes.WELLNESS,
      'Pomodoro Energy Boost Break',
      'Take a 5-minute energy boost break after 25 minutes of focused work',
      async (context, userId) => {
        this.setLastBreakTime(userId);
        return {
          message: 'Pomodoro break time! Boost your energy.',
          actions: [
            'Stand up and stretch',
            'Get a glass of water',
            'Take 5 deep breaths',
            'Look away from screen for 20 seconds',
            'Do a quick 2-minute walk'
          ],
          pomodoro: {
            workDuration: '25 minutes completed',
            breakDuration: '5 minutes',
            nextSession: 'Ready for next 25-minute focus block'
          }
        };
      }
    );
    
    const pomodoroTrigger = new SmartTrigger(
      pomodoroCondition,
      pomodoroAction,
      ActionPriority.MEDIUM
    );
    
    // 3. Smart Critical Task Detection (Email/Communication based)
    const criticalTaskCondition = {
      evaluate: (context) => {
        // Check for explicit urgency indicators in communications
        const urgentEmails = context.context?.emails?.filter(email => 
          email.subject?.toLowerCase().includes('urgent') ||
          email.subject?.toLowerCase().includes('asap') ||
          email.subject?.toLowerCase().includes('emergency') ||
          email.subject?.toLowerCase().includes('critical') ||
          email.priority === 'high' ||
          email.priority === 'urgent'
        ) || [];
        
        const urgentMessages = context.context?.messages?.filter(msg => 
          msg.content?.toLowerCase().includes('urgent') ||
          msg.content?.toLowerCase().includes('asap') ||
          msg.content?.toLowerCase().includes('emergency') ||
          msg.content?.toLowerCase().includes('critical')
        ) || [];
        
        return urgentEmails.length > 0 || urgentMessages.length > 0;
      }
    };
    
    const criticalTaskAction = new AutonomousAction(
      ActionTypes.NOTIFICATION,
      'Explicit Urgency Alert',
      'Critical communication detected requiring immediate attention',
      async (context, userId) => {
        const urgentItems = [];
        
        // Collect urgent emails
        const urgentEmails = context.context?.emails?.filter(email => 
          email.subject?.toLowerCase().includes('urgent') ||
          email.subject?.toLowerCase().includes('asap') ||
          email.subject?.toLowerCase().includes('emergency') ||
          email.subject?.toLowerCase().includes('critical')
        ) || [];
        
        urgentEmails.forEach(email => {
          urgentItems.push(`📧 ${email.subject} (${email.from})`);
        });
        
        return {
          message: 'Explicit urgency detected in communications',
          urgentItems,
          actions: [
            'Review urgent communications immediately',
            'Prioritize response to urgent items',
            'Consider escalation if needed',
            'Update stakeholders on status'
          ],
          urgency: {
            source: 'Explicit communication indicators',
            confidence: 'High (explicit keywords detected)',
            recommendedAction: 'Immediate review required'
          }
        };
      }
    );
    
    const criticalTaskTrigger = new SmartTrigger(
      criticalTaskCondition,
      criticalTaskAction,
      ActionPriority.HIGH
    );
    
    // 4. Circadian Rhythm-Based Work Pattern Analysis
    const circadianAnalysisCondition = {
      evaluate: (context) => {
        // Analyze work patterns every hour to detect optimal times
        const now = new Date();
        const hour = now.getHours();
        
        // Only analyze during typical work hours
        return hour >= 6 && hour <= 22;
      }
    };
    
    const circadianAnalysisAction = new AutonomousAction(
      ActionTypes.PRODUCTIVITY,
      'Circadian Rhythm Analysis',
      'Analyze your work patterns to optimize productivity timing',
      async (context, userId) => {
        const workPatterns = await this.analyzeCircadianWorkPatterns(userId);
        
        return {
          message: 'Circadian rhythm analysis completed',
          patterns: workPatterns,
          recommendations: this.generateCircadianRecommendations(workPatterns),
          circadian: {
            analysis: 'Based on 24-24.2 hour human rhythm',
            timezone: 'Adapted to your local timezone',
            confidence: workPatterns.confidence
          }
        };
      }
    );
    
    const circadianAnalysisTrigger = new SmartTrigger(
      circadianAnalysisCondition,
      circadianAnalysisAction,
      ActionPriority.LOW
    );
    
    // Add all triggers
    this.addTrigger(fourHourStopTrigger);
    this.addTrigger(pomodoroTrigger);
    this.addTrigger(criticalTaskTrigger);
    this.addTrigger(circadianAnalysisTrigger);
    
    console.log('🧠 Neuroscience-backed triggers created');
  }

  /**
   * Work time tracking methods for neuroscience triggers
   */
  getWorkStartTime(userId) {
    return this.workStartTimes.get(userId);
  }

  setWorkStartTime(userId) {
    this.workStartTimes.set(userId, new Date());
  }

  resetWorkStartTime(userId) {
    this.workStartTimes.delete(userId);
  }

  getLastBreakTime(userId) {
    return this.lastBreakTimes.get(userId);
  }

  setLastBreakTime(userId) {
    this.lastBreakTimes.set(userId, new Date());
  }

  /**
   * Circadian rhythm analysis based on 24-24.2 hour human rhythm
   */
  async analyzeCircadianWorkPatterns(userId) {
    try {
      const memory = await memoryService.loadMemory(userId);
      const interactions = memory.patterns?.interactions || [];
      
      if (interactions.length < 10) {
        return {
          confidence: 'low',
          message: 'Insufficient data for circadian analysis'
        };
      }

      // Analyze work patterns by hour
      const hourlyWork = {};
      const hourlyProductivity = {};
      
      interactions.forEach(interaction => {
        const timestamp = new Date(interaction.timestamp);
        const hour = timestamp.getHours();
        
        if (!hourlyWork[hour]) {
          hourlyWork[hour] = 0;
          hourlyProductivity[hour] = [];
        }
        
        hourlyWork[hour]++;
        
        // Calculate productivity score
        const productivity = this.calculateProductivityScore(interaction);
        hourlyProductivity[hour].push(productivity);
      });

      // Find peak productivity hours
      const peakHours = Object.entries(hourlyProductivity)
        .map(([hour, scores]) => ({
          hour: parseInt(hour),
          avgProductivity: scores.reduce((a, b) => a + b, 0) / scores.length,
          workCount: hourlyWork[hour]
        }))
        .filter(item => item.workCount >= 3) // Minimum 3 interactions for confidence
        .sort((a, b) => b.avgProductivity - a.avgProductivity)
        .slice(0, 3);

      // Determine circadian type based on peak hours
      const circadianType = this.determineCircadianType(peakHours);
      
      // Get timezone-adjusted recommendations
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const recommendations = this.getTimezoneAdjustedRecommendations(peakHours, timezone);

      return {
        confidence: 'high',
        peakHours,
        circadianType,
        timezone,
        recommendations,
        totalInteractions: interactions.length,
        analysisPeriod: '24-24.2 hour human rhythm'
      };
    } catch (error) {
      console.error('Error analyzing circadian patterns:', error);
      return {
        confidence: 'error',
        message: 'Failed to analyze circadian patterns'
      };
    }
  }

  /**
   * Calculate productivity score for an interaction
   */
  calculateProductivityScore(interaction) {
    let score = 0.5; // Base score
    
    // Adjust based on success
    if (interaction.success === true) score += 0.3;
    if (interaction.success === false) score -= 0.2;
    
    // Adjust based on focus type
    if (interaction.focus === 'deep-work') score += 0.2;
    if (interaction.focus === 'meeting-prep') score += 0.1;
    if (interaction.focus === 'break') score -= 0.1;
    
    // Adjust based on energy
    if (interaction.energy === 'high') score += 0.1;
    if (interaction.energy === 'low') score -= 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determine circadian type based on peak hours
   */
  determineCircadianType(peakHours) {
    if (peakHours.length === 0) return 'unknown';
    
    const avgPeakHour = peakHours.reduce((sum, item) => sum + item.hour, 0) / peakHours.length;
    
    if (avgPeakHour >= 5 && avgPeakHour <= 11) return 'morning_person';
    if (avgPeakHour >= 12 && avgPeakHour <= 17) return 'afternoon_person';
    if (avgPeakHour >= 18 && avgPeakHour <= 22) return 'evening_person';
    if (avgPeakHour >= 23 || avgPeakHour <= 4) return 'night_owl';
    
    return 'balanced';
  }

  /**
   * Get timezone-adjusted recommendations
   */
  getTimezoneAdjustedRecommendations(peakHours, timezone) {
    const recommendations = [];
    
    if (peakHours.length > 0) {
      const bestHour = peakHours[0].hour;
      
      recommendations.push({
        type: 'optimal_work_time',
        title: 'Optimal Work Window',
        description: `Your peak productivity is around ${bestHour}:00`,
        priority: 'high'
      });
      
      recommendations.push({
        type: 'schedule_optimization',
        title: 'Schedule Important Tasks',
        description: `Schedule complex tasks during your peak hours: ${peakHours.map(p => p.hour + ':00').join(', ')}`,
        priority: 'medium'
      });
    }
    
    // Add general circadian recommendations
    recommendations.push({
      type: 'circadian_health',
      title: 'Circadian Health',
      description: 'Maintain consistent sleep/wake cycles for optimal 24-24.2 hour rhythm',
      priority: 'medium'
    });
    
    return recommendations;
  }

  /**
   * Generate circadian recommendations
   */
  generateCircadianRecommendations(workPatterns) {
    if (workPatterns.confidence === 'low') {
      return ['Continue using S.I.R.I.U.S. to gather more data for circadian analysis'];
    }
    
    return workPatterns.recommendations || [];
  }
}

// Create and export a singleton instance
const autonomousActionEngine = new AutonomousActionEngine();
export default autonomousActionEngine; 