/**
 * Daily Digest Routes
 * 
 * Web endpoints for your daily digest - create summaries, get your data,
 * and take actions on your behalf
 */

import { Router } from 'express';
import dailyDigestController from '../controllers/dailyDigestController.js';
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Create a fresh daily digest for you
 * POST /api/daily-digest/generate
 * Body: { userId: string }
 */
router.post('/generate', 
  dailyDigestController.generateDigest
);

/**
 * Get your latest daily digest
 * GET /api/daily-digest/summary?userId=string
 */
router.get('/summary',
  dailyDigestController.getDigest
);

/**
 * Do something from your daily digest (like reschedule a meeting)
 * POST /api/daily-digest/actions
 * Body: { actionId: string, context?: object }
 */
router.post('/actions',
  dailyDigestController.executeAction
);

/**
 * Get your calendar events for today
 * GET /api/daily-digest/calendar?userId=string
 */
router.get('/calendar',
  dailyDigestController.getCalendarEvents
);

/**
 * Get your todos for today
 * GET /api/daily-digest/todos?userId=string
 */
router.get('/todos',
  dailyDigestController.getTodos
);

/**
 * Get your important emails from today
 * GET /api/daily-digest/emails?userId=string
 */
router.get('/emails',
  dailyDigestController.getEmailHighlights
);

export default router; 