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
import { body, param, query } from 'express-validator';

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
 * Get engine status
 * GET /api/autonomous/status
 */
router.get('/status', autonomousActionController.getEngineStatus);

/**
 * Get all triggers
 * GET /api/autonomous/triggers
 */
router.get('/triggers', autonomousActionController.getTriggers);

/**
 * Get action history
 * GET /api/autonomous/history?userId=string
 */
router.get('/history', [
  query('userId').notEmpty().withMessage('userId is required'),
  validate
], autonomousActionController.getActionHistory);

/**
 * Start autonomous engine
 * POST /api/autonomous/start
 */
router.post('/start', autonomousActionController.startEngine);

/**
 * Stop autonomous engine
 * POST /api/autonomous/stop
 */
router.post('/stop', autonomousActionController.stopEngine);

/**
 * Add new trigger
 * POST /api/autonomous/triggers
 */
router.post('/triggers', [
  body('condition').isObject().withMessage('condition must be an object'),
  body('action').isObject().withMessage('action must be an object'),
  body('priority').optional().isString().withMessage('priority must be a string'),
  validate
], autonomousActionController.addTrigger);

/**
 * Remove trigger
 * DELETE /api/autonomous/triggers/:triggerId
 */
router.delete('/triggers/:triggerId', [
  param('triggerId').notEmpty().withMessage('triggerId is required'),
  validate
], autonomousActionController.removeTrigger);

/**
 * Toggle trigger
 * PUT /api/autonomous/triggers/:triggerId/toggle
 */
router.put('/triggers/:triggerId/toggle', [
  param('triggerId').notEmpty().withMessage('triggerId is required'),
  body('enabled').isBoolean().withMessage('enabled must be a boolean'),
  validate
], autonomousActionController.toggleTrigger);

/**
 * Create default triggers
 * POST /api/autonomous/triggers/default
 */
router.post('/triggers/default', autonomousActionController.createDefaultTriggers);

export default router; 