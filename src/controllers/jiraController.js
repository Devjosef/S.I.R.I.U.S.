/**
 * Jira Controller - API Endpoints for Jira Integration
 * 
 * Handles HTTP requests for Jira operations including issues,
 * projects, and workflow management.
 * 
 * Lines: 180
 */

// Jira service integration
import * as jiraService from '../services/jiraService.js';

// Internal utilities
import logger from '../utils/logger.js';

/**
 * Get user's JIRA projects
 * GET /api/jira/projects
 */
export const getProjects = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    logger.info(`Fetching JIRA projects for user: ${userId}`);
    const projects = await jiraService.getProjects(userId);
    
    res.json({
      success: true,
      message: 'JIRA projects retrieved successfully',
      data: projects
    });
  } catch (error) {
    logger.error('Error fetching JIRA projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch JIRA projects'
    });
  }
};

/**
 * Get issues from a project
 * GET /api/jira/projects/:projectKey/issues
 */
export const getProjectIssues = async (req, res) => {
  try {
    const { projectKey } = req.params;
    const { maxResults = 50, status, priority } = req.query;
    
    logger.info(`Fetching JIRA issues for project: ${projectKey}`);
    
    const filters = { maxResults: parseInt(maxResults) };
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    
    const issues = await jiraService.getProjectIssues(projectKey, filters);
    
    res.json({
      success: true,
      message: 'JIRA project issues retrieved successfully',
      data: issues
    });
  } catch (error) {
    logger.error('Error fetching JIRA project issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch JIRA project issues'
    });
  }
};

/**
 * Get user's assigned issues
 * GET /api/jira/issues/assigned
 */
export const getAssignedIssues = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    logger.info(`Fetching assigned JIRA issues for user: ${userId}`);
    const issues = await jiraService.getAssignedIssues(userId);
    
    res.json({
      success: true,
      message: 'Assigned JIRA issues retrieved successfully',
      data: issues
    });
  } catch (error) {
    logger.error('Error fetching assigned JIRA issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assigned JIRA issues'
    });
  }
};

/**
 * Get urgent issues (high priority or overdue)
 * GET /api/jira/issues/urgent
 */
export const getUrgentIssues = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    logger.info(`Fetching urgent JIRA issues for user: ${userId}`);
    const issues = await jiraService.getUrgentIssues(userId);
    
    res.json({
      success: true,
      message: 'Urgent JIRA issues retrieved successfully',
      data: issues
    });
  } catch (error) {
    logger.error('Error fetching urgent JIRA issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch urgent JIRA issues'
    });
  }
};

/**
 * Create a new issue
 * POST /api/jira/issues
 */
export const createIssue = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const issueData = req.body;
    
    // Validate required fields
    if (!issueData.projectKey || !issueData.summary) {
      return res.status(400).json({
        success: false,
        error: 'Project key and summary are required'
      });
    }
    
    logger.info(`Creating JIRA issue for user: ${userId}`, { projectKey: issueData.projectKey, summary: issueData.summary });
    
    const issue = await jiraService.createIssue(userId, issueData);
    
    res.status(201).json({
      success: true,
      message: 'JIRA issue created successfully',
      data: issue
    });
  } catch (error) {
    logger.error('Error creating JIRA issue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create JIRA issue'
    });
  }
};

/**
 * Update an existing issue
 * PUT /api/jira/issues/:issueKey
 */
export const updateIssue = async (req, res) => {
  try {
    const { issueKey } = req.params;
    const { userId = 'default' } = req.query;
    const issueData = req.body;
    
    logger.info(`Updating JIRA issue: ${issueKey} for user: ${userId}`);
    
    const result = await jiraService.updateIssue(userId, issueKey, issueData);
    
    res.json({
      success: true,
      message: 'JIRA issue updated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error updating JIRA issue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update JIRA issue'
    });
  }
};

/**
 * Transition issue status
 * POST /api/jira/issues/:issueKey/transition
 */
export const transitionIssue = async (req, res) => {
  try {
    const { issueKey } = req.params;
    const { userId = 'default' } = req.query;
    const { transitionId } = req.body;
    
    if (!transitionId) {
      return res.status(400).json({
        success: false,
        error: 'Transition ID is required'
      });
    }
    
    logger.info(`Transitioning JIRA issue: ${issueKey} with transition: ${transitionId} for user: ${userId}`);
    
    const result = await jiraService.transitionIssue(userId, issueKey, transitionId);
    
    res.json({
      success: true,
      message: 'JIRA issue transitioned successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error transitioning JIRA issue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transition JIRA issue'
    });
  }
};

/**
 * Get available transitions for an issue
 * GET /api/jira/issues/:issueKey/transitions
 */
export const getIssueTransitions = async (req, res) => {
  try {
    const { issueKey } = req.params;
    
    logger.info(`Fetching transitions for JIRA issue: ${issueKey}`);
    
    const transitions = await jiraService.getIssueTransitions(issueKey);
    
    res.json({
      success: true,
      message: 'JIRA issue transitions retrieved successfully',
      data: transitions
    });
  } catch (error) {
    logger.error('Error fetching JIRA issue transitions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch JIRA issue transitions'
    });
  }
};

/**
 * Get sprints for a project
 * GET /api/jira/projects/:projectKey/sprints
 */
export const getProjectSprints = async (req, res) => {
  try {
    const { projectKey } = req.params;
    
    logger.info(`Fetching sprints for JIRA project: ${projectKey}`);
    
    const sprints = await jiraService.getProjectSprints(projectKey);
    
    res.json({
      success: true,
      message: 'JIRA project sprints retrieved successfully',
      data: sprints
    });
  } catch (error) {
    logger.error('Error fetching JIRA project sprints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch JIRA project sprints'
    });
  }
};

/**
 * Create a new project
 * POST /api/jira/projects
 */
export const createProject = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const projectData = req.body;
    
    // Validate required fields
    if (!projectData.key || !projectData.name) {
      return res.status(400).json({
        success: false,
        error: 'Project key and name are required'
      });
    }
    
    logger.info(`Creating JIRA project for user: ${userId}`, { key: projectData.key, name: projectData.name });
    
    const project = await jiraService.createProject(userId, projectData);
    
    res.status(201).json({
      success: true,
      message: 'JIRA project created successfully',
      data: project
    });
  } catch (error) {
    logger.error('Error creating JIRA project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create JIRA project'
    });
  }
}; 