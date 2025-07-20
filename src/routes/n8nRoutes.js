/**
 * n8n Routes
 * 
 * n8n integration endpoints for S.I.R.I.U.S.
 * Manages AI-driven workflow execution and creation
 */

import { Router } from 'express';
import * as n8nController from '../controllers/n8nController.js';
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Test n8n connection
 * GET /api/n8n/test
 */
router.get('/test',
  n8nController.testConnection
);

/**
 * Get available n8n integrations
 * GET /api/n8n/integrations
 */
router.get('/integrations',
  n8nController.getIntegrations
);

/**
 * Get workflow statistics
 * GET /api/n8n/stats
 */
router.get('/stats',
  n8nController.getWorkflowStats
);

/**
 * Execute n8n workflow
 * POST /api/n8n/workflows/:workflowId/execute
 */
router.post('/workflows/:workflowId/execute',
  n8nController.executeWorkflow
);

/**
 * Create new n8n workflow
 * POST /api/n8n/workflows
 */
router.post('/workflows',
  n8nController.createWorkflow
);

/**
 * Get execution status
 * GET /api/n8n/executions/:executionId
 */
router.get('/executions/:executionId',
  n8nController.getExecutionStatus
);

/**
 * Generate workflow from S.I.R.I.U.S. task
 * POST /api/n8n/generate
 */
router.post('/generate',
  n8nController.generateWorkflow
);

/**
 * Create and execute workflow from task
 * POST /api/n8n/auto-execute
 */
router.post('/auto-execute',
  n8nController.autoExecuteWorkflow
);

export default router; 