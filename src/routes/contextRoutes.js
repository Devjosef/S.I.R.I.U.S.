/**
 * Context Routes - Context Analysis Endpoints
 * 
 * Handles API endpoints for context analysis, pattern learning,
 * and user behavior insights.
 * 
 * Lines: 73
 */

// Express routing and validation
import { Router } from 'express';
import { body, query } from 'express-validator';

// Context controller
import contextController from '../controllers/contextController.js';

// Validation middleware
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Analyze current context
 * POST /api/context/analyze
 */
router.post('/analyze', [
  body('userId').notEmpty().withMessage('userId is required'),
  body('context').optional().isObject().withMessage('context must be an object'),
  validate
], contextController.analyzeContext);

/**
 * Get context summary
 * GET /api/context/summary?userId=string
 */
router.get('/summary', [
  query('userId').notEmpty().withMessage('userId is required'),
  validate
], contextController.getCurrentSituation);

/**
 * Update context preferences
 * PUT /api/context/preferences
 */
router.put('/preferences', [
  body('userId').notEmpty().withMessage('userId is required'),
  body('preferences').isObject().withMessage('preferences must be an object'),
  validate
], contextController.updatePreferences);

export default router; 