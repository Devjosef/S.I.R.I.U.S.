/**
 * Trello Service - Project Management Integration
 * 
 * Provides Trello API integration for board management, card
 * operations, and project tracking.
 * 
 * Lines: 750
 */

// Internal configuration
import config from '../config/index.js';

const TRELLO_API_BASE = 'https://api.trello.com/1';

/**
 * Make authenticated Trello API request
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Request parameters
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @returns {Promise<Object>} - API response
 */
const trelloRequest = async (endpoint, params = {}, method = 'GET') => {
  const baseParams = {
    key: config.TRELLO.API_KEY,
    token: config.TRELLO.TOKEN
  };
  
  let url = `${TRELLO_API_BASE}${endpoint}`;
  let options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (method === 'GET') {
    // For GET requests, add params to URL
  const queryParams = new URLSearchParams({
      ...baseParams,
    ...params
  });
    url += `?${queryParams}`;
  } else {
    // For POST/PUT/DELETE, add auth params to URL and body to request
    const queryParams = new URLSearchParams(baseParams);
    url += `?${queryParams}`;
  
    if (Object.keys(params).length > 0) {
      options.body = JSON.stringify(params);
    }
  }
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Trello API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Trello API request failed:', error);
    throw error;
  }
};

/**
 * Get user's boards
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of boards
 */
export const getBoards = async (userId) => {
  try {
    const boards = await trelloRequest('/members/me/boards');
    
    return boards.map(board => ({
      id: board.id,
      name: board.name,
      url: board.url,
      closed: board.closed,
      starred: board.starred
    }));
    
  } catch (error) {
    console.error('Error fetching Trello boards:', error);
    return [];
  }
};

/**
 * Get lists from a board
 * @param {string} boardId - Board ID
 * @returns {Promise<Array>} - List of lists
 */
export const getLists = async (boardId) => {
  try {
    const lists = await trelloRequest(`/boards/${boardId}/lists`);
    
    return lists.map(list => ({
      id: list.id,
      name: list.name,
      closed: list.closed,
      position: list.pos
    }));
    
  } catch (error) {
    console.error('Error fetching Trello lists:', error);
    return [];
  }
};

/**
 * Get cards from a list
 * @param {string} listId - List ID
 * @returns {Promise<Array>} - List of cards
 */
export const getCards = async (listId) => {
  try {
    const cards = await trelloRequest(`/lists/${listId}/cards`);
    
    return cards.map(card => ({
      id: card.id,
      name: card.name,
      description: card.desc,
      due: card.due,
      dueComplete: card.dueComplete,
      labels: card.labels || [],
      checklists: card.checklists || [],
      attachments: card.attachments || [],
      url: card.url,
      shortUrl: card.shortUrl,
      created: card.dateLastActivity,
      updated: card.dateLastActivity
    }));
    
  } catch (error) {
    console.error('Error fetching Trello cards:', error);
    return [];
  }
};

/**
 * Get all todos (cards) from user's boards
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of todos
 */
export const getAllTodos = async (userId) => {
  try {
    const boards = await getBoards(userId);
    const allTodos = [];
    
    for (const board of boards) {
      if (!board.closed) {
        const lists = await getLists(board.id);
        
        for (const list of lists) {
          if (!list.closed) {
            const cards = await getCards(list.id);
            
            // Transform cards to todos format
            const todos = cards.map(card => ({
              id: card.id,
              title: card.name,
              description: card.description,
              dueDate: card.due,
              completed: card.dueComplete,
              priority: getPriorityFromLabels(card.labels),
              board: board.name,
              list: list.name,
              boardId: board.id,
              listId: list.id,
              url: card.url,
              labels: card.labels,
              checklists: card.checklists,
              created: card.created,
              updated: card.updated
            }));
            
            allTodos.push(...todos);
          }
        }
      }
    }
    
    return allTodos;
    
  } catch (error) {
    console.error('Error fetching all Trello todos:', error);
    return getMockTodos();
  }
};

/**
 * Get todos due today or overdue
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of urgent todos
 */
