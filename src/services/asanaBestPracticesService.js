/**
 * Asana Best Practices Service
 * 
 * Implements Asana's recommended workflows and best practices
 * Integrates with S.I.R.I.U.S. autonomous action engine
 */

import * as asanaService from './asanaService.js';
import logger from '../utils/logger.js';

/**
 * Asana Best Practices Configuration
 */
const ASANA_BEST_PRACTICES = {
  // Task Priority System
  PRIORITIES: {
    HIGH: { name: 'High Priority', color: '#ff0000', tags: ['urgent', 'priority-high'] },
    MEDIUM: { name: 'Medium Priority', color: '#ffa500', tags: ['priority-medium'] },
    LOW: { name: 'Low Priority', color: '#00ff00', tags: ['priority-low'] }
  },
  
  // Task Status Workflow
  STATUS_WORKFLOW: {
    BACKLOG: 'Backlog',
    TO_DO: 'To Do',
    IN_PROGRESS: 'In Progress',
    REVIEW: 'Review',
    DONE: 'Done',
    BLOCKED: 'Blocked'
  },
  
  // Time Tracking
  TIME_ESTIMATES: {
    QUICK: '15m',
    SMALL: '1h',
    MEDIUM: '4h',
    LARGE: '1d',
    EPIC: '1w'
  },
  
  // Project Templates
  PROJECT_TEMPLATES: {
    SOFTWARE_DEVELOPMENT: {
      name: 'Software Development Project',
      sections: ['Backlog', 'Sprint Planning', 'In Development', 'Code Review', 'Testing', 'Deployment', 'Done'],
      tags: ['bug', 'feature', 'enhancement', 'documentation', 'testing']
    },
    MARKETING_CAMPAIGN: {
      name: 'Marketing Campaign',
      sections: ['Strategy', 'Content Creation', 'Design', 'Review', 'Approval', 'Launch', 'Analysis'],
      tags: ['content', 'design', 'social-media', 'email', 'analytics']
    },
    PRODUCT_LAUNCH: {
      name: 'Product Launch',
      sections: ['Discovery', 'Planning', 'Development', 'Testing', 'Marketing', 'Launch', 'Post-Launch'],
      tags: ['research', 'planning', 'development', 'marketing', 'launch']
    }
  }
};

/**
 * Create a project following Asana best practices
 * @param {string} userId - User identifier
 * @param {Object} projectData - Project configuration
 * @returns {Promise<Object>} - Created project with sections
 */
export const createBestPracticeProject = async (userId, projectData) => {
  try {
    const { name, template, workspaceId, description } = projectData;
    const templateConfig = ASANA_BEST_PRACTICES.PROJECT_TEMPLATES[template] || ASANA_BEST_PRACTICES.PROJECT_TEMPLATES.SOFTWARE_DEVELOPMENT;
    
    logger.info(`Creating best practice project: ${name} with template: ${template}`);
    
    // Create project
    const project = await asanaService.createProject(userId, {
      name,
      notes: description || `Project created by S.I.R.I.U.S. using ${templateConfig.name} template`,
      workspaceId
    });
    
    // Create sections based on template
    const sections = await Promise.all(
      templateConfig.sections.map(async (sectionName, index) => {
        return await createProjectSection(project.id, sectionName, index);
      })
    );
    
    // Create default tags
    const tags = await Promise.all(
      templateConfig.tags.map(async (tagName) => {
        return await createWorkspaceTag(workspaceId, tagName);
      })
    );
    
    return {
      project,
      sections,
      tags,
      template: templateConfig.name,
      bestPractices: {
        workflow: templateConfig.sections,
        recommendedTags: templateConfig.tags
      }
    };
    
  } catch (error) {
    logger.error('Error creating best practice project:', error);
    throw error;
  }
};

/**
 * Create a project section
 * @param {string} projectId - Project ID
 * @param {string} sectionName - Section name
 * @param {number} position - Section position
 * @returns {Promise<Object>} - Created section
 */
const createProjectSection = async (projectId, sectionName, position) => {
  try {
    const response = await asanaService.asanaRequest(`/projects/${projectId}/sections`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          name: sectionName
        }
      })
    });
    
    return {
      id: response.data.gid,
      name: response.data.name,
      position
    };
  } catch (error) {
    logger.error(`Error creating section ${sectionName}:`, error);
    return { name: sectionName, error: true };
  }
};

/**
 * Create a workspace tag
 * @param {string} workspaceId - Workspace ID
 * @param {string} tagName - Tag name
 * @returns {Promise<Object>} - Created tag
 */
