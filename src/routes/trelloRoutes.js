/**
 * Trello Routes
 * 
 * Trello integration endpoints for S.I.R.I.U.S.
 * Manages boards, lists, cards, and Kanban workflows
 */

import { Router } from 'express';
import * as trelloController from '../controllers/trelloController.js';
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Get user's boards
 * GET /api/trello/boards
 */
router.get('/boards',
  trelloController.getBoards
);

/**
 * Get lists from a board
 * GET /api/trello/boards/:boardId/lists
 */
router.get('/boards/:boardId/lists',
  trelloController.getLists
);

/**
 * Get cards from a list
 * GET /api/trello/lists/:listId/cards
 */
router.get('/lists/:listId/cards',
  trelloController.getCards
);

/**
 * Get all todos (cards) from user's boards
 * GET /api/trello/todos
 */
router.get('/todos',
  trelloController.getAllTodos
);

/**
 * Get urgent todos (due today or overdue)
 * GET /api/trello/todos/urgent
 */
router.get('/todos/urgent',
  trelloController.getUrgentTodos
);

/**
 * Create a new todo (card)
 * POST /api/trello/todos
 */
router.post('/todos',
  trelloController.createTodo
);

/**
 * Update a todo (card)
 * PUT /api/trello/todos/:todoId
 */
router.put('/todos/:todoId',
  trelloController.updateTodo
);

/**
 * Complete a todo (card)
 * POST /api/trello/todos/:todoId/complete
 */
router.post('/todos/:todoId/complete',
  trelloController.completeTodo
);

/**
 * Delete a todo (card)
 * DELETE /api/trello/todos/:todoId
 */
router.delete('/todos/:todoId',
  trelloController.deleteTodo
);

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