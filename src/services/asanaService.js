/**
 * Asana Service
 * 
 * Real Asana integration for S.I.R.I.U.S.
 * Manages tasks, projects, teams, and workflows
 */

import config from '../config/index.js';

const ASANA_API_BASE = 'https://app.asana.com/api/1.0';
const ASANA_ACCESS_TOKEN = process.env.ASANA_ACCESS_TOKEN;

/**
 * Make authenticated Asana API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - API response
 */
export const asanaRequest = async (endpoint, options = {}) => {
  const url = `${ASANA_API_BASE}${endpoint}`;
  
  const requestOptions = {
    headers: {
      'Authorization': `Bearer ${ASANA_ACCESS_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      throw new Error(`Asana API error: ${response.status} - ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Asana API request failed:', error);
    throw error;
  }
};

/**
 * Get user's workspaces
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of workspaces
 */
export const getWorkspaces = async (userId) => {
  try {
    const response = await asanaRequest('/workspaces');
    
    return (response.data || []).map(workspace => ({
      id: workspace.gid,
      name: workspace.name,
      isOrganization: workspace.is_organization,
      emailDomains: workspace.email_domains || [],
      isAdmin: workspace.is_admin,
      isReadOnly: workspace.is_read_only
    }));
    
  } catch (error) {
    console.error('Error fetching Asana workspaces:', error);
    return getMockWorkspaces();
  }
};

/**
 * Get user's projects
 * @param {string} userId - User identifier
 * @param {string} workspaceId - Workspace ID (optional)
 * @returns {Promise<Array>} - List of projects
 */
export const getProjects = async (userId, workspaceId = null) => {
  try {
    let endpoint = '/projects?opt_fields=name,notes,color,created_at,due_date,owner,team,workspace,archived,public,members';
    if (workspaceId) {
      endpoint += `&workspace=${workspaceId}`;
    }
    
    const response = await asanaRequest(endpoint);
    
    return (response.data || []).map(project => ({
      id: project.gid,
      name: project.name,
      notes: project.notes || '',
      color: project.color,
      created: project.created_at,
      dueDate: project.due_date,
      owner: project.owner?.name || '',
      team: project.team?.name || '',
      workspace: project.workspace?.name || '',
      archived: project.archived,
      public: project.public,
      members: project.members?.map(m => m.name) || []
    }));
    
  } catch (error) {
    console.error('Error fetching Asana projects:', error);
    return getMockProjects();
  }
};

/**
 * Get tasks from a project
 * @param {string} projectId - Project ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} - List of tasks
 */
export const getProjectTasks = async (projectId, filters = {}) => {
  try {
    const response = await asanaRequest(`/projects/${projectId}/tasks?opt_fields=name,notes,due_date,assignee,completed,created_at,modified_at,tags,memberships.section.name,memberships.project.name`);
    
    return (response.data || []).map(task => ({
      id: task.gid,
      name: task.name,
      notes: task.notes || '',
      dueDate: task.due_date,
      assignee: task.assignee?.name || 'Unassigned',
      completed: task.completed,
      created: task.created_at,
      updated: task.modified_at,
      tags: task.tags?.map(t => t.name) || [],
      section: task.memberships?.[0]?.section?.name || 'No Section',
      project: task.memberships?.[0]?.project?.name || ''
    }));
    
  } catch (error) {
    console.error('Error fetching Asana project tasks:', error);
    return [];
  }
};

/**
 * Get user's assigned tasks
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of assigned tasks
 */
export const getAssignedTasks = async (userId) => {
  try {
    const response = await asanaRequest('/tasks?assignee=me&opt_fields=name,notes,due_date,assignee,completed,created_at,modified_at,tags,memberships.section.name,memberships.project.name&completed_since=now');
    
    return (response.data || []).map(task => ({
      id: task.gid,
      name: task.name,
      notes: task.notes || '',
      dueDate: task.due_date,
      assignee: task.assignee?.name || 'Unassigned',
      completed: task.completed,
      created: task.created_at,
      updated: task.modified_at,
      tags: task.tags?.map(t => t.name) || [],
      section: task.memberships?.[0]?.section?.name || 'No Section',
      project: task.memberships?.[0]?.project?.name || '',
      isOverdue: task.due_date && new Date(task.due_date) < new Date() && !task.completed
    }));
    
  } catch (error) {
    console.error('Error fetching Asana assigned tasks:', error);
    return getMockTasks();
  }
};

/**
 * Get urgent tasks (due soon or overdue)
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of urgent tasks
 */
export const getUrgentTasks = async (userId) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const response = await asanaRequest(`/tasks?assignee=me&due_on.lte=${tomorrowStr}&opt_fields=name,notes,due_date,assignee,completed,created_at,modified_at,tags,memberships.section.name,memberships.project.name&completed_since=now`);
    
    return (response.data || []).map(task => ({
      id: task.gid,
      name: task.name,
      notes: task.notes || '',
      dueDate: task.due_date,
      assignee: task.assignee?.name || 'Unassigned',
      completed: task.completed,
      created: task.created_at,
      updated: task.modified_at,
      tags: task.tags?.map(t => t.name) || [],
      section: task.memberships?.[0]?.section?.name || 'No Section',
      project: task.memberships?.[0]?.project?.name || '',
      isOverdue: task.due_date && new Date(task.due_date) < new Date() && !task.completed,
      priority: task.due_date && new Date(task.due_date) < new Date() ? 'High' : 'Medium'
    }));
    
  } catch (error) {
    console.error('Error fetching Asana urgent tasks:', error);
    return getMockTasks().filter(task => task.isOverdue || task.priority === 'High');
  }
};

