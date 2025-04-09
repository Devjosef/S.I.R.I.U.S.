import pineconeService from '../services/pineconeService.js';
import { ValidationError } from '../middleware/errorHandler.js';

/**
 * Store an embedding in Pinecone
 */
export const storeEmbedding = async (req, res, next) => {
  try {
    const { text, id, ...metadata } = req.body;
    
    if (!text || !id) {
      throw new ValidationError('Text and ID are required');
    }
    
    const result = await pineconeService.storeEmbedding(text, { id, ...metadata });
    res.status(200).json({
      message: 'Embedding stored successfully',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Query Pinecone for similar embeddings
 */
export const queryEmbedding = async (req, res, next) => {
  try {
    const { text, topK, filter } = req.body;
    
    if (!text) {
      throw new ValidationError('Text is required');
    }
    
    const options = {};
    if (topK) options.topK = parseInt(topK, 10);
    if (filter) options.filter = filter;
    
    const matches = await pineconeService.queryEmbedding(text, options);
    res.status(200).json({
      message: 'Query successful',
      matches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an embedding from Pinecone
 */
export const deleteEmbedding = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      throw new ValidationError('ID is required');
    }
    
    const result = await pineconeService.deleteEmbedding(id);
    res.status(200).json({
      message: 'Embedding deleted successfully',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export default {
  storeEmbedding,
  queryEmbedding,
  deleteEmbedding
}; 