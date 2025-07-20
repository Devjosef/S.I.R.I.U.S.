/**
 * Jira Service - Issue Tracking Integration
 * 
 * Manages Jira API integration for issue tracking, project
 * management, and workflow automation.
 * 
 * Lines: 650
 * Documentation: docs/INTEGRATIONS.md
 */

// Internal configuration
import config from '../config/index.js';

const JIRA_API_BASE = process.env.JIRA_BASE_URL || 'https://your-domain.atlassian.net';
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

/**
 * Make authenticated JIRA API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - API response
 */
const jiraRequest = async (endpoint, options = {}) => {
  // Validate required credentials
  if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error('JIRA credentials not configured. Please set JIRA_EMAIL and JIRA_API_TOKEN environment variables.');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(JIRA_EMAIL)) {
    throw new Error('Invalid JIRA email format. Please use your Atlassian email address.');
  }

  const url = `${JIRA_API_BASE}/rest/api/3${endpoint}`;
  
  // Create Basic Auth header with proper encoding
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  
  const requestOptions = {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'S.I.R.I.U.S./1.0.0',
      ...options.headers
    },
    ...options
  };
  
  try {
    const response = await fetch(url, requestOptions);
    
    // Enhanced error handling based on status codes
    if (response.status === 401) {
      throw new Error(`JIRA Authentication failed (401). Please verify:
        1. Your Atlassian email address is correct
        2. Your API token is valid and not expired
        3. You're using your email, not username
        4. Clear any CAPTCHA locks by logging into Atlassian web interface`);
    } else if (response.status === 403) {
      throw new Error(`JIRA Authorization failed (403). The user doesn't have permission to access this resource.`);
    } else if (response.status === 404) {
      throw new Error(`JIRA Resource not found (404). The endpoint or resource doesn't exist.`);
    } else if (response.status === 400) {
      // Get detailed error information for 400 errors
      const errorText = await response.text();
      throw new Error(`JIRA Bad Request (400): ${errorText}`);
    } else if (!response.ok) {
      throw new Error(`JIRA API error: ${response.status} - ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('JIRA API request failed:', error);
    throw error;
  }
};

/**
 * Get user's projects
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of projects
 */
export const getProjects = async (userId) => {
  try {
    const response = await jiraRequest('/project');
    
    // Handle both array and object with values property
    const projects = Array.isArray(response) ? response : (response.values || []);
    
    const mappedProjects = projects.map(project => ({
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description || '',
      lead: project.lead?.displayName || '',
      avatarUrl: project.avatarUrls?.['48x48'] || '',
      projectTypeKey: project.projectTypeKey,
      simplified: project.simplified,
      style: project.style,
      isPrivate: project.isPrivate,
      issueTypes: project.issueTypes || [],
      components: project.components || [],
      roles: project.roles || {}
    }));

    // Learn from this interaction
    try {
      const { MemoryService } = await import('./memoryService.js');
      const memoryService = new MemoryService();
      await memoryService.learnFromInteraction(userId, {
        type: 'jira_operation',
        operation: 'get_projects',
        success: true,
        result: {
          projectCount: mappedProjects.length,
          projectKeys: mappedProjects.map(p => p.key)
        },
        timestamp: new Date().toISOString()
      });
    } catch (learningError) {
      console.log('Learning from Jira interaction failed:', learningError.message);
    }
    
    return mappedProjects;
    
  } catch (error) {
    // Learn from failed interaction
    try {
      const { MemoryService } = await import('./memoryService.js');
      const memoryService = new MemoryService();
      await memoryService.learnFromInteraction(userId, {
        type: 'jira_operation',
        operation: 'get_projects',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } catch (learningError) {
      console.log('Learning from failed Jira interaction failed:', learningError.message);
    }
    
    console.error('Error fetching JIRA projects:', error);
    throw new Error('Failed to fetch JIRA projects');
  }
};

/**
 * Get issues from a project
 * @param {string} projectKey - Project key
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} - List of issues
 */
export const getProjectIssues = async (projectKey, filters = {}) => {
  try {
    const jql = `project = ${projectKey}`;
    const response = await jiraRequest('/search', {
      method: 'POST',
      body: JSON.stringify({
        jql,
        maxResults: filters.maxResults || 50,
        fields: [
          'summary',
          'status',
          'assignee',
          'priority',
          'duedate',
          'description',
          'issuetype',
          'created',
          'updated',
          'labels',
          'components'
        ],
        ...filters
      })
    });
    
    return (response.issues || []).map(issue => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: issue.fields.status?.name || 'Unknown',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      priority: issue.fields.priority?.name || 'Medium',
      dueDate: issue.fields.duedate,
      issueType: issue.fields.issuetype?.name || 'Task',
      labels: issue.fields.labels || [],
      components: issue.fields.components?.map(c => c.name) || [],
      created: issue.fields.created,
      updated: issue.fields.updated,
      projectKey: issue.fields.project?.key,
      projectName: issue.fields.project?.name
    }));
    
  } catch (error) {
    console.error('Error fetching JIRA project issues:', error);
    return [];
  }
};

/**
 * Get user's assigned issues
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of assigned issues
 */
export const getAssignedIssues = async (userId) => {
  try {
    const jql = `assignee = currentUser() AND status != Done ORDER BY priority DESC, duedate ASC`;
    const response = await jiraRequest('/search', {
      method: 'POST',
      body: JSON.stringify({
        jql,
        maxResults: 50,
        fields: [
          'summary',
          'status',
          'assignee',
          'priority',
          'duedate',
          'description',
          'issuetype',
          'created',
          'updated',
          'labels',
          'components',
          'project'
        ]
      })
    });
    
    return (response.issues || []).map(issue => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: issue.fields.status?.name || 'Unknown',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      priority: issue.fields.priority?.name || 'Medium',
      dueDate: issue.fields.duedate,
      issueType: issue.fields.issuetype?.name || 'Task',
      labels: issue.fields.labels || [],
      components: issue.fields.components?.map(c => c.name) || [],
      created: issue.fields.created,
      updated: issue.fields.updated,
      projectKey: issue.fields.project?.key,
      projectName: issue.fields.project?.name
    }));
    
  } catch (error) {
    console.error('Error fetching JIRA assigned issues:', error);
    throw new Error('Failed to fetch JIRA assigned issues');
  }
};

/**
 * Get urgent issues (high priority or overdue)
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of urgent issues
 */
export const getUrgentIssues = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const jql = `(priority = High OR priority = Highest OR duedate <= "${today}") AND status != Done AND assignee = currentUser() ORDER BY priority DESC, duedate ASC`;
    
    const response = await jiraRequest('/search', {
      method: 'POST',
      body: JSON.stringify({
        jql,
        maxResults: 20,
        fields: [
          'summary',
          'status',
          'assignee',
          'priority',
          'duedate',
          'description',
          'issuetype',
          'created',
          'updated',
          'labels',
          'components',
          'project'
        ]
      })
    });
    
    return (response.issues || []).map(issue => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: issue.fields.status?.name || 'Unknown',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      priority: issue.fields.priority?.name || 'Medium',
      dueDate: issue.fields.duedate,
      issueType: issue.fields.issuetype?.name || 'Task',
      labels: issue.fields.labels || [],
      components: issue.fields.components?.map(c => c.name) || [],
      created: issue.fields.created,
      updated: issue.fields.updated,
      projectKey: issue.fields.project?.key,
      projectName: issue.fields.project?.name,
      isOverdue: issue.fields.duedate && new Date(issue.fields.duedate) < new Date()
    }));
    
  } catch (error) {
    console.error('Error fetching JIRA urgent issues:', error);
    throw new Error('Failed to fetch JIRA urgent issues');
  }
};

/**
 * Create a new issue
 * @param {string} userId - User identifier
 * @param {Object} issueData - Issue data
 * @returns {Promise<Object>} - Created issue
 */
export const createIssue = async (userId, issueData) => {
  try {
    // First, get available issue types for the project
    const issueTypes = await getProjectIssueTypes(issueData.projectKey);
    const validIssueType = issueTypes.find(type => 
      type.name.toLowerCase() === (issueData.issueType || 'task').toLowerCase()
    ) || issueTypes[0];

    if (!validIssueType) {
      throw new Error(`No valid issue types found for project ${issueData.projectKey}`);
    }

    // Build fields object dynamically based on what's supported
    const fields = {
          project: {
            key: issueData.projectKey
          },
          summary: issueData.summary,
          issuetype: {
        name: validIssueType.name
      }
    };

    // Only add description if provided and supported
    if (issueData.description) {
      fields.description = issueData.description;
    }

    // Only add priority if it's a supported field for this issue type
    if (issueData.priority && validIssueType.fields?.priority) {
      fields.priority = { name: issueData.priority };
    }

    // Only add assignee if provided
    if (issueData.assignee) {
      fields.assignee = { name: issueData.assignee };
    }

    // Only add due date if provided
    if (issueData.dueDate) {
      fields.duedate = issueData.dueDate;
    }

    // Only add labels if provided
    if (issueData.labels && issueData.labels.length > 0) {
      fields.labels = issueData.labels;
    }

    const response = await jiraRequest('/issue', {
      method: 'POST',
      body: JSON.stringify({ fields })
    });
    
    // Learn from this interaction
    try {
      const { MemoryService } = await import('./memoryService.js');
      const memoryService = new MemoryService();
      await memoryService.learnFromInteraction(userId, {
        type: 'jira_operation',
        operation: 'create_issue',
        success: true,
        projectKey: issueData.projectKey,
        issueType: validIssueType.name,
        result: {
          issueKey: response.key,
          issueId: response.id
        },
        timestamp: new Date().toISOString()
      });
    } catch (learningError) {
      console.log('Learning from Jira interaction failed:', learningError.message);
    }
    
    return {
      id: response.id,
      key: response.key,
      summary: response.fields?.summary || 'No summary',
      status: response.fields?.status?.name || 'Unknown',
      assignee: response.fields?.assignee?.displayName || 'Unassigned',
      priority: response.fields?.priority?.name || 'Medium',
      dueDate: response.fields?.duedate,
      issueType: response.fields?.issuetype?.name || 'Unknown',
      created: response.fields?.created,
      projectKey: response.fields?.project?.key,
      projectName: response.fields?.project?.name
    };
    
  } catch (error) {
    // Learn from failed interaction
    try {
      const { MemoryService } = await import('./memoryService.js');
      const memoryService = new MemoryService();
      await memoryService.learnFromInteraction(userId, {
        type: 'jira_operation',
        operation: 'create_issue',
        success: false,
        projectKey: issueData.projectKey,
        issueType: issueData.issueType,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } catch (learningError) {
      console.log('Learning from failed Jira interaction failed:', learningError.message);
    }
    
    console.error('Error creating JIRA issue:', error);
    throw new Error('Failed to create JIRA issue');
  }
};

/**
 * Update an existing issue
 * @param {string} userId - User identifier
 * @param {string} issueKey - Issue key
 * @param {Object} issueData - Updated issue data
 * @returns {Promise<Object>} - Updated issue
 */
export const updateIssue = async (userId, issueKey, issueData) => {
  try {
    const updateFields = {};
    
    if (issueData.summary) updateFields.summary = issueData.summary;
    if (issueData.description) updateFields.description = issueData.description;
    if (issueData.priority) updateFields.priority = { name: issueData.priority };
    if (issueData.assignee) updateFields.assignee = { name: issueData.assignee };
    if (issueData.dueDate) updateFields.duedate = issueData.dueDate;
    if (issueData.labels) updateFields.labels = issueData.labels;
    if (issueData.components) updateFields.components = issueData.components.map(name => ({ name }));
    
    const response = await jiraRequest(`/issue/${issueKey}`, {
      method: 'PUT',
      body: JSON.stringify({
        fields: updateFields
      })
    });
    
    return {
      success: true,
      message: 'Issue updated successfully',
      issueKey
    };
    
  } catch (error) {
    console.error('Error updating JIRA issue:', error);
    throw new Error('Failed to update JIRA issue');
  }
};

/**
 * Transition issue status
 * @param {string} userId - User identifier
 * @param {string} issueKey - Issue key
 * @param {string} transitionId - Transition ID
 * @returns {Promise<Object>} - Transition result
 */
export const transitionIssue = async (userId, issueKey, transitionId) => {
  try {
    const response = await jiraRequest(`/issue/${issueKey}/transitions`, {
      method: 'POST',
      body: JSON.stringify({
        transition: {
          id: transitionId
        }
      })
    });
    
    return {
      success: true,
      message: 'Issue transitioned successfully',
      issueKey
    };
    
  } catch (error) {
    console.error('Error transitioning JIRA issue:', error);
    throw new Error('Failed to transition JIRA issue');
  }
};

/**
 * Get available transitions for an issue
 * @param {string} issueKey - Issue key
 * @returns {Promise<Array>} - List of available transitions
 */
export const getIssueTransitions = async (issueKey) => {
  try {
    const response = await jiraRequest(`/issue/${issueKey}/transitions`);
    
    return (response.transitions || []).map(transition => ({
      id: transition.id,
      name: transition.name,
      to: transition.to?.name || '',
      hasScreen: transition.hasScreen,
      isGlobal: transition.isGlobal,
      isInitial: transition.isInitial,
      isConditional: transition.isConditional
    }));
    
  } catch (error) {
    console.error('Error fetching JIRA issue transitions:', error);
    return [];
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
    const response = await jiraRequest('/project', {
      method: 'POST',
      body: JSON.stringify({
        key: projectData.key,
        name: projectData.name,
        description: projectData.description || '',
        projectTypeKey: projectData.projectTypeKey || 'software',
        projectTemplateKey: projectData.projectTemplateKey || 'com.pyxis.greenhopper.jira:gh-simplified-agility-kanban',
        leadAccountId: projectData.leadAccountId || JIRA_EMAIL
      })
    });
    
    return {
      id: response.id,
      key: response.key,
      name: response.name,
      description: response.description || '',
      lead: response.lead?.displayName || '',
      projectTypeKey: response.projectTypeKey,
      simplified: response.simplified,
      style: response.style,
      isPrivate: response.isPrivate
    };
    
  } catch (error) {
    console.error('Error creating JIRA project:', error);
    throw new Error('Failed to create JIRA project');
  }
};

/**
 * Test JIRA authentication and connection
 * @returns {Promise<Object>} - Authentication test result
 */
export const testJiraConnection = async () => {
  try {
    // Test with the /myself endpoint as recommended in the troubleshooting guide
    const response = await jiraRequest('/myself');
    
    return {
      success: true,
      message: 'JIRA authentication successful',
      user: {
        accountId: response.accountId,
        displayName: response.displayName,
        emailAddress: response.emailAddress,
        active: response.active,
        timeZone: response.timeZone
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'JIRA authentication failed',
      error: error.message,
      troubleshooting: [
        '1. Verify your Atlassian email address is correct',
        '2. Ensure your API token is valid and not expired',
        '3. Use your email address, not username',
        '4. Clear any CAPTCHA locks by logging into Atlassian web interface',
        '5. Check if your account has the necessary permissions'
      ]
    };
  }
};

/**
 * Get available issue types for a project
 * @param {string} projectKey - Project key
 * @returns {Promise<Array>} - List of issue types
 */
export const getProjectIssueTypes = async (projectKey) => {
  try {
    const response = await jiraRequest(`/project/${projectKey}`);
    
    return (response.issueTypes || []).map(issueType => ({
      id: issueType.id,
      name: issueType.name,
      description: issueType.description || '',
      iconUrl: issueType.iconUrl,
      subtask: issueType.subtask || false
    }));
    
  } catch (error) {
    console.error('Error fetching JIRA project issue types:', error);
    return [];
  }
};

/**
 * Get sprints for a project
 * @param {string} projectKey - Project key
 * @returns {Promise<Array>} - List of sprints
 */
export const getProjectSprints = async (projectKey) => {
  try {
    const response = await jiraRequest(`/agile/1.0/board?projectKeyOrId=${projectKey}`);
    
    if (response.values && response.values.length > 0) {
      const boardId = response.values[0].id;
      const sprintsResponse = await jiraRequest(`/agile/1.0/board/${boardId}/sprint`);
      
      return (sprintsResponse.values || []).map(sprint => ({
        id: sprint.id,
        name: sprint.name,
        state: sprint.state,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        goal: sprint.goal,
        boardId: sprint.boardId
      }));
    }
    
    return [];
    
  } catch (error) {
    console.error('Error fetching JIRA project sprints:', error);
    return [];
  }
};

 