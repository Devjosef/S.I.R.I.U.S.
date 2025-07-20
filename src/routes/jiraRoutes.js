/**
 * JIRA Routes
 * 
 * JIRA integration endpoints for S.I.R.I.U.S.
 * Manages issues, projects, sprints, and workflows
 */

import { Router } from 'express';
import * as jiraController from '../controllers/jiraController.js';
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Get user's JIRA projects
 * GET /api/jira/projects
 */
router.get('/projects',
  jiraController.getProjects
);

/**
 * Create a new project
 * POST /api/jira/projects
 */
router.post('/projects',
  jiraController.createProject
);

/**
 * Get issues from a project
 * GET /api/jira/projects/:projectKey/issues
 */
router.get('/projects/:projectKey/issues',
  jiraController.getProjectIssues
);

/**
 * Get user's assigned issues
 * GET /api/jira/issues/assigned
 */
router.get('/issues/assigned',
  jiraController.getAssignedIssues
);

/**
 * Get urgent issues (high priority or overdue)
 * GET /api/jira/issues/urgent
 */
router.get('/issues/urgent',
  jiraController.getUrgentIssues
);

/**
 * Create a new issue
 * POST /api/jira/issues
 */
router.post('/issues',
  jiraController.createIssue
);

/**
 * Update an existing issue
 * PUT /api/jira/issues/:issueKey
 */
router.put('/issues/:issueKey',
  jiraController.updateIssue
);

/**
 * Transition issue status
 * POST /api/jira/issues/:issueKey/transition
 */
router.post('/issues/:issueKey/transition',
  jiraController.transitionIssue
);

/**
 * Get available transitions for an issue
 * GET /api/jira/issues/:issueKey/transitions
 */
router.get('/issues/:issueKey/transitions',
  jiraController.getIssueTransitions
);

/**
 * Get sprints for a project
 * GET /api/jira/projects/:projectKey/sprints
 */
router.get('/projects/:projectKey/sprints',
  jiraController.getProjectSprints
);

export default router; 