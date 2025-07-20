/**
 * Asana Controller
 * 
 * Handles Asana integration business logic for S.I.R.I.U.S.
 * Manages tasks, projects, teams, and workflows
 */

import * as asanaService from '../services/asanaService.js';
import logger from '../utils/logger.js';

/**
 * Get user's Asana workspaces
 * GET /api/asana/workspaces
 */
export const getWorkspaces = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    logger.info(`Fetching Asana workspaces for user: ${userId}`);
    const workspaces = await asanaService.getWorkspaces(userId);
    
    res.json({
      success: true,
      message: 'Asana workspaces retrieved successfully',
      data: workspaces
    });
  } catch (error) {
    logger.error('Error fetching Asana workspaces:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Asana workspaces'
    });
  }
};

/**
 * Get user's Asana projects
 * GET /api/asana/projects
 */
export const getProjects = async (req, res) => {
  try {
    const { userId = 'default', workspaceId } = req.query;
    
    logger.info(`Fetching Asana projects for user: ${userId}`);
    const projects = await asanaService.getProjects(userId, workspaceId);
    
    res.json({
      success: true,
      message: 'Asana projects retrieved successfully',
      data: projects
    });
  } catch (error) {
    logger.error('Error fetching Asana projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Asana projects'
    });
  }
};

/**
 * Create a new project
 * POST /api/asana/projects
 */
export const createProject = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const projectData = req.body;
    
    // Validate required fields
    if (!projectData.name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }
    
    logger.info(`Creating Asana project: ${projectData.name} for user: ${userId}`);
    
    const project = await asanaService.createProject(userId, projectData);
    
    res.status(201).json({
      success: true,
      message: 'Asana project created successfully',
      data: project
    });
  } catch (error) {
    logger.error('Error creating Asana project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Asana project'
    });
  }
};

/**
 * Get tasks from a project
 * GET /api/asana/projects/:projectId/tasks
 */
export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { maxResults = 50, completed } = req.query;
    
    logger.info(`Fetching Asana tasks for project: ${projectId}`);
    
    const filters = { maxResults: parseInt(maxResults) };
    if (completed !== undefined) filters.completed = completed === 'true';
    
    const tasks = await asanaService.getProjectTasks(projectId, filters);
    
    res.json({
      success: true,
      message: 'Asana project tasks retrieved successfully',
      data: tasks
    });
  } catch (error) {
    logger.error('Error fetching Asana project tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Asana project tasks'
    });
  }
};

/**
 * Get user's assigned tasks
 * GET /api/asana/tasks/assigned
 */
export const getAssignedTasks = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    logger.info(`Fetching assigned Asana tasks for user: ${userId}`);
    const tasks = await asanaService.getAssignedTasks(userId);
    
    res.json({
      success: true,
      message: 'Assigned Asana tasks retrieved successfully',
      data: tasks
    });
  } catch (error) {
    logger.error('Error fetching assigned Asana tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assigned Asana tasks'
    });
  }
};

/**
 * Get urgent tasks (due soon or overdue)
 * GET /api/asana/tasks/urgent
 */
export const getUrgentTasks = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    logger.info(`Fetching urgent Asana tasks for user: ${userId}`);
    const tasks = await asanaService.getUrgentTasks(userId);
    
    res.json({
      success: true,
      message: 'Urgent Asana tasks retrieved successfully',
      data: tasks
    });
  } catch (error) {
    logger.error('Error fetching urgent Asana tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch urgent Asana tasks'
    });
  }
};

/**
 * Create a new task
 * POST /api/asana/tasks
 */
export const createTask = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const taskData = req.body;
    
    // Validate required fields
    if (!taskData.name || !taskData.projectId) {
      return res.status(400).json({
        success: false,
        error: 'Task name and project ID are required'
      });
    }
    
    logger.info(`Creating Asana task for user: ${userId}`, { name: taskData.name, projectId: taskData.projectId });
    
    const task = await asanaService.createTask(userId, taskData);
    
    res.status(201).json({
      success: true,
      message: 'Asana task created successfully',
      data: task
    });
  } catch (error) {
    logger.error('Error creating Asana task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Asana task'
    });
  }
};

/**
 * Update an existing task
 * PUT /api/asana/tasks/:taskId
 */
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId = 'default' } = req.query;
    const taskData = req.body;
    
    logger.info(`Updating Asana task: ${taskId} for user: ${userId}`);
    
    const result = await asanaService.updateTask(userId, taskId, taskData);
    
    res.json({
      success: true,
      message: 'Asana task updated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error updating Asana task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Asana task'
    });
  }
};

/**
 * Complete a task
 * POST /api/asana/tasks/:taskId/complete
 */
export const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId = 'default' } = req.query;
    
    logger.info(`Completing Asana task: ${taskId} for user: ${userId}`);
    
    const result = await asanaService.completeTask(userId, taskId);
    
    res.json({
      success: true,
      message: 'Asana task completed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error completing Asana task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete Asana task'
    });
  }
};

/**
 * Get teams in a workspace
 * GET /api/asana/workspaces/:workspaceId/teams
 */
export const getTeams = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    logger.info(`Fetching Asana teams for workspace: ${workspaceId}`);
    const teams = await asanaService.getTeams(workspaceId);
    
    res.json({
      success: true,
      message: 'Asana teams retrieved successfully',
      data: teams
    });
  } catch (error) {
    logger.error('Error fetching Asana teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Asana teams'
    });
  }
};

/**
 * Get team members
 * GET /api/asana/teams/:teamId/members
 */
export const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    logger.info(`Fetching Asana team members for team: ${teamId}`);
    const members = await asanaService.getTeamMembers(teamId);
    
    res.json({
      success: true,
      message: 'Asana team members retrieved successfully',
      data: members
    });
  } catch (error) {
    logger.error('Error fetching Asana team members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Asana team members'
    });
  }
}; 