/**
 * Trello Controller
 * 
 * Handles Trello integration business logic for S.I.R.I.U.S.
 * Manages boards, lists, cards, and Kanban workflows
 */

import * as trelloService from '../services/trelloService.js';
import logger from '../utils/logger.js';

/**
 * Get user's boards
 * GET /api/trello/boards
 */
export const getBoards = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    logger.info(`Fetching Trello boards for user: ${userId}`);
    const boards = await trelloService.getBoards(userId);
    
    res.json({
      success: true,
      message: 'Trello boards retrieved successfully',
      data: boards
    });
  } catch (error) {
    logger.error('Error fetching Trello boards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Trello boards'
    });
  }
};

/**
 * Get lists from a board
 * GET /api/trello/boards/:boardId/lists
 */
export const getLists = async (req, res) => {
  try {
    const { boardId } = req.params;
    
    logger.info(`Fetching Trello lists for board: ${boardId}`);
    const lists = await trelloService.getLists(boardId);
    
    res.json({
      success: true,
      message: 'Trello lists retrieved successfully',
      data: lists
    });
  } catch (error) {
    logger.error('Error fetching Trello lists:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Trello lists'
    });
  }
};

/**
 * Get cards from a list
 * GET /api/trello/lists/:listId/cards
 */
export const getCards = async (req, res) => {
  try {
    const { listId } = req.params;
    
    logger.info(`Fetching Trello cards for list: ${listId}`);
    const cards = await trelloService.getCards(listId);
    
    res.json({
      success: true,
      message: 'Trello cards retrieved successfully',
      data: cards
    });
  } catch (error) {
    logger.error('Error fetching Trello cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Trello cards'
    });
  }
};

/**
 * Get all todos (cards) from user's boards
 * GET /api/trello/todos
 */
export const getAllTodos = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    logger.info(`Fetching all Trello todos for user: ${userId}`);
    const todos = await trelloService.getAllTodos(userId);
    
    res.json({
      success: true,
      message: 'Trello todos retrieved successfully',
      data: todos
    });
  } catch (error) {
    logger.error('Error fetching Trello todos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Trello todos'
    });
  }
};

/**
 * Get urgent todos (due today or overdue)
 * GET /api/trello/todos/urgent
 */
export const getUrgentTodos = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    logger.info(`Fetching urgent Trello todos for user: ${userId}`);
    const todos = await trelloService.getUrgentTodos(userId);
    
    res.json({
      success: true,
      message: 'Urgent Trello todos retrieved successfully',
      data: todos
    });
  } catch (error) {
    logger.error('Error fetching urgent Trello todos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch urgent Trello todos'
    });
  }
};

/**
 * Create a new todo (card)
 * POST /api/trello/todos
 */
export const createTodo = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const todoData = req.body;
    
    // Validate required fields
    if (!todoData.title || !todoData.listId) {
      return res.status(400).json({
        success: false,
        error: 'Title and listId are required'
      });
    }
    
    logger.info(`Creating Trello todo for user: ${userId}`, { title: todoData.title });
    
    const todo = await trelloService.createTodo(userId, todoData);
    
    res.status(201).json({
      success: true,
      message: 'Trello todo created successfully',
      data: todo
    });
  } catch (error) {
    logger.error('Error creating Trello todo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Trello todo'
    });
  }
};

/**
 * Update a todo (card)
 * PUT /api/trello/todos/:todoId
 */
export const updateTodo = async (req, res) => {
  try {
    const { todoId } = req.params;
    const { userId = 'default' } = req.query;
    const todoData = req.body;
    
    logger.info(`Updating Trello todo: ${todoId} for user: ${userId}`);
    
    const result = await trelloService.updateTodo(userId, todoId, todoData);
    
    res.json({
      success: true,
      message: 'Trello todo updated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error updating Trello todo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Trello todo'
    });
  }
};

/**
 * Complete a todo (card)
 * POST /api/trello/todos/:todoId/complete
 */
export const completeTodo = async (req, res) => {
  try {
    const { todoId } = req.params;
    const { userId = 'default' } = req.query;
    
    logger.info(`Completing Trello todo: ${todoId} for user: ${userId}`);
    
    const result = await trelloService.completeTodo(userId, todoId);
    
    res.json({
      success: true,
      message: 'Trello todo completed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error completing Trello todo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete Trello todo'
    });
  }
};

/**
 * Delete a todo (card)
 * DELETE /api/trello/todos/:todoId
 */
export const deleteTodo = async (req, res) => {
  try {
    const { todoId } = req.params;
    const { userId = 'default' } = req.query;
    
    logger.info(`Deleting Trello todo: ${todoId} for user: ${userId}`);
    
    const result = await trelloService.deleteTodo(userId, todoId);
    
    res.json({
      success: true,
      message: 'Trello todo deleted successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error deleting Trello todo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete Trello todo'
    });
  }
};

