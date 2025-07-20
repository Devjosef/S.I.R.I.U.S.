/**
 * Asana Best Practices Controller
 * 
 * Handles Asana best practices and workflow automation
 * Integrates with S.I.R.I.U.S. autonomous action engine
 */

import * as asanaBestPracticesService from '../services/asanaBestPracticesService.js';
import logger from '../utils/logger.js';

/**
 * Create a project following Asana best practices
 * POST /api/asana/best-practices/projects
 */
export const createBestPracticeProject = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const projectData = req.body;
    
    // Validate required fields
    if (!projectData.name || !projectData.template) {
      return res.status(400).json({
        success: false,
        error: 'Project name and template are required'
      });
    }
    
    logger.info(`Creating best practice project: ${projectData.name} with template: ${projectData.template}`);
    
    const result = await asanaBestPracticesService.createBestPracticeProject(userId, projectData);
    
    res.status(201).json({
      success: true,
      message: 'Best practice project created successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error creating best practice project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create best practice project'
    });
  }
};

/**
 * Create a task following Asana best practices
 * POST /api/asana/best-practices/tasks
 */
export const createBestPracticeTask = async (req, res) => {
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
    
    logger.info(`Creating best practice task: ${taskData.name}`);
    
    const task = await asanaBestPracticesService.createBestPracticeTask(userId, taskData);
    
    res.status(201).json({
      success: true,
      message: 'Best practice task created successfully',
      data: task
    });
  } catch (error) {
    logger.error('Error creating best practice task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create best practice task'
    });
  }
};

/**
 * Setup Kanban workflow for a project
 * POST /api/asana/best-practices/workflow
 */
export const setupKanbanWorkflow = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    logger.info(`Setting up Kanban workflow for project: ${projectId}`);
    
    const workflow = await asanaBestPracticesService.setupKanbanWorkflow(userId, projectId);
    
    res.json({
      success: true,
      message: 'Kanban workflow setup successfully',
      data: workflow
    });
  } catch (error) {
    logger.error('Error setting up Kanban workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup Kanban workflow'
    });
  }
};

/**
 * Generate project analytics and insights
 * GET /api/asana/best-practices/analytics/:projectId
 */
export const generateProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    logger.info(`Generating analytics for project: ${projectId}`);
    
    const analytics = await asanaBestPracticesService.generateProjectAnalytics(projectId);
    
    res.json({
      success: true,
      message: 'Project analytics generated successfully',
      data: analytics
    });
  } catch (error) {
    logger.error('Error generating project analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate project analytics'
    });
  }
};

/**
 * Create a sprint planning session
 * POST /api/asana/best-practices/sprint
 */
export const createSprintPlanning = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const sprintData = req.body;
    
    // Validate required fields
    if (!sprintData.projectId || !sprintData.sprintName || !sprintData.goals) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, sprint name, and goals are required'
      });
    }
    
    logger.info(`Creating sprint planning: ${sprintData.sprintName}`);
    
    const sprint = await asanaBestPracticesService.createSprintPlanning(userId, sprintData);
    
    res.status(201).json({
      success: true,
      message: 'Sprint planning created successfully',
      data: sprint
    });
  } catch (error) {
    logger.error('Error creating sprint planning:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sprint planning'
    });
  }
};

/**
 * Get available project templates
 * GET /api/asana/best-practices/templates
 */
export const getProjectTemplates = async (req, res) => {
  try {
    const templates = {
      SOFTWARE_DEVELOPMENT: {
        name: 'Software Development Project',
        description: 'Complete software development workflow with sprints, code review, and deployment',
        sections: ['Backlog', 'Sprint Planning', 'In Development', 'Code Review', 'Testing', 'Deployment', 'Done'],
        tags: ['bug', 'feature', 'enhancement', 'documentation', 'testing'],
        bestFor: ['Software teams', 'Agile development', 'Sprint-based work']
      },
      MARKETING_CAMPAIGN: {
        name: 'Marketing Campaign',
        description: 'End-to-end marketing campaign management from strategy to analysis',
        sections: ['Strategy', 'Content Creation', 'Design', 'Review', 'Approval', 'Launch', 'Analysis'],
        tags: ['content', 'design', 'social-media', 'email', 'analytics'],
        bestFor: ['Marketing teams', 'Campaign management', 'Content creation']
      },
      PRODUCT_LAUNCH: {
        name: 'Product Launch',
        description: 'Comprehensive product launch workflow from discovery to post-launch',
        sections: ['Discovery', 'Planning', 'Development', 'Testing', 'Marketing', 'Launch', 'Post-Launch'],
        tags: ['research', 'planning', 'development', 'marketing', 'launch'],
        bestFor: ['Product teams', 'Product launches', 'Cross-functional projects']
      }
    };
    
    res.json({
      success: true,
      message: 'Project templates retrieved successfully',
      data: templates
    });
  } catch (error) {
    logger.error('Error getting project templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project templates'
    });
  }
};

/**
 * Get best practices recommendations
 * GET /api/asana/best-practices/recommendations
 */
export const getBestPracticesRecommendations = async (req, res) => {
  try {
    const recommendations = {
      projectManagement: [
        'Use clear, descriptive task names',
        'Break down large tasks into smaller subtasks',
        'Set realistic due dates and time estimates',
        'Use tags for easy filtering and organization',
        'Regularly update task progress and status'
      ],
      teamCollaboration: [
        'Assign tasks to specific team members',
        'Use comments for updates and blockers',
        'Set up project sections for workflow stages',
        'Create sprint planning sessions for iterative work',
        'Use project templates for consistency'
      ],
      workflowOptimization: [
        'Implement Kanban workflow with clear stages',
        'Set up automated notifications for task updates',
        'Use priority tags to focus on important work',
        'Regularly review and update project analytics',
        'Conduct sprint retrospectives to improve processes'
      ],
      timeManagement: [
        'Use time estimates to plan capacity',
        'Track actual vs estimated time',
        'Set up recurring tasks for regular activities',
        'Use due dates to manage deadlines',
        'Review overdue tasks and adjust priorities'
      ]
    };
    
    res.json({
      success: true,
      message: 'Best practices recommendations retrieved successfully',
      data: recommendations
    });
  } catch (error) {
    logger.error('Error getting best practices recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get best practices recommendations'
    });
  }
}; 