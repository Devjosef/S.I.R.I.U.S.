/**
 * Learning Analytics Routes
 * 
 * API endpoints for S.I.R.I.U.S.'s learning analytics
 * - Get comprehensive learning insights
 * - Time period analysis
 * - Behavioral patterns
 * - Productivity recommendations
 */

import { Router } from 'express';
import * as learningAnalyticsService from '../services/learningAnalyticsService.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('learning-analytics-routes');

/**
 * Get comprehensive learning analytics for a user
 * GET /api/learning-analytics/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const analytics = await learningAnalyticsService.getLearningAnalytics(userId);
    
    res.json({
      success: true,
      message: 'Learning analytics retrieved successfully',
      data: analytics
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting learning analytics');
    res.status(500).json({
      success: false,
      error: 'Failed to get learning analytics',
      message: error.message
    });
  }
});

/**
 * Get learning insights for a specific time period
 * GET /api/learning-analytics/:userId/period
 */
router.get('/:userId/period', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    const insights = await learningAnalyticsService.getTimePeriodInsights(userId, start, end);
    
    res.json({
      success: true,
      message: 'Time period insights retrieved successfully',
      data: insights
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting time period insights');
    res.status(500).json({
      success: false,
      error: 'Failed to get time period insights',
      message: error.message
    });
  }
});

/**
 * Get summary learning insights
 * GET /api/learning-analytics/:userId/summary
 */
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const analytics = await learningAnalyticsService.getLearningAnalytics(userId);
    
    // Return only summary data
    res.json({
      success: true,
      message: 'Learning summary retrieved successfully',
      data: {
        userId: analytics.userId,
        timestamp: analytics.timestamp,
        summary: analytics.summary,
        recommendations: analytics.recommendations
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting learning summary');
    res.status(500).json({
      success: false,
      error: 'Failed to get learning summary',
      message: error.message
    });
  }
});

/**
 * Get productivity insights
 * GET /api/learning-analytics/:userId/productivity
 */
router.get('/:userId/productivity', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const analytics = await learningAnalyticsService.getLearningAnalytics(userId);
    
    res.json({
      success: true,
      message: 'Productivity insights retrieved successfully',
      data: {
        userId: analytics.userId,
        timestamp: analytics.timestamp,
        productivityInsights: analytics.productivityInsights,
        behavioralPatterns: analytics.behavioralPatterns
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting productivity insights');
    res.status(500).json({
      success: false,
      error: 'Failed to get productivity insights',
      message: error.message
    });
  }
});

/**
 * Get success rate analysis
 * GET /api/learning-analytics/:userId/success-rates
 */
router.get('/:userId/success-rates', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const analytics = await learningAnalyticsService.getLearningAnalytics(userId);
    
    res.json({
      success: true,
      message: 'Success rate analysis retrieved successfully',
      data: {
        userId: analytics.userId,
        timestamp: analytics.timestamp,
        successRates: analytics.successRates
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting success rate analysis');
    res.status(500).json({
      success: false,
      error: 'Failed to get success rate analysis',
      message: error.message
    });
  }
});

export default router; 