const createWorkspaceTag = async (workspaceId, tagName) => {
  try {
    const response = await asanaService.asanaRequest(`/workspaces/${workspaceId}/tags`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          name: tagName
        }
      })
    });
    
    return {
      id: response.data.gid,
      name: response.data.name
    };
  } catch (error) {
    logger.error(`Error creating tag ${tagName}:`, error);
    return { name: tagName, error: true };
  }
};

/**
 * Create a task following Asana best practices
 * @param {string} userId - User identifier
 * @param {Object} taskData - Task data with best practices
 * @returns {Promise<Object>} - Created task
 */
export const createBestPracticeTask = async (userId, taskData) => {
  try {
    const {
      name,
      projectId,
      sectionName,
      priority = 'MEDIUM',
      timeEstimate = 'SMALL',
      assignee,
      dueDate,
      description,
      tags = []
    } = taskData;
    
    const priorityConfig = ASANA_BEST_PRACTICES.PRIORITIES[priority];
    const timeEstimateValue = ASANA_BEST_PRACTICES.TIME_ESTIMATES[timeEstimate];
    
    // Build task notes with best practices
    const taskNotes = buildTaskNotes({
      description,
      priority: priorityConfig.name,
      timeEstimate: timeEstimateValue,
      bestPractices: true
    });
    
    // Combine tags
    const allTags = [...priorityConfig.tags, ...tags];
    
    logger.info(`Creating best practice task: ${name} with priority: ${priority}`);
    
    const task = await asanaService.createTask(userId, {
      name,
      projectId,
      notes: taskNotes,
      dueDate,
      assignee,
      tags: allTags
    });
    
    // Move task to appropriate section if specified
    if (sectionName) {
      await moveTaskToSection(task.id, projectId, sectionName);
    }
    
    return {
      ...task,
      priority: priorityConfig.name,
      timeEstimate: timeEstimateValue,
      bestPractices: {
        prioritySystem: priorityConfig,
        timeEstimate: timeEstimateValue,
        section: sectionName
      }
    };
    
  } catch (error) {
    logger.error('Error creating best practice task:', error);
    throw error;
  }
};

/**
 * Build task notes with best practices
 * @param {Object} options - Note building options
 * @returns {string} - Formatted task notes
 */
const buildTaskNotes = ({ description, priority, timeEstimate, bestPractices }) => {
  let notes = '';
  
  if (description) {
    notes += `${description}\n\n`;
  }
  
  if (bestPractices) {
    notes += `--- S.I.R.I.U.S. Best Practices ---\n`;
    notes += `Priority: ${priority}\n`;
    notes += `Time Estimate: ${timeEstimate}\n`;
    notes += `Created: ${new Date().toISOString()}\n\n`;
    
    notes += `📋 Task Guidelines:\n`;
    notes += `• Break down complex tasks into smaller subtasks\n`;
    notes += `• Add relevant tags for easy filtering\n`;
    notes += `• Update progress regularly\n`;
    notes += `• Use comments for updates and blockers\n\n`;
  }
  
  return notes.trim();
};

/**
 * Move task to specific section
 * @param {string} taskId - Task ID
 * @param {string} projectId - Project ID
 * @param {string} sectionName - Section name
 * @returns {Promise<Object>} - Move result
 */
