/**
 * Asana Routes
 * 
 * Asana integration endpoints for S.I.R.I.U.S.
 * Manages tasks, projects, teams, and workflows
 */

import { Router } from 'express';
import * as asanaController from '../controllers/asanaController.js';
import * as asanaBestPracticesController from '../controllers/asanaBestPracticesController.js';
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Get user's Asana workspaces
 * GET /api/asana/workspaces
 */
router.get('/workspaces',
  asanaController.getWorkspaces
);

/**
 * Get user's Asana projects
 * GET /api/asana/projects
 */
router.get('/projects',
  asanaController.getProjects
);

/**
 * Create a new project
 * POST /api/asana/projects
 */
router.post('/projects',
  asanaController.createProject
);

/**
 * Get tasks from a project
 * GET /api/asana/projects/:projectId/tasks
 */
router.get('/projects/:projectId/tasks',
  asanaController.getProjectTasks
);

/**
 * Get user's assigned tasks
 * GET /api/asana/tasks/assigned
 */
router.get('/tasks/assigned',
  asanaController.getAssignedTasks
);

/**
 * Get urgent tasks (due soon or overdue)
 * GET /api/asana/tasks/urgent
 */
router.get('/tasks/urgent',
  asanaController.getUrgentTasks
);

/**
 * Create a new task
 * POST /api/asana/tasks
 */
router.post('/tasks',
  asanaController.createTask
);

/**
 * Update an existing task
 * PUT /api/asana/tasks/:taskId
 */
router.put('/tasks/:taskId',
  asanaController.updateTask
);

/**
 * Complete a task
 * POST /api/asana/tasks/:taskId/complete
 */
router.post('/tasks/:taskId/complete',
  asanaController.completeTask
);

/**
 * Get teams in a workspace
 * GET /api/asana/workspaces/:workspaceId/teams
 */
router.get('/workspaces/:workspaceId/teams',
  asanaController.getTeams
);

/**
 * Get team members
 * GET /api/asana/teams/:teamId/members
 */
router.get('/teams/:teamId/members',
  asanaController.getTeamMembers
);

// ===== ASANA BEST PRACTICES ROUTES =====

/**
 * Get available project templates
 * GET /api/asana/best-practices/templates
 */
router.get('/best-practices/templates',
  asanaBestPracticesController.getProjectTemplates
);

/**
 * Get best practices recommendations
 * GET /api/asana/best-practices/recommendations
 */
router.get('/best-practices/recommendations',
  asanaBestPracticesController.getBestPracticesRecommendations
);

/**
 * Create a project following Asana best practices
 * POST /api/asana/best-practices/projects
 */
router.post('/best-practices/projects',
  asanaBestPracticesController.createBestPracticeProject
);

/**
 * Create a task following Asana best practices
 * POST /api/asana/best-practices/tasks
 */
router.post('/best-practices/tasks',
  asanaBestPracticesController.createBestPracticeTask
);

/**
 * Setup Kanban workflow for a project
 * POST /api/asana/best-practices/workflow
 */
router.post('/best-practices/workflow',
  asanaBestPracticesController.setupKanbanWorkflow
);

/**
 * Generate project analytics and insights
 * GET /api/asana/best-practices/analytics/:projectId
 */
router.get('/best-practices/analytics/:projectId',
  asanaBestPracticesController.generateProjectAnalytics
);

/**
 * Create a sprint planning session
 * POST /api/asana/best-practices/sprint
 */
router.post('/best-practices/sprint',
  asanaBestPracticesController.createSprintPlanning
);

export default router; 