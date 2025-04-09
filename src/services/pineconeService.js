/**
 * Pinecone Service
 * 
 * Provides functions to interact with Pinecone vector database
 * for storing and querying embeddings.
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import axios from 'axios';
import config from '../config/index.js';

// Initialize OpenAI Client
const openai = new OpenAI({
  apiKey: config.OPENAI.API_KEY,
});

// Initialize Pinecone Client
const pinecone = new Pinecone({
  apiKey: config.PINECONE.API_KEY, 
});

// Prepare the Pinecone index
let pineconeIndex;
try {
  pineconeIndex = pinecone.Index(config.PINECONE.INDEX_NAME);
} catch (error) {
  console.error('Failed to initialize Pinecone index:', error.message);
}

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
        console.warn(`Retrying request... (${i + 1}/${retries})`);
        await new Promise(res => setTimeout(res, currentDelay));
        currentDelay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
};

/**
 * Log errors to console or external service
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
const logError = async (error, context = {}) => {
  // In development, just log to console
  if (!config.ENV.PRODUCTION) {
    console.error('Error:', error.message, context);
    return;
  }
  
  // In production, add additional logging as needed
  try {
    console.error('Error:', error.message, context);
    
    // Example of sending to a logging service:
    // const loggingServiceUrl = process.env.LOGGING_SERVICE_URL;
    // if (loggingServiceUrl) {
    //   await axios.post(loggingServiceUrl, {
    //     error: error.message,
    //     stack: error.stack,
    //     context,
    //     timestamp: new Date().toISOString(),
    //     service: 'pinecone-service'
    //   });
    // }
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
};

/**
 * Get embedding from OpenAI
 * @param {string} text - Text to get embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
export const getEmbedding = async (text) => {
  return retryRequest(async () => {
    try {
      const response = await openai.embeddings.create({
        model: config.OPENAI.EMBEDDING_MODEL,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      const context = { text: text.substring(0, 100) + '...' };
      
      if (error.response) {
        context.statusCode = error.response.status;
        context.responseData = error.response.data;
      } else if (error.request) {
        context.networkError = true;
      }
      
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
  if (!pineconeIndex) {
    throw new Error('Pinecone index not initialized');
  }
  
  try {
    const embedding = await getEmbedding(text);
    await pineconeIndex.upsert([{ 
      id: metadata.id, 
      values: embedding,
      metadata: { ...metadata, createdAt: new Date().toISOString() }
    }]);
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
  if (!pineconeIndex) {
    throw new Error('Pinecone index not initialized');
  }
  
  const { topK = 5, filter = {} } = options;
  
  try {
    const embedding = await getEmbedding(text);
    const result = await pineconeIndex.query({ 
      vector: embedding, 
      topK, 
      filter,
      includeMetadata: true
    });
    return result.matches;
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
  if (!pineconeIndex) {
    throw new Error('Pinecone index not initialized');
  }
  
  try {
    await pineconeIndex.delete({ ids: [id] });
    return { success: true, id };
  } catch (error) {
    const context = { operation: 'deleteEmbedding', id };
    await logError(error, context);
    throw error;
  }
};

export default {
  getEmbedding,
  storeEmbedding,
  queryEmbedding,
  deleteEmbedding
}; 