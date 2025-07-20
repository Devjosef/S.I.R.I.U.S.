/**
 * Daily Digest Controller
 * 
 * Handles web requests for your daily digest - creates summaries, 
 * gets your data, and runs actions you want to take
 */

import dailyDigestService from '../services/dailyDigestService.js';

/**
 * Create a fresh daily digest for you
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const generateDigest = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const digest = await dailyDigestService.generateDailyDigest(userId);
    
    res.status(200).json({
      success: true,
      message: 'Daily digest generated successfully',
      data: digest
    });
  } catch (error) {
    console.error('Error in generateDigest controller:', error);
    next(error);
  }
};

/**
 * Get your latest daily digest
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getDigest = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const digest = await dailyDigestService.generateDailyDigest(userId);
    
    res.status(200).json({
      success: true,
      message: 'Daily digest retrieved successfully',
      data: digest
    });
  } catch (error) {
    console.error('Error in getDigest controller:', error);
    next(error);
  }
};

/**
 * Do something from your daily digest (like reschedule a meeting)
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const executeAction = async (req, res, next) => {
  try {
    const { actionId, context } = req.body;
    
    if (!actionId) {
      return res.status(400).json({
        success: false,
        error: 'Action ID is required'
      });
    }

    const result = await dailyDigestService.executeAction(actionId, context || {});
    
    res.status(200).json({
      success: true,
      message: 'Action executed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in executeAction controller:', error);
    next(error);
  }
};

/**
 * Get your calendar events for today
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getCalendarEvents = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const events = await dailyDigestService.getCalendarEvents(userId);
    
    res.status(200).json({
      success: true,
      message: 'Calendar events retrieved successfully',
      data: events
    });
  } catch (error) {
    console.error('Error in getCalendarEvents controller:', error);
    next(error);
  }
};

/**
 * Get your todos for today
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getTodos = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const todos = await dailyDigestService.getTodos(userId);
    
    res.status(200).json({
      success: true,
      message: 'Todos retrieved successfully',
      data: todos
    });
  } catch (error) {
    console.error('Error in getTodos controller:', error);
    next(error);
  }
};

/**
 * Get your important emails from today
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getEmailHighlights = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const emails = await dailyDigestService.getEmailHighlights(userId);
    
    res.status(200).json({
      success: true,
      message: 'Email highlights retrieved successfully',
      data: emails
    });
  } catch (error) {
    console.error('Error in getEmailHighlights controller:', error);
    next(error);
  }
};

export default {
  generateDigest,
  getDigest,
  executeAction,
  getCalendarEvents,
  getTodos,
  getEmailHighlights
}; 