/**
 * Embedding Worker
 * 
 * Worker thread for generating embeddings without blocking the main thread.
 * This is critical for mobile performance where CPU resources are limited.
 */

import { parentPort, workerData } from 'worker_threads';
import fetch from 'node-fetch';

// Ollama base URL - can be overridden via workerData
const OLLAMA_BASE_URL = workerData?.baseUrl || 'http://localhost:11434';

/**
 * Generate an embedding for the provided text using Ollama
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
async function generateEmbedding(text) {
  try {
    // Use Ollama's embedding API with llama-text-embed-v2 model
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response from Ollama');
    }

    return data.embedding;
  } catch (error) {
    // Fallback to hash-based embedding if Ollama is not available
    console.warn('Ollama embedding failed, using fallback:', error.message);
    return generateFallbackEmbedding(text);
  }
}

/**
 * Fallback embedding generation using hash-based method
 * @param {string} text - Text to embed
 * @returns {number[]} - Fallback embedding vector
 */
function generateFallbackEmbedding(text) {
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
}

// Handle messages from the main thread
parentPort.on('message', async (data) => {
  try {
    // Extract text from data
    const { text } = data;
    
    if (!text) {
      throw new Error('No text provided for embedding');
    }
    
    // Generate embedding in the worker thread (CPU-intensive task)
    const embedding = await generateEmbedding(text);
    
    // Send the result back to the main thread
    parentPort.postMessage({ data: embedding });
  } catch (error) {
    // Send any errors back to the main thread
    parentPort.postMessage({ error: error.message });
  }
}); 