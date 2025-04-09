import { Router } from 'express';
import { body, param } from 'express-validator';
import pineconeController from '../controllers/pineconeController.js';
import validate from '../middleware/validator.js';

const router = Router();

/**
 * @route POST /api/pinecone/store
 * @desc Store an embedding in Pinecone
 * @access Public
 */
router.post('/store', [
  body('text').notEmpty().withMessage('Text is required'),
  body('id').notEmpty().withMessage('ID is required'),
  validate
], pineconeController.storeEmbedding);

/**
 * @route POST /api/pinecone/query
 * @desc Query Pinecone for similar embeddings
 * @access Public
 */
router.post('/query', [
  body('text').notEmpty().withMessage('Text is required'),
  body('topK').optional().isInt({ min: 1, max: 100 }).withMessage('topK must be between 1 and 100'),
  validate
], pineconeController.queryEmbedding);

/**
 * @route DELETE /api/pinecone/:id
 * @desc Delete an embedding from Pinecone
 * @access Public
 */
router.delete('/:id', [
  param('id').notEmpty().withMessage('ID is required'),
  validate
], pineconeController.deleteEmbedding);

export default router; 