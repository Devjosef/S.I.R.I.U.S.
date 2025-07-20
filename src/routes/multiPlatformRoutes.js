/**
 * Multi-Platform Routes
 * 
 * Web endpoints for S.I.R.I.U.S.'s multi-platform features -
 * platform registration, synchronization, and cross-device communication
 */

import { Router } from 'express';
import multiPlatformController from '../controllers/multiPlatformController.js';
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Register a new platform connection
 * POST /api/platforms/register
 * Body: { platformType: string, deviceId: string, userId: string, capabilities?: object }
 */
router.post('/register',
  multiPlatformController.registerPlatform
);

/**
 * Get platform statistics for a user
 * GET /api/platforms/stats?userId=string
 */
router.get('/stats',
  multiPlatformController.getPlatformStats
);

/**
 * Get user's platform connections
 * GET /api/platforms/connections?userId=string
 */
router.get('/connections',
  multiPlatformController.getUserConnections
);

/**
 * Remove a platform connection
 * DELETE /api/platforms/connections/:connectionId
 */
router.delete('/connections/:connectionId',
  multiPlatformController.removeConnection
);

/**
 * Send notification to user's platforms
 * POST /api/platforms/notify
 * Body: { userId: string, notification: object }
 */
router.post('/notify',
  multiPlatformController.sendNotification
);

/**
 * Sync data across user's platforms
 * POST /api/platforms/sync
 * Body: { userId: string, data: object, dataType?: string }
 */
router.post('/sync',
  multiPlatformController.syncData
);

/**
 * Update platform capabilities
 * PATCH /api/platforms/capabilities
 * Body: { deviceId: string, capabilities: object }
 */
router.patch('/capabilities',
  multiPlatformController.updateCapabilities
);

/**
 * Get WebSocket connection info
 * GET /api/platforms/websocket?userId=string
 */
router.get('/websocket',
  multiPlatformController.getWebSocketInfo
);

/**
 * Broadcast message to all platforms
 * POST /api/platforms/broadcast
 * Body: { message: object, messageType: string, userId?: string }
 */
router.post('/broadcast',
  multiPlatformController.broadcastMessage
);

/**
 * Get supported platform types
 * GET /api/platforms/supported
 */
router.get('/supported',
  multiPlatformController.getSupportedPlatforms
);

export default router; 