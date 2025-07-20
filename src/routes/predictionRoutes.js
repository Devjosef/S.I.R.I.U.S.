/**
 * Prediction Routes
 * 
 * API endpoints for S.I.R.I.U.S. ML prediction capabilities
 */

import express from 'express';
import { 
  predictNextAction, 
  predictOptimalTiming, 
  predictSuccessProbability, 
  generatePersonalizedRecommendations 
} from '../services/predictionService.js';
import { createLogger } from '../utils/logger.js';
import memoryService from '../services/memoryService.js';


const logger = createLogger('prediction-routes');
const router = express.Router();

/**
 * @route POST /api/predict/next-action
 * @desc Predict next likely action based on current context
 * @access Public (Local)
 */
router.post('/next-action', async (req, res) => {
  try {
    const { userId, currentContext } = req.body;
    
    if (!userId || !currentContext) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userId and currentContext'
      });
    }
    
    const prediction = await predictNextAction(userId, currentContext);
    
    logger.info({ userId, prediction }, 'Next action prediction completed');
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    logger.error({ err: error }, 'Error predicting next action');
    res.status(500).json({
      success: false,
      error: 'Failed to predict next action',
      details: error.message
    });
  }
});

/**
 * @route POST /api/predict/optimal-timing
 * @desc Predict optimal timing for a specific action
 * @access Public (Local)
 */
router.post('/optimal-timing', async (req, res) => {
  try {
    const { userId, actionType } = req.body;
    
    if (!userId || !actionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userId and actionType'
      });
    }
    
    const timing = await predictOptimalTiming(userId, actionType);
    
    logger.info({ userId, actionType, timing }, 'Optimal timing prediction completed');
    
    res.json({
      success: true,
      data: timing
    });
  } catch (error) {
    logger.error({ err: error }, 'Error predicting optimal timing');
    res.status(500).json({
      success: false,
      error: 'Failed to predict optimal timing',
      details: error.message
    });
  }
});

/**
 * @route POST /api/predict/success-probability
 * @desc Predict success probability for an action
 * @access Public (Local)
 */
router.post('/success-probability', async (req, res) => {
  try {
    const { userId, actionContext } = req.body;
    
    if (!userId || !actionContext) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userId and actionContext'
      });
    }
    
    const probability = await predictSuccessProbability(userId, actionContext);
    
    logger.info({ userId, actionContext, probability }, 'Success probability prediction completed');
    
    res.json({
      success: true,
      data: probability
    });
  } catch (error) {
    logger.error({ err: error }, 'Error predicting success probability');
    res.status(500).json({
      success: false,
      error: 'Failed to predict success probability',
      details: error.message
    });
  }
});

/**
 * @route POST /api/predict/recommendations
 * @desc Generate personalized recommendations
 * @access Public (Local)
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { userId, currentContext } = req.body;
    
    if (!userId || !currentContext) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userId and currentContext'
      });
    }
    
    const recommendations = await generatePersonalizedRecommendations(userId, currentContext);
    
    logger.info({ userId, recommendations }, 'Personalized recommendations generated');
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error({ err: error }, 'Error generating personalized recommendations');
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
});

/**
 * @route GET /api/predict/circadian/:userId
 * @desc Get circadian rhythm analysis for a user
 * @access Public (Local)
 */
router.get('/circadian/:userId', async (req, res) => {
  logger.info('🌅 Circadian endpoint called with userId:', req.params.userId);
  
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId'
      });
    }
    
    logger.info({ userId }, 'Starting circadian rhythm analysis');
    
    // Perform the actual analysis
    const memory = await memoryService.loadMemory(userId);
    const circadianRhythm = memory.patterns.timeBlocks?.circadianRhythm;
    
    if (!circadianRhythm) {
      return res.json({
        success: true,
        data: {
          userId,
          timestamp: new Date().toISOString(),
          message: 'Insufficient data for circadian rhythm analysis',
          recommendations: [
            {
              type: 'data_collection',
              title: 'Collect More Data',
              description: 'Continue using S.I.R.I.U.S. to build circadian rhythm patterns',
              priority: 'medium'
            }
          ]
        }
      });
    }
    
    logger.info({ userId, circadianRhythm }, 'Circadian rhythm analysis completed');
    
    res.json({
      success: true,
      data: {
        userId,
        timestamp: new Date().toISOString(),
        circadianType: circadianRhythm.type,
        confidence: circadianRhythm.confidence,
        peakHours: circadianRhythm.peakHours || [],
        periodPerformance: circadianRhythm.periods || {},
        recommendations: circadianRhythm.recommendations || [],
        summary: {
          type: circadianRhythm.type,
          confidence: (circadianRhythm.confidence * 100).toFixed(1) + '%',
          peakHoursCount: (circadianRhythm.peakHours || []).length,
          recommendationsCount: (circadianRhythm.recommendations || []).length
        }
      }
    });
    
  } catch (error) {
    logger.error({ err: error, userId: req.params.userId }, 'Error in circadian endpoint');
    res.status(500).json({
      success: false,
      error: 'Failed to process circadian request',
      details: error.message
    });
  }
});

/**
 * @route GET /api/predict/insights/:userId
 * @desc Get comprehensive ML insights for a user
 * @access Private
 */
router.get('/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId'
      });
    }
    
    // Get all prediction insights
    const currentContext = {
      timeBlock: 'current',
      focus: 'general',
      energy: 'medium',
      urgency: 'normal',
      actionType: 'general'
    };
    
    const [nextAction, optimalTiming, successProbability, recommendations] = await Promise.all([
      predictNextAction(userId, currentContext),
      predictOptimalTiming(userId, 'general'),
      predictSuccessProbability(userId, currentContext),
      generatePersonalizedRecommendations(userId, currentContext)
    ]);
    
    const insights = {
      userId,
      timestamp: new Date().toISOString(),
      nextAction,
      optimalTiming,
      successProbability,
      recommendations,
      summary: {
        hasPredictions: nextAction.confidence > 0,
        hasTimingData: optimalTiming.confidence > 0,
        hasSuccessData: successProbability.confidence > 0,
        hasRecommendations: recommendations.recommendations.length > 0
      }
    };
    
    logger.info({ userId, insights }, 'Comprehensive insights generated');
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error({ err: error }, 'Error generating comprehensive insights');
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
      details: error.message
    });
  }
});

export default router; 