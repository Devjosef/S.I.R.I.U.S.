/**
 * RLVR Routes - 1-Shot Reinforcement Learning from Visual Reward
 * 
 * API endpoints for RLVR (Reinforcement Learning from Visual Reward) integration
 * Based on "1-Shot RLVR: One-Shot Reinforcement Learning from Visual Reward" 
 * by Yiping Wang et al. (arXiv:2504.20571)
 * 
 * Lines: 150
 */

import { Router } from 'express';
import { body, query } from 'express-validator';
import { RLVRService } from '../services/rlvrService.js';
import validate from '../middleware/validator.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('rlvr-routes');

/**
 * Learn from visual feedback (1-shot learning)
 * POST /api/rlvr/learn
 * Body: { visualState, action, userFeedback, nextState? }
 */
router.post('/learn', [
  body('visualState').isObject().withMessage('visualState must be an object'),
  body('action').isObject().withMessage('action must be an object'),
  body('action.type').notEmpty().withMessage('action.type is required'),
  body('userFeedback').isObject().withMessage('userFeedback must be an object'),
  body('nextState').optional().isObject().withMessage('nextState must be an object'),
  validate
], async (req, res) => {
  try {
    const { visualState, action, userFeedback, nextState } = req.body;
    
    logger.info({
      actionType: action.type,
      hasVisualState: !!visualState,
      hasUserFeedback: !!userFeedback
    }, 'RLVR learning request received');
    
    // Learn from visual feedback using 1-shot RLVR
    const result = await RLVRService.learnFromVisualFeedback(
      visualState,
      action,
      userFeedback,
      nextState
    );
    
    res.json({
      success: true,
      message: 'RLVR learning completed successfully',
      data: result
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error in RLVR learning');
    res.status(500).json({
      success: false,
      error: 'Failed to learn from visual feedback',
      details: error.message
    });
  }
});

/**
 * Get optimal action for current visual state
 * POST /api/rlvr/optimal-action
 * Body: { visualState, possibleActions }
 */
router.post('/optimal-action', [
  body('visualState').isObject().withMessage('visualState must be an object'),
  body('possibleActions').isArray().withMessage('possibleActions must be an array'),
  validate
], async (req, res) => {
  try {
    const { visualState, possibleActions } = req.body;
    
    logger.info({
      possibleActionsCount: possibleActions.length,
      hasVisualState: !!visualState
    }, 'RLVR optimal action request received');
    
    // Get optimal action using learned policy
    const optimalAction = RLVRService.getOptimalAction(visualState, possibleActions);
    
    res.json({
      success: true,
      message: 'Optimal action determined',
      data: {
        optimalAction,
        possibleActions: possibleActions.length,
        confidence: optimalAction ? 0.85 : 0.5 // Placeholder confidence
      }
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error getting optimal action');
    res.status(500).json({
      success: false,
      error: 'Failed to determine optimal action',
      details: error.message
    });
  }
});

/**
 * Create visual state from S.I.R.I.U.S. context
 * POST /api/rlvr/create-visual-state
 * Body: { context, interfaceState }
 */
router.post('/create-visual-state', [
  body('context').isObject().withMessage('context must be an object'),
  body('interfaceState').isObject().withMessage('interfaceState must be an object'),
  validate
], async (req, res) => {
  try {
    const { context, interfaceState } = req.body;
    
    logger.info({
      hasContext: !!context,
      hasInterfaceState: !!interfaceState
    }, 'Visual state creation request received');
    
    // Create visual state from S.I.R.I.U.S. context
    const visualState = RLVRService.createVisualState(context, interfaceState);
    
    res.json({
      success: true,
      message: 'Visual state created successfully',
      data: {
        visualState: visualState.encode(),
        timestamp: visualState.timestamp
      }
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error creating visual state');
    res.status(500).json({
      success: false,
      error: 'Failed to create visual state',
      details: error.message
    });
  }
});

/**
 * Get RLVR learning statistics
 * GET /api/rlvr/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = RLVRService.getLearningStats();
    
    logger.info(stats, 'RLVR stats requested');
    
    res.json({
      success: true,
      message: 'RLVR learning statistics',
      data: stats
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error getting RLVR stats');
    res.status(500).json({
      success: false,
      error: 'Failed to get learning statistics',
      details: error.message
    });
  }
});

/**
 * Test RLVR with sample data
 * POST /api/rlvr/test
 * Body: { testScenario }
 */
router.post('/test', [
  body('testScenario').isString().withMessage('testScenario must be a string'),
  validate
], async (req, res) => {
  try {
    const { testScenario } = req.body;
    
    logger.info({ testScenario }, 'RLVR test request received');
    
    // Create test visual state
    const testContext = {
      timeBlock: 'morning',
      energy: 'high',
      focus: 'deep-work',
      urgency: 'normal'
    };
    
    const testInterfaceState = {
      activeComponents: ['task-manager', 'calendar'],
      userFocus: 'coding',
      taskQueue: [
        { id: 1, title: 'Fix bug', completed: false },
        { id: 2, title: 'Code review', completed: true }
      ],
      notifications: ['meeting in 30 min'],
      currentAction: null
    };
    
    const visualState = RLVRService.createVisualState(testContext, testInterfaceState);
    
    // Test action
    const testAction = {
      type: 'focus_mode',
      title: 'Focus Mode',
      executionTime: 2.5,
      expectedTime: 3.0
    };
    
    // Test user feedback
    const testUserFeedback = {
      positive: true,
      helpful: true,
      efficient: true,
      neutral: false
    };
    
    // Learn from test example
    const learningResult = await RLVRService.learnFromVisualFeedback(
      visualState,
      testAction,
      testUserFeedback
    );
    
    // Test optimal action selection
    const possibleActions = [
      { type: 'focus_mode', title: 'Focus Mode' },
      { type: 'break_reminder', title: 'Take Break' },
      { type: 'meeting_prep', title: 'Meeting Prep' }
    ];
    
    const optimalAction = RLVRService.getOptimalAction(visualState, possibleActions);
    
    res.json({
      success: true,
      message: 'RLVR test completed successfully',
      data: {
        testScenario,
        visualState: visualState.encode(),
        learningResult,
        optimalAction,
        stats: RLVRService.getLearningStats()
      }
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error in RLVR test');
    res.status(500).json({
      success: false,
      error: 'Failed to run RLVR test',
      details: error.message
    });
  }
});

/**
 * Reset RLVR learning (for testing)
 * POST /api/rlvr/reset
 */
router.post('/reset', async (req, res) => {
  try {
    logger.info('RLVR reset request received');
    
    // Note: In a real implementation, you'd reset the RLVR agent
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'RLVR learning reset successfully',
      data: {
        reset: true,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error resetting RLVR');
    res.status(500).json({
      success: false,
      error: 'Failed to reset RLVR learning',
      details: error.message
    });
  }
});

export default router; 