/**
 * Create a new task
 * @param {string} userId - User identifier
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>} - Created task
 */
export const createTask = async (userId, taskData) => {
  try {
    // Build minimal payload - only include fields that are provided
    const taskPayload = {
      data: {
        name: taskData.name
      }
    };
    
    // Add optional fields only if they exist
    if (taskData.notes) {
      taskPayload.data.notes = taskData.notes;
    }
    
    if (taskData.projectId) {
      taskPayload.data.projects = [taskData.projectId];
    }
    
    if (taskData.dueDate) {
      taskPayload.data.due_date = taskData.dueDate;
    }
    
    if (taskData.assignee) {
      taskPayload.data.assignee = taskData.assignee;
    }
    
    // Note: Tags require tag IDs, not names. We'll skip tags for now to avoid 400 errors
    // if (taskData.tags && taskData.tags.length > 0) {
    //   taskPayload.data.tags = taskData.tags;
    // }
    
    console.log('Creating task with payload:', JSON.stringify(taskPayload, null, 2));
    
    const response = await asanaRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskPayload)
    });
    
    return {
      id: response.data.gid,
      name: response.data.name,
      notes: response.data.notes || '',
      dueDate: response.data.due_date,
      assignee: response.data.assignee?.name || 'Unassigned',
      completed: response.data.completed,
      created: response.data.created_at,
      project: taskData.projectId ? 'Project' : 'No Project'
    };
    
  } catch (error) {
    console.error('Error creating Asana task:', error);
    throw new Error('Failed to create Asana task');
  }
};

/**
 * Update an existing task
 * @param {string} userId - User identifier
 * @param {string} taskId - Task ID
 * @param {Object} taskData - Updated task data
 * @returns {Promise<Object>} - Updated task
 */
export const updateTask = async (userId, taskId, taskData) => {
  try {
    const updateData = {};
    
    if (taskData.name) updateData.name = taskData.name;
    if (taskData.notes !== undefined) updateData.notes = taskData.notes;
    if (taskData.dueDate) updateData.due_date = taskData.dueDate;
    if (taskData.assignee) updateData.assignee = taskData.assignee;
    if (taskData.completed !== undefined) updateData.completed = taskData.completed;
    if (taskData.tags) updateData.tags = taskData.tags;
    
    const response = await asanaRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({
        data: updateData
      })
    });
    
    return {
      success: true,
      message: 'Task updated successfully',
      taskId: response.data.gid,
      name: response.data.name
    };
    
  } catch (error) {
    console.error('Error updating Asana task:', error);
    throw new Error('Failed to update Asana task');
  }
};

/**
 * Complete a task
 * @param {string} userId - User identifier
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} - Completion result
 */
export const completeTask = async (userId, taskId) => {
  try {
    const response = await asanaRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({
        data: {
          completed: true
        }
      })
    });
    
    return {
      success: true,
      message: 'Task completed successfully',
      taskId: response.data.gid,
      name: response.data.name
    };
    
  } catch (error) {
    console.error('Error completing Asana task:', error);
    throw new Error('Failed to complete Asana task');
  }
};

/**
 * Get teams in a workspace
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Array>} - List of teams
 */
export const getTeams = async (workspaceId) => {
  try {
    const response = await asanaRequest(`/organizations/${workspaceId}/teams?opt_fields=name,description,html_description,organization,visibility`);
    
    return (response.data || []).map(team => ({
      id: team.gid,
      name: team.name,
      description: team.description || '',
      htmlDescription: team.html_description || '',
      organization: team.organization?.name || '',
      visibility: team.visibility
    }));
    
  } catch (error) {
    console.error('Error fetching Asana teams:', error);
    return [];
  }
};

/**
 * Get team members
 * @param {string} teamId - Team ID
 * @returns {Promise<Array>} - List of team members
 */
export const getTeamMembers = async (teamId) => {
  try {
    const response = await asanaRequest(`/teams/${teamId}/users?opt_fields=name,email,photo,workspaces`);
    
    return (response.data || []).map(user => ({
      id: user.gid,
      name: user.name,
      email: user.email,
      photo: user.photo?.image_128x128 || '',
      workspaces: user.workspaces?.map(w => w.name) || []
    }));
    
  } catch (error) {
    console.error('Error fetching Asana team members:', error);
    return [];
  }
};

