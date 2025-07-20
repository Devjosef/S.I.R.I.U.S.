/**
 * Autonomous Action Controller - API Endpoints for Autonomous Actions
 * 
 * Handles HTTP requests for autonomous action execution and
 * ML-based decision making.
 * 
 * Lines: 140
 */

// Autonomous action engine integration
import autonomousActionEngine from '../services/autonomousActionEngine.js';

// Internal utilities
import logger from '../utils/logger.js';

/**
 * Start the autonomous action engine
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const startEngine = async (req, res, next) => {
  try {
    autonomousActionEngine.start();
    
    res.status(200).json({
      success: true,
      message: 'Autonomous action engine started successfully',
      data: {
        isRunning: autonomousActionEngine.isRunning,
        triggerCount: autonomousActionEngine.triggers.size,
        checkInterval: autonomousActionEngine.checkInterval
      }
    });
  } catch (error) {
    console.error('Error starting autonomous action engine:', error);
    next(error);
  }
};

/**
 * Stop the autonomous action engine
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const stopEngine = async (req, res, next) => {
  try {
    autonomousActionEngine.stop();
    
    res.status(200).json({
      success: true,
      message: 'Autonomous action engine stopped successfully',
      data: {
        isRunning: autonomousActionEngine.isRunning
      }
    });
  } catch (error) {
    console.error('Error stopping autonomous action engine:', error);
    next(error);
  }
};

/**
 * Get engine status and statistics
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getEngineStatus = async (req, res, next) => {
  try {
    const stats = autonomousActionEngine.getTriggerStats();
    const history = autonomousActionEngine.getActionHistory(10);
    
    res.status(200).json({
      success: true,
      message: 'Engine status retrieved successfully',
      data: {
        isRunning: autonomousActionEngine.isRunning,
        stats,
        recentActions: history,
        totalActions: autonomousActionEngine.actionHistory.length
      }
    });
  } catch (error) {
    console.error('Error getting engine status:', error);
    next(error);
  }
};

/**
 * Add a new smart trigger
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const addTrigger = async (req, res, next) => {
  try {
    const { condition, action, priority = ActionPriority.MEDIUM } = req.body;
    
    if (!condition || !action) {
      return res.status(400).json({
        success: false,
        error: 'Condition and action are required'
      });
    }

    // Create the autonomous action
    const autonomousAction = new AutonomousAction(
      action.type,
      action.title,
      action.description,
      async (context, userId) => {
        // This is a simplified version - in a real app, you'd have more sophisticated action execution
        return {
          message: action.description,
          actions: action.steps || [],
          context: {
            urgency: context.urgency,
            focus: context.focus,
            energy: context.energy
          }
        };
      },
      action.options || {}
    );

    // Create the smart trigger
    const trigger = new SmartTrigger(
      {
        evaluate: (context) => {
          // This is a simplified condition evaluator
          // In a real app, you'd have more sophisticated condition parsing
          if (condition.type === 'time_based') {
            const hour = new Date().getHours();
            return hour >= condition.startHour && hour <= condition.endHour;
          } else if (condition.type === 'context_based') {
            return context[condition.field] === condition.value;
          } else if (condition.type === 'urgency_based') {
            return context.urgency === condition.level;
          }
          return false;
        }
      },
      autonomousAction,
      priority
    );

    autonomousActionEngine.addTrigger(trigger);
    
    res.status(200).json({
      success: true,
      message: 'Smart trigger added successfully',
      data: {
        triggerId: trigger.id,
        actionId: autonomousAction.id,
        title: autonomousAction.title,
        priority: trigger.priority
      }
    });
  } catch (error) {
    console.error('Error adding trigger:', error);
    next(error);
  }
};

/**
 * Remove a smart trigger
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const removeTrigger = async (req, res, next) => {
  try {
    const { triggerId } = req.params;
    
    if (!triggerId) {
      return res.status(400).json({
        success: false,
        error: 'Trigger ID is required'
      });
    }

    autonomousActionEngine.removeTrigger(triggerId);
    
    res.status(200).json({
      success: true,
      message: 'Smart trigger removed successfully',
      data: {
        triggerId
      }
    });
  } catch (error) {
    console.error('Error removing trigger:', error);
    next(error);
  }
};

/**
 * Get all triggers
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getTriggers = async (req, res, next) => {
  try {
    const triggers = Array.from(autonomousActionEngine.triggers.values()).map(trigger => ({
      id: trigger.id,
      title: trigger.action.title,
      description: trigger.action.description,
      type: trigger.action.type,
      priority: trigger.priority,
      enabled: trigger.enabled,
      triggerCount: trigger.triggerCount,
      lastTriggered: trigger.lastTriggered,
      createdAt: trigger.createdAt
    }));
    
    res.status(200).json({
      success: true,
      message: 'Triggers retrieved successfully',
      data: {
        triggers,
        total: triggers.length
      }
    });
  } catch (error) {
    console.error('Error getting triggers:', error);
    next(error);
  }
};

/**
 * Enable or disable a trigger
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const toggleTrigger = async (req, res, next) => {
  try {
    const { triggerId } = req.params;
    const { enabled } = req.body;
    
    if (!triggerId) {
      return res.status(400).json({
        success: false,
        error: 'Trigger ID is required'
      });
    }

    const trigger = autonomousActionEngine.triggers.get(triggerId);
    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: 'Trigger not found'
      });
    }

    trigger.enabled = enabled !== undefined ? enabled : !trigger.enabled;
    
    res.status(200).json({
      success: true,
      message: `Trigger ${trigger.enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        triggerId,
        enabled: trigger.enabled,
        title: trigger.action.title
      }
    });
  } catch (error) {
    console.error('Error toggling trigger:', error);
    next(error);
  }
};

/**
 * Get action history
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getActionHistory = async (req, res, next) => {
  try {
    const { limit = 20, userId } = req.query;
    
    let history = autonomousActionEngine.getActionHistory(parseInt(limit));
    
    // Filter by user if specified
    if (userId) {
      history = history.filter(action => 
        action.result && action.result.context && 
        action.result.context.userId === userId
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Action history retrieved successfully',
      data: {
        actions: history,
        total: autonomousActionEngine.actionHistory.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting action history:', error);
    next(error);
  }
};

/**
 * Manually trigger an action
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const triggerAction = async (req, res, next) => {
  try {
    const { actionType, userId = 'default-user' } = req.body;
    
    if (!actionType) {
      return res.status(400).json({
        success: false,
        error: 'Action type is required'
      });
    }

    // Get current context
    const context = await contextEngine.analyzeContext(userId);
    
    // Create a simple action based on type
    let action;
    switch (actionType) {
      case 'focus_mode':
        action = new AutonomousAction(
          ActionTypes.PRODUCTIVITY,
          'Enable focus mode',
          'Set up your environment for deep work',
          async (context, userId) => {
            return {
              message: 'Focus mode activated',
              actions: [
                'Muting notifications',
                'Setting timer for 25 minutes',
                'Preparing workspace'
              ]
            };
          }
        );
        break;
        
      case 'break_reminder':
        action = new AutonomousAction(
          ActionTypes.WELLNESS,
          'Take a break',
          'Your energy is low - time for a short break',
          async (context, userId) => {
            return {
              message: 'Break time!',
              actions: [
                'Stand up and stretch',
                'Get some water',
                'Look away from screen for 20 seconds'
              ]
            };
          }
        );
        break;
        
      case 'meeting_prep':
        action = new AutonomousAction(
          ActionTypes.PRODUCTIVITY,
          'Prepare for meeting',
          'Gather meeting materials and set up workspace',
          async (context, userId) => {
            const upcomingMeetings = context.context.calendar.filter(event => {
              const eventTime = new Date(event.start);
              const now = new Date();
              const timeDiff = eventTime - now;
              return timeDiff > 0 && timeDiff < 60 * 60 * 1000; // Within 1 hour
            });
            
            return {
              message: upcomingMeetings.length > 0 
                ? `Preparing for: ${upcomingMeetings[0].summary}`
                : 'No upcoming meetings found',
              actions: [
                'Opening meeting notes',
                'Setting up video call',
                'Reviewing agenda'
              ]
            };
          }
        );
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown action type'
        });
    }
    
    // Execute the action
    const result = await autonomousActionEngine.executeAction(action, context, userId);
    
    res.status(200).json({
      success: true,
      message: 'Action triggered successfully',
      data: {
        actionId: action.id,
        result
      }
    });
  } catch (error) {
    console.error('Error triggering action:', error);
    next(error);
  }
};

/**
 * Create default triggers
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const createDefaultTriggers = async (req, res, next) => {
  try {
    autonomousActionEngine.createDefaultTriggers();
    
    const triggers = Array.from(autonomousActionEngine.triggers.values()).map(trigger => ({
      id: trigger.id,
      title: trigger.action.title,
      description: trigger.action.description,
      type: trigger.action.type,
      priority: trigger.priority,
      enabled: trigger.enabled
    }));
    
    res.status(200).json({
      success: true,
      message: 'Default triggers created successfully',
      data: {
        triggers,
        total: triggers.length
      }
    });
  } catch (error) {
    console.error('Error creating default triggers:', error);
    next(error);
  }
};

export default {
  startEngine,
  stopEngine,
  getEngineStatus,
  addTrigger,
  removeTrigger,
  getTriggers,
  toggleTrigger,
  getActionHistory,
  triggerAction,
  createDefaultTriggers
}; 