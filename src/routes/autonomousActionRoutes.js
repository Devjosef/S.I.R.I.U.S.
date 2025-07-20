/**
 * Autonomous Action Routes
 * 
 * Web endpoints for S.I.R.I.U.S.'s autonomous actions -
 * managing triggers, monitoring actions, and controlling the system
 */

import { Router } from 'express';
import autonomousActionController from '../controllers/autonomousActionController.js';
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Start the autonomous action engine
 * POST /api/autonomous/start
 */
router.post('/start',
  autonomousActionController.startEngine
);

/**
 * Stop the autonomous action engine
 * POST /api/autonomous/stop
 */
router.post('/stop',
  autonomousActionController.stopEngine
);

/**
 * Get engine status and statistics
 * GET /api/autonomous/status
 */
router.get('/status',
  autonomousActionController.getEngineStatus
);

/**
 * Get all triggers
 * GET /api/autonomous/triggers
 */
router.get('/triggers',
  autonomousActionController.getTriggers
);

/**
 * Add a new smart trigger
 * POST /api/autonomous/triggers
 * Body: { condition: object, action: object, priority: string }
 */
router.post('/triggers',
  autonomousActionController.addTrigger
);

/**
 * Remove a smart trigger
 * DELETE /api/autonomous/triggers/:triggerId
 */
router.delete('/triggers/:triggerId',
  autonomousActionController.removeTrigger
);

/**
 * Enable or disable a trigger
 * PATCH /api/autonomous/triggers/:triggerId/toggle
 * Body: { enabled: boolean }
 */
router.patch('/triggers/:triggerId/toggle',
  autonomousActionController.toggleTrigger
);

/**
 * Get action history
 * GET /api/autonomous/history?limit=20&userId=string
 */
router.get('/history',
  autonomousActionController.getActionHistory
);

/**
 * Manually trigger an action
 * POST /api/autonomous/trigger
 * Body: { actionType: string, userId: string }
 */
router.post('/trigger',
  autonomousActionController.triggerAction
);

/**
 * Create default triggers
 * POST /api/autonomous/defaults
 */
router.post('/defaults',
  autonomousActionController.createDefaultTriggers
);

export default router; 