/**
 * Ollama Worker - AI Model Processing
 * 
 * Handles Ollama AI model operations in worker threads to prevent
 * blocking during text generation and model inference.
 * 
 * Lines: 58
 * Documentation: docs/AI_AND_OLLAMA.md
 */

// Node.js worker thread utilities and HTTP client
import { parentPort } from 'worker_threads';
import fetch from 'node-fetch';

/**
 * Make an API request to Ollama
 * @param {string} baseUrl - Ollama base URL
 * @param {string} endpoint - API endpoint
 * @param {Object} payload - Request payload
 * @returns {Promise<Object>} - API response
 */
async function makeOllamaRequest(baseUrl, endpoint, payload) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Ollama request failed: ${error.message}`);
  }
}

// Handle messages from the main thread
parentPort.on('message', async (data) => {
  try {
    // Extract data from message
    const { endpoint, payload, baseUrl } = data;
    
    if (!endpoint || !payload) {
      throw new Error('Missing required parameters for Ollama request');
    }
    
    // Execute the API request in the worker thread
    const result = await makeOllamaRequest(baseUrl, endpoint, payload);
    
    // Send successful result back to main thread
    parentPort.postMessage({ data: result });
  } catch (error) {
    // Send error back to main thread
    parentPort.postMessage({ error: error.message });
  }
}); 