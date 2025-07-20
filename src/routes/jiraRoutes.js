/**
 * Jira Routes - Jira Integration Endpoints
 * 
 * Handles API endpoints for Jira issue tracking, project
 * management, and workflow automation.
 * 
 * Lines: 250
 */

// Express routing and validation
import { Router } from 'express';
import { body, param, query } from 'express-validator';

// Jira controller
import * as jiraController from '../controllers/jiraController.js';

// Validation middleware
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Get user's projects
 * GET /api/jira/projects?userId=string
 */
router.get('/projects', [
  query('userId').notEmpty().withMessage('userId is required'),
  validate
], jiraController.getProjects);

/**
 * Get project issues
 * GET /api/jira/projects/:projectKey/issues
 */
router.get('/projects/:projectKey/issues', [
  param('projectKey').notEmpty().withMessage('projectKey is required'),
  validate
], jiraController.getProjectIssues);

/**
 * Get assigned issues
 * GET /api/jira/issues/assigned?userId=string
 */
router.get('/issues/assigned', [
  query('userId').notEmpty().withMessage('userId is required'),
  validate
], jiraController.getAssignedIssues);

/**
 * Get urgent issues
 * GET /api/jira/issues/urgent?userId=string
 */
router.get('/issues/urgent', [
  query('userId').notEmpty().withMessage('userId is required'),
  validate
], jiraController.getUrgentIssues);

/**
 * Create a new issue
 * POST /api/jira/issues
 */
router.post('/issues', [
  body('userId').notEmpty().withMessage('userId is required'),
  body('issueData').isObject().withMessage('issueData must be an object'),
  body('issueData.projectKey').notEmpty().withMessage('projectKey is required'),
  body('issueData.summary').notEmpty().withMessage('summary is required'),
  validate
], jiraController.createIssue);

/**
 * Update an issue
 * PUT /api/jira/issues/:issueKey
 */
router.put('/issues/:issueKey', [
  param('issueKey').notEmpty().withMessage('issueKey is required'),
  body('userId').notEmpty().withMessage('userId is required'),
  body('issueData').isObject().withMessage('issueData must be an object'),
  validate
], jiraController.updateIssue);

/**
 * Test Jira connection
 * GET /api/jira/test
 */
router.get('/test', jiraController.testConnection);

export default router; 