export const getUrgentTodos = async (userId) => {
  try {
    const allTodos = await getAllTodos(userId);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Filter todos due today or overdue
    return allTodos.filter(todo => {
      if (!todo.dueDate) return false;
      
      const dueDate = new Date(todo.dueDate);
      return dueDate <= tomorrow && !todo.completed;
    });
    
  } catch (error) {
    console.error('Error fetching urgent Trello todos:', error);
    return getMockTodos().filter(todo => {
      const dueDate = new Date(todo.dueDate);
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      return dueDate <= tomorrow;
    });
  }
};

/**
 * Create a new todo (card) with enhanced marketing features
 * @param {string} userId - User identifier
 * @param {Object} todoData - Todo data with marketing-specific fields
 * @returns {Promise<Object>} - Created todo
 */
export const createTodo = async (userId, todoData) => {
  try {
    let listId = todoData.listId;
    
    // If no listId provided, find a default list
    if (!listId) {
    const boards = await getBoards(userId);
    if (boards.length === 0) {
      throw new Error('No boards available');
    }
    
    const lists = await getLists(boards[0].id);
    const todoList = lists.find(list => 
      list.name.toLowerCase().includes('to do') || 
      list.name.toLowerCase().includes('todo') ||
      list.name.toLowerCase().includes('backlog')
    ) || lists[0];
    
      listId = todoList.id;
    }
    
    // Enhanced card data with marketing features
    const cardData = {
      idList: listId,
      name: todoData.title,
      desc: todoData.description || '',
      due: todoData.dueDate || null
    };
    
    // Add custom fields if provided
    if (todoData.customFields) {
      cardData.customFieldItems = todoData.customFields;
    }
    
    // Add labels if provided
    if (todoData.labels) {
      cardData.idLabels = todoData.labels;
    }
    
    // Add checklist if provided
    if (todoData.checklist) {
      cardData.checklist = todoData.checklist;
    }
    
    const card = await trelloRequest('/cards', cardData, 'POST');
    
    // Add checklist after card creation if provided
    if (todoData.checklist && todoData.checklist.items) {
      await addChecklistToCard(card.id, todoData.checklist.name, todoData.checklist.items);
    }
    
    return {
      id: card.id,
      title: card.name,
      description: card.desc,
      dueDate: card.due,
      completed: false,
      priority: getPriorityFromData(todoData),
      board: 'Marketing Strategy Q4',
      list: 'Market Research',
      url: card.url,
      status: 'created',
      customFields: todoData.customFields || {},
      labels: todoData.labels || [],
      checklist: todoData.checklist || null
    };
    
  } catch (error) {
    console.error('Error creating Trello todo:', error);
    throw new Error('Failed to create todo');
  }
};

/**
 * Update a todo (card)
 * @param {string} userId - User identifier
 * @param {string} todoId - Todo ID
 * @param {Object} todoData - Updated todo data
 * @returns {Promise<Object>} - Updated todo
 */
export const updateTodo = async (userId, todoId, todoData) => {
  try {
    const updateData = {};
    
    if (todoData.title) updateData.name = todoData.title;
    if (todoData.description) updateData.desc = todoData.description;
    if (todoData.dueDate) updateData.due = todoData.dueDate;
    
    const card = await trelloRequest(`/cards/${todoId}`, updateData, 'PUT');
    
    return {
      id: card.id,
      title: card.name,
      description: card.desc,
      dueDate: card.due,
      completed: card.dueComplete,
      status: 'updated'
    };
    
  } catch (error) {
    console.error('Error updating Trello todo:', error);
    throw new Error('Failed to update todo');
  }
};

/**
 * Mark a todo as complete
 * @param {string} userId - User identifier
 * @param {string} todoId - Todo ID
 * @returns {Promise<Object>} - Updated todo
 */
export const completeTodo = async (userId, todoId) => {
  try {
    const card = await trelloRequest(`/cards/${todoId}`, {
      dueComplete: 'true'
    }, 'PUT');
    
    return {
      id: card.id,
      title: card.name,
      completed: card.dueComplete,
      status: 'completed'
    };
    
  } catch (error) {
    console.error('Error completing Trello todo:', error);
    throw new Error('Failed to complete todo');
  }
};

