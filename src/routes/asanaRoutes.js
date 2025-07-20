/**
 * Asana Routes - Asana Integration Endpoints
 * 
 * Handles API endpoints for Asana task management, project
 * tracking, and workflow automation.
 * 
 * Lines: 200
 */

// Express routing and validation
import { Router } from 'express';
import { body, param, query } from 'express-validator';

// Asana controller
import * as asanaController from '../controllers/asanaController.js';

// Validation middleware
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Get user's workspaces
 * GET /api/asana/workspaces?userId=string
 */
router.get('/workspaces', [
  query('userId').notEmpty().withMessage('userId is required'),
  validate
], asanaController.getWorkspaces);

/**
 * Get user's projects
 * GET /api/asana/projects?userId=string&workspaceId=string
 */
router.get('/projects', [
  query('userId').notEmpty().withMessage('userId is required'),
  query('workspaceId').optional().isString().withMessage('workspaceId must be a string'),
  validate
], asanaController.getProjects);

/**
 * Get project tasks
 * GET /api/asana/projects/:projectId/tasks
 */
router.get('/projects/:projectId/tasks', [
  param('projectId').notEmpty().withMessage('projectId is required'),
  validate
], asanaController.getProjectTasks);

/**
 * Get assigned tasks
 * GET /api/asana/tasks/assigned?userId=string
 */
router.get('/tasks/assigned', [
  query('userId').notEmpty().withMessage('userId is required'),
  validate
], asanaController.getAssignedTasks);

/**
 * Get urgent tasks
 * GET /api/asana/tasks/urgent?userId=string
 */
router.get('/tasks/urgent', [
  query('userId').notEmpty().withMessage('userId is required'),
  validate
], asanaController.getUrgentTasks);

/**
 * Create a new task
 * POST /api/asana/tasks
 */
router.post('/tasks', [
  body('userId').notEmpty().withMessage('userId is required'),
  body('taskData').isObject().withMessage('taskData must be an object'),
  body('taskData.name').notEmpty().withMessage('task name is required'),
  validate
], asanaController.createTask);

/**
 * Update a task
 * PUT /api/asana/tasks/:taskId
 */
router.put('/tasks/:taskId', [
  param('taskId').notEmpty().withMessage('taskId is required'),
  body('userId').notEmpty().withMessage('userId is required'),
  body('taskData').isObject().withMessage('taskData must be an object'),
  validate
], asanaController.updateTask);

/**
 * Complete a task
 * POST /api/asana/tasks/:taskId/complete
 */
router.post('/tasks/:taskId/complete', [
  param('taskId').notEmpty().withMessage('taskId is required'),
  body('userId').notEmpty().withMessage('userId is required'),
  validate
], asanaController.completeTask);

export default router; 