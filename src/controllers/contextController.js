/**
 * Context Controller - API Endpoints for Context Analysis
 * 
 * Handles HTTP requests for context analysis, pattern learning,
 * and user behavior insights.
 * 
 * Lines: 100
 */

// Context engine integration
import contextEngine from '../services/contextEngine.js';
import memoryService from '../services/memoryService.js';

/**
 * Analyze your current situation and get smart insights
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const analyzeContext = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Analyze your current context
    const context = await contextEngine.analyzeContext(userId);
    
    // Learn from this interaction
    await memoryService.learnFromInteraction(userId, {
      timeBlock: context.currentTimeBlock,
      urgency: context.urgency,
      focus: context.focus,
      energy: context.energy,
      actions: context.actions
    });
    
    res.status(200).json({
      success: true,
      message: 'Context analyzed successfully',
      data: context
    });
  } catch (error) {
    console.error('Error in analyzeContext controller:', error);
    next(error);
  }
};

/**
 * Get your learned preferences and patterns
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getPreferences = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const preferences = await memoryService.getPreferences(userId);
    
    res.status(200).json({
      success: true,
      message: 'Preferences retrieved successfully',
      data: preferences
    });
  } catch (error) {
    console.error('Error in getPreferences controller:', error);
    next(error);
  }
};

/**
 * Update your preferences
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const updatePreferences = async (req, res, next) => {
  try {
    const { userId, preferences } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'Preferences are required'
      });
    }

    const success = await memoryService.updatePreferences(userId, preferences);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }
  } catch (error) {
    console.error('Error in updatePreferences controller:', error);
    next(error);
  }
};

/**
 * Remember a specific behavior or preference
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const rememberBehavior = async (req, res, next) => {
  try {
    const { userId, category, key, value } = req.body;
    
    if (!userId || !category || !key) {
      return res.status(400).json({
        success: false,
        error: 'User ID, category, and key are required'
      });
    }

    const success = await memoryService.rememberBehavior(userId, category, key, value);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Behavior remembered successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to remember behavior'
      });
    }
  } catch (error) {
    console.error('Error in rememberBehavior controller:', error);
    next(error);
  }
};

/**
 * Get a remembered behavior
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getBehavior = async (req, res, next) => {
  try {
    const { userId, category, key } = req.query;
    
    if (!userId || !category || !key) {
      return res.status(400).json({
        success: false,
        error: 'User ID, category, and key are required'
      });
    }

    const behavior = await memoryService.getBehavior(userId, category, key);
    
    res.status(200).json({
      success: true,
      message: 'Behavior retrieved successfully',
      data: behavior
    });
  } catch (error) {
    console.error('Error in getBehavior controller:', error);
    next(error);
  }
};

/**
 * Get your current situation summary
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getCurrentSituation = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get your current context
    const context = await contextEngine.analyzeContext(userId);
    
    // Get your preferences
    const preferences = await memoryService.getPreferences(userId);
    
    // Create a situation summary
    const situation = {
      currentTime: new Date(),
      timeBlock: context.currentTimeBlock,
      urgency: context.urgency,
      focus: context.focus,
      energy: context.energy,
      insights: context.insights.slice(0, 3), // Top 3 insights
      actions: context.actions,
      preferences: preferences?.preferences || {},
      patterns: preferences?.patterns || {}
    };
    
    res.status(200).json({
      success: true,
      message: 'Current situation retrieved successfully',
      data: situation
    });
  } catch (error) {
    console.error('Error in getCurrentSituation controller:', error);
    next(error);
  }
};

/**
 * Clean up old memories
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const cleanupMemories = async (req, res, next) => {
  try {
    const { userId, daysOld = 90 } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const success = await memoryService.forgetOldMemories(userId, daysOld);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: `Memories older than ${daysOld} days cleaned up successfully`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup memories'
      });
    }
  } catch (error) {
    console.error('Error in cleanupMemories controller:', error);
    next(error);
  }
};

export default {
  analyzeContext,
  getPreferences,
  updatePreferences,
  rememberBehavior,
  getBehavior,
  getCurrentSituation,
  cleanupMemories
}; 