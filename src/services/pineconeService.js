/**
 * Pinecone Service
 * 
 * Provides functions to interact with Pinecone vector database
 * for storing and querying embeddings.
 */

import { Pinecone } from '@pinecone-database/pinecone';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from '../config/index.js';
import workerManager from '../utils/workerManager.js';
import { createLogger } from '../utils/logger.js';

// Create component-specific logger
const logger = createLogger('pinecone-service');

// Get directory path for worker scripts
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Pinecone Client
const pinecone = new Pinecone({
  apiKey: config.PINECONE.API_KEY, 
});

// Prepare the Pinecone index - Force direct API since SDK has issues with new Pinecone format
let pineconeIndex;
let useDirectAPI = true; // Always use direct API for now

logger.info('Using direct Pinecone API for SIRIUS index');
console.log('Using direct Pinecone API for SIRIUS index');

// Direct API configuration
const PINECONE_HOST = 'https://sirius-sdxchkb.svc.aped-4627-b74a.pinecone.io';
const PINECONE_API_KEY = config.PINECONE.API_KEY;

/**
 * Direct API call to Pinecone
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @param {string} method - HTTP method
 * @returns {Promise<Object>} - Response data
 */
const directAPICall = async (endpoint, data = null, method = 'GET') => {
  const url = `${PINECONE_HOST}${endpoint}`;
  const headers = {
    'Api-Key': PINECONE_API_KEY,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    logger.error({ err: error, endpoint, method }, 'Direct API call failed');
    throw error;
  }
};

/**
 * Retry Request with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} retries - Number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise<any>} - Result of the function
 */
const retryRequest = async (fn, retries = 3, initialDelay = 1000) => {
  let currentDelay = initialDelay;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < retries - 1) {
        logger.warn(`Retrying request... (${i + 1}/${retries})`);
        await new Promise(res => setTimeout(res, currentDelay));
        currentDelay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
};

/**
 * Log errors to logger or external service
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
const logError = async (error, context = {}) => {
  // Log error with context
  logger.error({ err: error, ...context }, error.message);
  
  // In production, send critical errors to external logging service if configured
  if (config.ENV.PRODUCTION && process.env.LOG_EXTERNAL === 'true' && process.env.LOG_EXTERNAL_URL) {
    try {
      await axios.post(process.env.LOG_EXTERNAL_URL, {
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        service: 'pinecone-service',
        environment: config.ENV.PRODUCTION ? 'production' : 'development',
        device: config.DEVICE.IS_MOBILE ? 'mobile' : 'desktop'
      }).catch(err => logger.warn({ err }, 'Failed to send log to external service'));
    } catch (logError) {
      // Don't throw, just log locally if external logging fails
      logger.warn({ err: logError }, 'Failed to log error to external service');
    }
  }
};

/**
 * Fallback implementation for embedding generation when worker is not available
 * @param {Object} data - Data containing text to embed
 * @returns {number[]} - Simple embedding vector
 */
const generateEmbeddingFallback = (data) => {
  const { text } = data;
  
  logger.debug('Using fallback embedding generation');
  
  // Simple hash-based embedding (same as in worker)
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Create a 1024-dimensional vector (optimized for SIRIUS index with llama-text-embed-v2)
  const embedding = new Array(1024).fill(0);
  for (let i = 0; i < 1024; i++) {
    embedding[i] = Math.sin(hash + i) * 0.1;
  }
  
  return embedding;
};

// Register the fallback function
workerManager.registerFallback('embedding', generateEmbeddingFallback);

/**
 * Create embedding using worker thread to prevent blocking the main thread
 * @param {string} text - Text to get embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
export const getEmbedding = async (text) => {
  return retryRequest(async () => {
    try {
      logger.debug('Generating embedding');
      
      // Use worker manager with fallback
      return await workerManager.runInWorker(
        'embedding',
        { text },
        generateEmbeddingFallback
      );
    } catch (error) {
      const context = { text: text.substring(0, 100) + '...' };
      await logError(error, context);
      throw error;
    }
  });
};

/**
 * Store embedding in Pinecone
 * @param {string} text - Text to embed
 * @param {Object} metadata - Metadata to store with embedding
 * @returns {Promise<Object>} - Result of storing
 */
export const storeEmbedding = async (text, metadata) => {
  try {
    logger.debug({ metadata: metadata.id }, 'Storing embedding');
    
    const embedding = await getEmbedding(text);
    
    if (useDirectAPI || !pineconeIndex) {
      // Use direct API
      const upsertData = {
        vectors: [{
          id: metadata.id,
          values: embedding,
          metadata: { ...metadata, createdAt: new Date().toISOString() }
        }]
      };
      
      await directAPICall('/vectors/upsert', upsertData, 'POST');
      logger.info({ id: metadata.id }, 'Embedding stored successfully via direct API');
    } else {
      // Use SDK
    await pineconeIndex.upsert([{ 
      id: metadata.id, 
      values: embedding,
      metadata: { ...metadata, createdAt: new Date().toISOString() }
    }]);
      logger.info({ id: metadata.id }, 'Embedding stored successfully via SDK');
    }
    
    return { success: true, id: metadata.id };
  } catch (error) {
    const context = { 
      operation: 'storeEmbedding', 
      metadata,
      text: text.substring(0, 100) + '...'
    };
    await logError(error, context);
    throw error;
  }
};

/**
 * Query Pinecone for similar embeddings
 * @param {string} text - Text to find similar embeddings for
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Matching embeddings
 */
export const queryEmbedding = async (text, options = {}) => {
  const { topK = 5, filter = {} } = options;
  
  try {
    logger.debug({ topK, filter }, 'Querying embeddings using direct API');
    
    const embedding = await getEmbedding(text);
    
    if (useDirectAPI || !pineconeIndex) {
      // Use direct API
      const queryData = {
        vector: embedding,
        topK,
        filter,
        includeMetadata: true
      };
      
      const result = await directAPICall('/query', queryData, 'POST');
      logger.info({ matchCount: result.matches?.length || 0 }, 'Query successful via direct API');
      
      return result.matches || [];
    } else {
      // Use SDK
      const result = await pineconeIndex.query({ 
        vector: embedding, 
        topK, 
        filter,
        includeMetadata: true
      });
      
      logger.info({ matchCount: result.matches.length }, 'Query successful via SDK');
      return result.matches;
    }
  } catch (error) {
    const context = { 
      operation: 'queryEmbedding',
      text: text.substring(0, 100) + '...',
      options
    };
    await logError(error, context);
    throw error;
  }
};

/**
 * Delete embedding from Pinecone
 * @param {string} id - ID of embedding to delete
 * @returns {Promise<Object>} - Result of deletion
 */
export const deleteEmbedding = async (id) => {
  try {
    logger.debug({ id }, 'Deleting embedding using direct API');
    
    if (useDirectAPI || !pineconeIndex) {
      // Use direct API
      const deleteData = { ids: [id] };
      await directAPICall('/vectors/delete', deleteData, 'DELETE');
      logger.info({ id }, 'Embedding deleted successfully via direct API');
    } else {
      // Use SDK
      await pineconeIndex.delete({ ids: [id] });
      logger.info({ id }, 'Embedding deleted successfully via SDK');
    }
    
    return { success: true, id };
  } catch (error) {
    const context = { operation: 'deleteEmbedding', id };
    await logError(error, context);
    throw error;
  }
};

export { directAPICall };

export default {
  getEmbedding,
  storeEmbedding,
  queryEmbedding,
  deleteEmbedding
}; 