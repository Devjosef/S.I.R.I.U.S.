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
   * Create default triggers for new users
   */
  createDefaultTriggers() {
    // Example: Create a meeting preparation trigger
    const meetingPrepCondition = {
      evaluate: (context) => {
        // Check if there's an upcoming meeting in the next 15 minutes
        return context.upcomingEvents && 
               context.upcomingEvents.some(event => 
                 event.type === 'meeting' && 
                 event.minutesUntilStart <= 15 && 
                 event.minutesUntilStart > 0
               );
      }
    };
    
    const meetingPrepAction = new AutonomousAction(
      ActionTypes.PRODUCTIVITY,
      'Meeting Preparation',
      'Prepare for your upcoming meeting with relevant documents and notes',
      async (context, userId) => {
        // Find the upcoming meeting
        const meeting = context.upcomingEvents.find(event => 
          event.type === 'meeting' && 
          event.minutesUntilStart <= 15 && 
          event.minutesUntilStart > 0
        );
        
        if (!meeting) return { message: 'No upcoming meeting found' };
        
        // In a real app, this would:
        // 1. Find relevant documents
        // 2. Prepare a summary
        // 3. Set up quick actions
        
        return {
          message: `Prepared for meeting: ${meeting.title}`,
          meeting: meeting.title,
          startsIn: `${meeting.minutesUntilStart} minutes`,
          documents: ['Last meeting notes', 'Related project files']
        };
      }
    );
    
    const meetingPrepTrigger = new SmartTrigger(
      meetingPrepCondition,
      meetingPrepAction,
      ActionPriority.HIGH
    );
    
    this.addTrigger(meetingPrepTrigger);
    
    // More default triggers would be added here
  }
}

// Create and export a singleton instance
const autonomousActionEngine = new AutonomousActionEngine();
export default autonomousActionEngine; 