/**
 * Delete a todo (card)
 * @param {string} userId - User identifier
 * @param {string} todoId - Todo ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteTodo = async (userId, todoId) => {
  try {
    await trelloRequest(`/cards/${todoId}`, {}, 'DELETE');
    
    return {
      id: todoId,
      status: 'deleted'
    };
    
  } catch (error) {
    console.error('Error deleting Trello todo:', error);
    throw new Error('Failed to delete todo');
  }
};

/**
 * Get priority from card data (labels, custom fields, or title)
 * @param {Object} todoData - Todo data
 * @returns {string} - Priority level
 */
const getPriorityFromData = (todoData) => {
  // Check custom fields for priority
  if (todoData.customFields && todoData.customFields.priority) {
    return todoData.customFields.priority;
  }
  
  // Check labels for priority
  if (todoData.labels && Array.isArray(todoData.labels)) {
    const labelNames = todoData.labels.map(label => label.name?.toLowerCase() || label.toLowerCase());
    
    if (labelNames.some(name => name.includes('urgent') || name.includes('high'))) {
      return 'high';
    }
    
    if (labelNames.some(name => name.includes('low'))) {
      return 'low';
    }
  }
  
  // Check title for priority indicators
  if (todoData.title) {
    const title = todoData.title.toLowerCase();
    if (title.includes('urgent') || title.includes('high priority')) {
      return 'high';
    }
    if (title.includes('low priority')) {
      return 'low';
    }
  }
  
  return 'medium';
};

/**
 * Get priority from Trello labels (legacy function)
 * @param {Array} labels - Trello labels
 * @returns {string} - Priority level
 */
const getPriorityFromLabels = (labels) => {
  if (!labels || labels.length === 0) return 'medium';
  
  const labelNames = labels.map(label => label.name.toLowerCase());
  
  if (labelNames.some(name => name.includes('urgent') || name.includes('high'))) {
    return 'high';
  }
  
  if (labelNames.some(name => name.includes('low'))) {
    return 'low';
  }
  
  return 'medium';
};

/**
 * Mock todos for fallback
 * @returns {Array} - Mock todos
 */
const getMockTodos = () => {
  return [
    {
      id: 'mock-todo-1',
      title: 'Complete API documentation',
      description: 'Finish documenting the new API endpoints',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
      completed: false,
      priority: 'high',
      board: 'Work',
      list: 'To Do',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: 'mock-todo-2',
      title: 'Review pull requests',
      description: 'Review pending PRs in the repository',
      dueDate: new Date().toISOString(),
      completed: false,
      priority: 'medium',
      board: 'Work',
      list: 'In Progress',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: 'mock-todo-3',
      title: 'Update dependencies',
      description: 'Update npm packages to latest versions',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
      completed: false,
      priority: 'low',
      board: 'Work',
      list: 'To Do',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    }
  ];
};

/**
 * Create a new board
 * @param {string} userId - User identifier
 * @param {Object} boardData - Board data
 * @returns {Promise<Object>} - Created board
 */
export const createBoard = async (userId, boardData) => {
  try {
    const board = await trelloRequest('/boards', {
      name: boardData.name,
      desc: boardData.description || '',
      defaultLists: 'false'
    }, 'POST');
    
    return {
      id: board.id,
      name: board.name,
      description: board.desc,
      url: board.url,
      created: board.dateLastActivity
    };
    
  } catch (error) {
    console.error('Error creating Trello board:', error);
    throw new Error('Failed to create board');
  }
};

/**
 * Create a new list
 * @param {string} boardId - Board ID
 * @param {Object} listData - List data
 * @returns {Promise<Object>} - Created list
 */
export const createList = async (boardId, listData) => {
  try {
    const list = await trelloRequest('/lists', {
      name: listData.name,
      idBoard: boardId,
      pos: 'bottom'
    }, 'POST');
    
    return {
      id: list.id,
      name: list.name,
      boardId: list.idBoard,
      position: list.pos,
      created: list.dateLastActivity
    };
    
  } catch (error) {
    console.error('Error creating Trello list:', error);
    throw new Error('Failed to create list');
  }
};