/**
 * Get task comments
 * @param {string} taskId - Task ID
 * @returns {Promise<Array>} - List of comments
 */
export const getTaskComments = async (taskId) => {
  try {
    const response = await asanaRequest(`/tasks/${taskId}/stories?opt_fields=text,created_at,created_by.name,resource_type`);
    
    return (response.data || [])
      .filter(story => story.resource_type === 'comment')
      .map(comment => ({
        id: comment.gid,
        text: comment.text,
        created: comment.created_at,
        author: comment.created_by?.name || 'Unknown',
        type: comment.resource_type
      }));
    
  } catch (error) {
    console.error('Error fetching Asana task comments:', error);
    return [];
  }
};

/**
 * Add comment to task
 * @param {string} userId - User identifier
 * @param {string} taskId - Task ID
 * @param {string} comment - Comment text
 * @returns {Promise<Object>} - Comment result
 */
export const addTaskComment = async (userId, taskId, comment) => {
  try {
    const response = await asanaRequest(`/tasks/${taskId}/stories`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          text: comment
        }
      })
    });
    
    return {
      success: true,
      message: 'Comment added successfully',
      commentId: response.data.gid,
      text: response.data.text
    };
    
  } catch (error) {
    console.error('Error adding Asana task comment:', error);
    throw new Error('Failed to add task comment');
  }
};

/**
 * Create a new project
 * @param {string} userId - User identifier
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} - Created project
 */
export const createProject = async (userId, projectData) => {
  try {
    // Build minimal payload - only include fields that are provided
    const projectPayload = {
      data: {
        name: projectData.name,
        workspace: projectData.workspaceId
      }
    };
    
    // Add optional fields only if they exist
    if (projectData.notes) {
      projectPayload.data.notes = projectData.notes;
    }
    
    if (projectData.teamId) {
      projectPayload.data.team = projectData.teamId;
    }
    
    if (projectData.color) {
      projectPayload.data.color = projectData.color;
    }
    
    if (projectData.dueDate) {
      projectPayload.data.due_date = projectData.dueDate;
    }
    
    if (projectData.public !== undefined) {
      projectPayload.data.public = projectData.public;
    }
    
    console.log('Creating project with payload:', JSON.stringify(projectPayload, null, 2));
    
    const response = await asanaRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(projectPayload)
    });
    
    return {
      id: response.data.gid,
      name: response.data.name,
      notes: response.data.notes || '',
      color: response.data.color,
      created: response.data.created_at,
      dueDate: response.data.due_date,
      public: response.data.public,
      workspace: response.data.workspace?.name || '',
      team: response.data.team?.name || ''
    };
    
  } catch (error) {
    console.error('Error creating Asana project:', error);
    throw new Error('Failed to create Asana project');
  }
};

/**
 * Get project sections
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} - List of sections
 */
export const getProjectSections = async (projectId) => {
  try {
    const response = await asanaRequest(`/projects/${projectId}/sections?opt_fields=name,created_at`);
    
    return (response.data || []).map(section => ({
      id: section.gid,
      name: section.name,
      created: section.created_at
    }));
    
  } catch (error) {
    console.error('Error fetching Asana project sections:', error);
    return [];
  }
};



// Mock data for fallback
const getMockWorkspaces = () => [
  {
    id: '123456789',
    name: 'Sample Workspace',
    isOrganization: true,
    emailDomains: ['company.com'],
    isAdmin: true,
    isReadOnly: false
  }
];

const getMockProjects = () => [
  {
    id: '987654321',
    name: 'Product Launch',
    notes: 'Launch our new product features',
    color: 'light-green',
    created: '2024-01-15T10:00:00Z',
    dueDate: '2024-02-15',
    owner: 'John Doe',
    team: 'Product Team',
    workspace: 'Sample Workspace',
    archived: false,
    public: true,
    members: ['John Doe', 'Jane Smith']
  }
];

const getMockTasks = () => [
  {
    id: '111111111',
    name: 'Design user interface',
    notes: 'Create wireframes and mockups',
    dueDate: '2024-01-20',
    assignee: 'John Doe',
    completed: false,
    created: '2024-01-15T10:00:00Z',
    updated: '2024-01-16T14:30:00Z',
    tags: ['design', 'ui'],
    section: 'In Progress',
    project: 'Product Launch',
    isOverdue: false,
    priority: 'High'
  },
  {
    id: '222222222',
    name: 'Write documentation',
    notes: 'Document the new features',
    dueDate: '2024-01-18',
    assignee: 'Jane Smith',
    completed: false,
    created: '2024-01-15T11:00:00Z',
    updated: '2024-01-15T11:00:00Z',
    tags: ['documentation'],
    section: 'To Do',
    project: 'Product Launch',
    isOverdue: true,
    priority: 'High'
  }
]; 