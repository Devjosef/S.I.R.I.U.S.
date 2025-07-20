/**
 * Autonomous Action Routes - Autonomous System Endpoints
 * 
 * Handles API endpoints for autonomous action execution and
 * ML-based decision making.
 * 
 * Lines: 96
 */

// Express routing and validation
import { Router } from 'express';
import { body, param } from 'express-validator';

// Autonomous action controller
import autonomousActionController from '../controllers/autonomousActionController.js';

// Validation middleware
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Trigger autonomous action
 * POST /api/autonomous/trigger
 */
router.post('/trigger', [
  body('userId').notEmpty().withMessage('userId is required'),
  body('actionType').notEmpty().withMessage('actionType is required'),
  body('context').optional().isString().withMessage('context must be a string'),
  validate
], autonomousActionController.triggerAction);

/**
 * Get available actions
 * GET /api/autonomous/actions
 */
router.get('/actions', autonomousActionController.getAvailableActions);

/**
 * Get action history
 * GET /api/autonomous/history?userId=string
 */
router.get('/history', [
  body('userId').notEmpty().withMessage('userId is required'),
  validate
], autonomousActionController.getActionHistory);

export default router; 