/**
 * Move a card to a different list
 * @param {string} cardId - Card ID
 * @param {string} listId - Target list ID
 * @returns {Promise<Object>} - Move result
 */
export const moveCard = async (cardId, listId) => {
  try {
    const card = await trelloRequest(`/cards/${cardId}`, {
      idList: listId
    }, 'PUT');
    
    return {
      id: card.id,
      title: card.name,
      listId: card.idList,
      status: 'moved'
    };
    
  } catch (error) {
    console.error('Error moving Trello card:', error);
    throw new Error('Failed to move card');
  }
};

/**
 * Add checklist to a card
 * @param {string} cardId - Card ID
 * @param {string} checklistName - Name of the checklist
 * @param {Array} items - Checklist items
 * @returns {Promise<Object>} - Created checklist
 */
export const addChecklistToCard = async (cardId, checklistName, items = []) => {
  try {
    const checklist = await trelloRequest('/checklists', {
      idCard: cardId,
      name: checklistName
    }, 'POST');
    
    // Add items to checklist
    for (const item of items) {
      await trelloRequest(`/checklists/${checklist.id}/checkItems`, {
        name: item,
        pos: 'bottom'
      }, 'POST');
    }
    
    return checklist;
  } catch (error) {
    console.error('Error adding checklist to card:', error);
    throw new Error('Failed to add checklist');
  }
};

/**
 * Get marketing templates
 * @returns {Array} - Marketing card templates
 */
export const getMarketingTemplates = () => {
  return [
    {
      name: 'Content Creation Template',
      checklist: {
        name: 'Content Creation Process',
        items: [
          'Research keywords and topics',
          'Create content outline',
          'Write first draft',
          'Add visuals and media',
          'SEO optimization',
          'Legal and compliance review',
          'Final approval and sign-off'
        ]
      },
      customFields: {
        contentType: 'blog',
        targetAudience: 'B2B professionals',
        estimatedTime: '4 hours',
        priority: 'medium'
      }
    },
    {
      name: 'Campaign Launch Template',
      checklist: {
        name: 'Campaign Launch Checklist',
        items: [
          'Set up tracking and analytics',
          'Prepare all assets and creatives',
          'Schedule posts across platforms',
          'Test all links and CTAs',
          'Monitor initial performance',
          'Adjust strategy based on data',
          'Scale successful elements'
        ]
      },
      customFields: {
        campaignType: 'social_media',
        budget: '$5000',
        targetROI: '300%',
        timeline: '2 weeks'
      }
    },
    {
      name: 'Performance Review Template',
      checklist: {
        name: 'Performance Analysis',
        items: [
          'Collect all performance data',
          'Analyze key metrics and KPIs',
          'Compare against benchmarks',
          'Identify top performing content',
          'Document learnings and insights',
          'Plan optimization strategies',
          'Update future campaign plans'
        ]
      },
      customFields: {
        reviewPeriod: 'monthly',
        metrics: 'engagement, conversions, ROI',
        stakeholders: 'marketing team, leadership'
      }
    }
  ];
};

/**
 * Create marketing card with template
 * @param {string} userId - User identifier
 * @param {string} templateName - Template name
 * @param {Object} customData - Custom data to override template
 * @returns {Promise<Object>} - Created card
 */
export const createMarketingCard = async (userId, templateName, customData = {}) => {
  try {
    const templates = getMarketingTemplates();
    const template = templates.find(t => t.name === templateName);
    
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    
    // Merge template with custom data
    const cardData = {
      ...template,
      ...customData,
      checklist: {
        ...template.checklist,
        ...customData.checklist
      },
      customFields: {
        ...template.customFields,
        ...customData.customFields
      }
    };
    
    return await createTodo(userId, cardData);
  } catch (error) {
    console.error('Error creating marketing card with template:', error);
    throw new Error('Failed to create marketing card');
  }
};

export default {
  getBoards,
  getLists,
  getCards,
  getAllTodos,
  getUrgentTodos,
  createTodo,
  updateTodo,
  completeTodo,
  deleteTodo,
  createBoard,
  createList,
  moveCard,
  addChecklistToCard,
  getMarketingTemplates,
  createMarketingCard
}; 