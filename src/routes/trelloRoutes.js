/**
 * Trello Routes - Trello Integration Endpoints
 * 
 * Handles API endpoints for Trello board management, card
 * operations, and project tracking.
 * 
 * Lines: 180
 */

// Express routing and validation
import { Router } from 'express';
import { body, param, query } from 'express-validator';

// Trello controller
import * as trelloController from '../controllers/trelloController.js';

// Validation middleware
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Get user's boards
 * GET /api/trello/boards?userId=string
 */
router.get('/boards', [
  query('userId').notEmpty().withMessage('userId is required'),
  validate
], trelloController.getBoards);

/**
 * Get board lists
 * GET /api/trello/boards/:boardId/lists
 */
router.get('/boards/:boardId/lists', [
  param('boardId').notEmpty().withMessage('boardId is required'),
  validate
], trelloController.getLists);

/**
 * Get list cards
 * GET /api/trello/lists/:listId/cards
 */
router.get('/lists/:listId/cards', [
  param('listId').notEmpty().withMessage('listId is required'),
  validate
], trelloController.getCards);

/**
 * Get all todos
 * GET /api/trello/todos?userId=string
 */
router.get('/todos', [
  query('userId').notEmpty().withMessage('userId is required'),
  validate
], trelloController.getAllTodos);

/**
 * Get urgent todos
 * GET /api/trello/todos/urgent?userId=string
 */
router.get('/todos/urgent', [
  query('userId').notEmpty().withMessage('userId is required'),
  validate
], trelloController.getUrgentTodos);

/**
 * Create a new todo
 * POST /api/trello/todos
 */
router.post('/todos', [
  body('userId').notEmpty().withMessage('userId is required'),
  body('todoData').isObject().withMessage('todoData must be an object'),
  body('todoData.name').notEmpty().withMessage('todo name is required'),
  validate
], trelloController.createTodo);

/**
 * Update a todo
 * PUT /api/trello/todos/:todoId
 */
router.put('/todos/:todoId', [
  param('todoId').notEmpty().withMessage('todoId is required'),
  body('userId').notEmpty().withMessage('userId is required'),
  body('todoData').isObject().withMessage('todoData must be an object'),
  validate
], trelloController.updateTodo);

/**
 * Complete a todo
 * POST /api/trello/todos/:todoId/complete
 */
router.post('/todos/:todoId/complete', [
  param('todoId').notEmpty().withMessage('todoId is required'),
  body('userId').notEmpty().withMessage('userId is required'),
  validate
], trelloController.completeTodo);

/**
 * Create a new board
 * POST /api/trello/boards
 */
router.post('/boards',
  trelloController.createBoard
);

/**
 * Create a new list
 * POST /api/trello/boards/:boardId/lists
 */
router.post('/boards/:boardId/lists',
  trelloController.createList
);

/**
 * Move a card to a different list
 * POST /api/trello/cards/:cardId/move
 */
router.post('/cards/:cardId/move',
  trelloController.moveCard
);

/**
 * Get marketing templates
 * GET /api/trello/templates
 */
router.get('/templates',
  trelloController.getMarketingTemplates
);

/**
 * Create marketing card with template
 * POST /api/trello/templates/:templateName
 */
router.post('/templates/:templateName',
  trelloController.createMarketingCard
);

/**
 * Add checklist to card
 * POST /api/trello/cards/:cardId/checklists
 */
router.post('/cards/:cardId/checklists',
  trelloController.addChecklistToCard
);

/**
 * Get Butler automation rules
 * GET /api/trello/butler/rules
 */
router.get('/butler/rules',
  trelloController.getButlerRules
);

/**
 * Execute Butler automation rule
 * POST /api/trello/butler/execute/:ruleName
 */
router.post('/butler/execute/:ruleName',
  trelloController.executeButlerRule
);

/**
 * Add new Butler rule
 * POST /api/trello/butler/rules
 */
router.post('/butler/rules',
  trelloController.addButlerRule
);

export default router; 