const moveTaskToSection = async (taskId, projectId, sectionName) => {
  try {
    // First get the section ID
    const sections = await asanaService.getProjectSections(projectId);
    const section = sections.find(s => s.name === sectionName);
    
    if (section) {
      await asanaService.asanaRequest(`/tasks/${taskId}/addProject`, {
        method: 'POST',
        body: JSON.stringify({
          data: {
            project: projectId,
            section: section.id
          }
        })
      });
      
      return { success: true, section: sectionName };
    }
    
    return { success: false, error: 'Section not found' };
  } catch (error) {
    logger.error(`Error moving task to section ${sectionName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Implement Kanban workflow automation
 * @param {string} userId - User identifier
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} - Workflow status
 */
export const setupKanbanWorkflow = async (userId, projectId) => {
  try {
    logger.info(`Setting up Kanban workflow for project: ${projectId}`);
    
    // Get project sections
    const sections = await asanaService.getProjectSections(projectId);
    
    // Create workflow rules
    const workflowRules = [
      {
        name: 'Auto-assign to In Progress',
        condition: 'Task moved to "In Progress"',
        action: 'Assign to current user'
      },
      {
        name: 'Review notification',
        condition: 'Task moved to "Review"',
        action: 'Notify assignee and project lead'
      },
      {
        name: 'Completion tracking',
        condition: 'Task moved to "Done"',
        action: 'Update completion metrics'
      }
    ];
    
    return {
      projectId,
      sections: sections.map(s => s.name),
      workflowRules,
      status: 'Kanban workflow configured'
    };
    
  } catch (error) {
    logger.error('Error setting up Kanban workflow:', error);
    throw error;
  }
};

/**
 * Generate project analytics and insights
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} - Analytics data
 */
export const generateProjectAnalytics = async (projectId) => {
  try {
    const tasks = await asanaService.getProjectTasks(projectId);
    
    const analytics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.completed).length,
      overdueTasks: tasks.filter(t => t.isOverdue).length,
      inProgressTasks: tasks.filter(t => !t.completed && !t.isOverdue).length,
      completionRate: tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length * 100).toFixed(1) : 0,
      averageTaskAge: calculateAverageTaskAge(tasks),
      priorityDistribution: calculatePriorityDistribution(tasks),
      assigneeWorkload: calculateAssigneeWorkload(tasks)
    };
    
    return {
      projectId,
      analytics,
      recommendations: generateRecommendations(analytics)
    };
    
  } catch (error) {
    logger.error('Error generating project analytics:', error);
    throw error;
  }
};

/**
 * Calculate average task age
 * @param {Array} tasks - Task list
 * @returns {number} - Average age in days
 */
const calculateAverageTaskAge = (tasks) => {
  if (tasks.length === 0) return 0;
  
  const totalAge = tasks.reduce((sum, task) => {
    const created = new Date(task.created);
    const now = new Date();
    return sum + Math.floor((now - created) / (1000 * 60 * 60 * 24));
  }, 0);
  
  return Math.round(totalAge / tasks.length);
};

/**
 * Calculate priority distribution
 * @param {Array} tasks - Task list
 * @returns {Object} - Priority distribution
 */
const calculatePriorityDistribution = (tasks) => {
  const distribution = { high: 0, medium: 0, low: 0 };
  
  tasks.forEach(task => {
    if (task.tags?.includes('priority-high')) distribution.high++;
    else if (task.tags?.includes('priority-medium')) distribution.medium++;
    else if (task.tags?.includes('priority-low')) distribution.low++;
    else distribution.medium++; // Default
  });
  
  return distribution;
};

/**
 * Calculate assignee workload
 * @param {Array} tasks - Task list
 * @returns {Object} - Workload by assignee
 */
const calculateAssigneeWorkload = (tasks) => {
  const workload = {};
  
  tasks.forEach(task => {
    const assignee = task.assignee || 'Unassigned';
    if (!workload[assignee]) {
      workload[assignee] = { total: 0, completed: 0, overdue: 0 };
    }
    
    workload[assignee].total++;
    if (task.completed) workload[assignee].completed++;
    if (task.isOverdue) workload[assignee].overdue++;
  });
  
  return workload;
};

/**
 * Generate recommendations based on analytics
 * @param {Object} analytics - Analytics data
 * @returns {Array} - Recommendations
 */
const generateRecommendations = (analytics) => {
  const recommendations = [];
  
  if (analytics.completionRate < 70) {
    recommendations.push('Consider breaking down large tasks into smaller, more manageable pieces');
  }
  
  if (analytics.overdueTasks > 0) {
    recommendations.push('Review overdue tasks and update priorities or deadlines');
  }
  
  if (analytics.priorityDistribution.high > analytics.priorityDistribution.medium + analytics.priorityDistribution.low) {
    recommendations.push('Too many high-priority tasks. Consider reprioritizing to focus on what matters most');
  }
  
  return recommendations;
};

/**
 * Create a sprint planning session
 * @param {string} userId - User identifier
 * @param {Object} sprintData - Sprint configuration
 * @returns {Promise<Object>} - Sprint setup
 */
export const createSprintPlanning = async (userId, sprintData) => {
  try {
    const { projectId, sprintName, duration, capacity, goals } = sprintData;
    
    logger.info(`Creating sprint planning: ${sprintName}`);
    
    // Create sprint section
    const sprintSection = await createProjectSection(projectId, `Sprint: ${sprintName}`, 0);
    
    // Create sprint goal tasks
    const goalTasks = await Promise.all(
      goals.map(async (goal, index) => {
        return await createBestPracticeTask(userId, {
          name: `Sprint Goal ${index + 1}: ${goal}`,
          projectId,
          sectionName: sprintSection.name,
          priority: 'HIGH',
          timeEstimate: 'LARGE',
          tags: ['sprint-goal', sprintName.toLowerCase().replace(/\s+/g, '-')]
        });
      })
    );
    
    return {
      sprintName,
      duration,
      capacity,
      section: sprintSection,
      goals: goalTasks,
      status: 'Sprint planning created'
    };
    
  } catch (error) {
    logger.error('Error creating sprint planning:', error);
    throw error;
  }
}; 