/**
 * Create a new board
 * POST /api/trello/boards
 */
export const createBoard = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Board name is required'
      });
    }
    
    logger.info(`Creating Trello board: ${name} for user: ${userId}`);
    
    const board = await trelloService.createBoard(userId, { name, description });
    
    res.status(201).json({
      success: true,
      message: 'Trello board created successfully',
      data: board
    });
  } catch (error) {
    logger.error('Error creating Trello board:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Trello board'
    });
  }
};

/**
 * Create a new list
 * POST /api/trello/boards/:boardId/lists
 */
export const createList = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'List name is required'
      });
    }
    
    logger.info(`Creating Trello list: ${name} in board: ${boardId}`);
    
    const list = await trelloService.createList(boardId, { name });
    
    res.status(201).json({
      success: true,
      message: 'Trello list created successfully',
      data: list
    });
  } catch (error) {
    logger.error('Error creating Trello list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Trello list'
    });
  }
};

/**
 * Move a card to a different list
 * POST /api/trello/cards/:cardId/move
 */
export const moveCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { listId } = req.body;
    
    if (!listId) {
      return res.status(400).json({
        success: false,
        error: 'Target listId is required'
      });
    }
    
    logger.info(`Moving Trello card: ${cardId} to list: ${listId}`);
    
    const result = await trelloService.moveCard(cardId, listId);
    
    res.json({
      success: true,
      message: 'Trello card moved successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error moving Trello card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to move Trello card'
    });
  }
};

/**
 * Get marketing templates
 * GET /api/trello/templates
 */
export const getMarketingTemplates = async (req, res) => {
  try {
    logger.info('Fetching marketing templates');
    
    const templates = trelloService.getMarketingTemplates();
    
    res.json({
      success: true,
      message: 'Marketing templates retrieved successfully',
      data: templates
    });
  } catch (error) {
    logger.error('Error fetching marketing templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketing templates'
    });
  }
};

/**
 * Create marketing card with template
 * POST /api/trello/templates/:templateName
 */
export const createMarketingCard = async (req, res) => {
  try {
    const { templateName } = req.params;
    const { userId = 'default' } = req.query;
    const customData = req.body;
    
    logger.info(`Creating marketing card with template: ${templateName}`);
    
    const card = await trelloService.createMarketingCard(userId, templateName, customData);
    
    res.status(201).json({
      success: true,
      message: 'Marketing card created successfully',
      data: card
    });
  } catch (error) {
    logger.error('Error creating marketing card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create marketing card'
    });
  }
};

/**
 * Add checklist to card
 * POST /api/trello/cards/:cardId/checklists
 */
export const addChecklistToCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { name, items = [] } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Checklist name is required'
      });
    }
    
    logger.info(`Adding checklist to card: ${cardId}`);
    
    const checklist = await trelloService.addChecklistToCard(cardId, name, items);
    
    res.status(201).json({
      success: true,
      message: 'Checklist added successfully',
      data: checklist
    });
  } catch (error) {
    logger.error('Error adding checklist to card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add checklist to card'
    });
  }
};

/**
 * Get Butler automation rules
 * GET /api/trello/butler/rules
 */
export const getButlerRules = async (req, res) => {
  try {
    const butlerService = await import('../services/butlerAutomationService.js');
    const rules = butlerService.getButlerRules();
    
    res.json({
      success: true,
      message: 'Butler rules retrieved successfully',
      data: rules
    });
  } catch (error) {
    logger.error('Error fetching Butler rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Butler rules'
    });
  }
};

/**
 * Execute Butler automation rule
 * POST /api/trello/butler/execute/:ruleName
 */
export const executeButlerRule = async (req, res) => {
  try {
    const { ruleName } = req.params;
    const context = req.body;
    
    const butlerService = await import('../services/butlerAutomationService.js');
    const result = await butlerService.executeButlerRule(ruleName, context);
    
    res.json({
      success: true,
      message: 'Butler rule executed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error executing Butler rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute Butler rule'
    });
  }
};

/**
 * Add new Butler rule
 * POST /api/trello/butler/rules
 */
export const addButlerRule = async (req, res) => {
  try {
    const { ruleName, rule } = req.body;
    
    if (!ruleName || !rule) {
      return res.status(400).json({
        success: false,
        error: 'Rule name and rule configuration are required'
      });
    }
    
    const butlerService = await import('../services/butlerAutomationService.js');
    const addedRule = butlerService.addButlerRule(ruleName, rule);
    
    res.status(201).json({
      success: true,
      message: 'Butler rule added successfully',
      data: addedRule
    });
  } catch (error) {
    logger.error('Error adding Butler rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add Butler rule'
    });
  }
}; 