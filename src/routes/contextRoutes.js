/**
 * Context Routes
 * 
 * Web endpoints for S.I.R.I.U.S.'s brain - analyze your situation,
 * manage your memory, and get smart insights
 */

import { Router } from 'express';
import contextController from '../controllers/contextController.js';
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Analyze your current situation and get smart insights
 * POST /api/context/analyze
 * Body: { userId: string }
 */
router.post('/analyze',
  contextController.analyzeContext
);

/**
 * Get your learned preferences and patterns
 * GET /api/context/preferences?userId=string
 */
router.get('/preferences',
  contextController.getPreferences
);

/**
 * Update your preferences
 * POST /api/context/preferences
 * Body: { userId: string, preferences: object }
 */
router.post('/preferences',
  contextController.updatePreferences
);

/**
 * Remember a specific behavior or preference
 * POST /api/context/remember
 * Body: { userId: string, category: string, key: string, value: any }
 */
router.post('/remember',
  contextController.rememberBehavior
);

/**
 * Get a remembered behavior
 * GET /api/context/behavior?userId=string&category=string&key=string
 */
router.get('/behavior',
  contextController.getBehavior
);

/**
 * Get your current situation summary
 * GET /api/context/situation?userId=string
 */
router.get('/situation',
  contextController.getCurrentSituation
);

/**
 * Clean up old memories
 * POST /api/context/cleanup
 * Body: { userId: string, daysOld?: number }
 */
router.post('/cleanup',
  contextController.cleanupMemories
);

export default router; 