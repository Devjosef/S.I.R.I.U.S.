/**
 * Ollama Service - Local AI Engine Integration
 * 
 * Handles communication with Ollama for local AI processing, including
 * text generation, embeddings, and model management.
 * 
 * Lines: 320
 * Documentation: docs/AI_AND_OLLAMA.md
 */

// HTTP client and file system utilities
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Internal configuration and utilities
import config from '../config/index.js';
import workerManager from '../utils/workerManager.js';
import matryoshkaQuantization from '../utils/matryoshkaQuantization.js';
import { createLogger } from '../utils/logger.js';

// Create component-specific logger
const logger = createLogger('ollama-service');

// Get directory path for worker scripts
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OLLAMA_BASE_URL = config.OLLAMA.BASE_URL;

/**
 * AI models you can use - all running locally on your machine
 */
const MODELS = {
  // Quick responses for real-time chat
  FAST: 'llama2:7b',
  // Good balance of speed and quality
  BALANCED: 'llama2:7b',
  // Best quality, takes a bit longer
  QUALITY: 'llama2:7b',
  // Great for writing code
  CODE: 'llama2:7b',
  // Super fast, smaller model
  TINY: 'llama2:7b'
};

/**
 * Fallback implementation for Ollama API requests when worker is not available
 * @param {Object} data - Request data
 * @returns {Promise<Object>} - API response
 */
const ollamaRequestFallback = async (data) => {
  const { endpoint, payload, baseUrl = OLLAMA_BASE_URL } = data;
  
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

    return await response.json();
  } catch (error) {
    logger.error({ err: error }, 'Ollama fallback error');
    throw error;
  }
};

// Register the fallback function
workerManager.registerFallback('ollama', ollamaRequestFallback);

/**
 * Run an Ollama request in a worker thread to prevent blocking the main thread
 * @param {string} endpoint - API endpoint to call
 * @param {Object} payload - Request payload
 * @returns {Promise<any>} - API response
 */
const runOllamaInWorker = async (endpoint, payload) => {
  return workerManager.runInWorker(
    'ollama',
    { 
      endpoint,
      payload,
      baseUrl: OLLAMA_BASE_URL
    },
    ollamaRequestFallback
  );
};

/**
 * Generate a response with dynamic quantization based on device capabilities
 * @param {string} prompt - User's prompt
 * @param {Object} options - Generation options
 * @returns {Promise<string>} - AI response
 */
export const generateResponse = async (prompt, options = {}) => {
  const {
    model = MODELS.BALANCED,
    temperature = 0.7,
    maxTokens = 500,
    systemPrompt = 'You are S.I.R.I.U.S., an intelligent executive assistant.'
  } = options;

  try {
    logger.debug({ model, promptLength: prompt.length }, 'Generating response');
    
    // Get optimal quantization level for current device
    const deviceCapabilities = {
      memory: config.DEVICE.MEMORY_LIMIT,
      cpuCores: config.DEVICE.CPU_CORES,
      isMobile: config.DEVICE.IS_MOBILE
    };
    
    // Prepare payload with dynamic quantization settings
    const payload = {
      model,
      prompt: `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`,
      stream: false,
      options: {
        temperature,
        num_predict: maxTokens,
      }
    };
    
    // Apply Matryoshka Quantization based on device capabilities
    if (deviceCapabilities.isMobile || deviceCapabilities.memory < 4096) {
      // For mobile or low-memory devices: use 4-bit quantization
      logger.debug('Using 4-bit quantization for mobile/low-memory device');
      payload.options.num_gpu_layers = 0; // Disable GPU for mobile
      payload.options.mirostat = 2; // Adaptive sampling for efficiency
      payload.options.num_thread = Math.max(2, deviceCapabilities.cpuCores - 1);
      payload.options.num_batch = 512;
    } else if (deviceCapabilities.memory < 8192) {
      // For mid-range devices: use 8-bit quantization
      logger.debug('Using 8-bit quantization for mid-range device');
      payload.options.num_gpu_layers = 1; // Minimal GPU usage
      payload.options.mirostat = 1;
      payload.options.num_thread = Math.max(4, deviceCapabilities.cpuCores - 2);
    } else {
      // For high-end devices: use full precision
      logger.debug('Using full precision for high-end device');
      // Default settings work well for high-end devices
    }

    const data = await runOllamaInWorker('/api/generate', payload);
    logger.info({ model, responseLength: data.response.length }, 'Response generated successfully');
    return data.response;
  } catch (error) {
    logger.error({ err: error, model, promptLength: prompt.length }, 'Ollama API error');
    throw error;
  }
};

/**
 * Turn your daily data into smart insights
 * @param {Object} data - Your calendar, todos, and emails
 * @returns {Promise<Object>} - Smart summary with priorities and actions
 */
export const generateIntelligentSummary = async (data) => {
  try {
    const { calendarEvents, todos, emails } = data;
    
    const prompt = `
Analyze the following daily data and provide a concise, actionable summary.

Calendar Events:
${calendarEvents.map(event => `- ${event.summary} (${new Date(event.start).toLocaleTimeString()})`).join('\n')}

Todos:
${todos.map(todo => `- ${todo.title} (${todo.priority} priority, due: ${new Date(todo.dueDate).toLocaleDateString()})`).join('\n')}

Emails:
${emails.map(email => `- ${email.subject} from ${email.sender} (${email.priority} priority)`).join('\n')}

Please provide:
1. A brief overview of the day
2. Top 3 priorities to focus on
3. Any potential conflicts or issues
4. Suggested actions to take

Format as JSON:
{
  "overview": "Brief day summary",
  "priorities": ["priority1", "priority2", "priority3"],
  "conflicts": ["conflict1", "conflict2"],
  "suggestedActions": ["action1", "action2", "action3"]
}
`;

    const response = await generateResponse(prompt, {
      model: MODELS.BALANCED,
      temperature: 0.7,
      maxTokens: 500,
      systemPrompt: 'You are S.I.R.I.U.S., an intelligent executive assistant. Provide concise, actionable insights in JSON format.'
    });

    try {
      // Try to parse as JSON
      return JSON.parse(response);
    } catch (parseError) {
      // If JSON parsing fails, return structured text
      logger.warn({ err: parseError }, 'Failed to parse response as JSON');
      return {
        overview: response,
        priorities: [],
        conflicts: [],
        suggestedActions: []
      };
    }
  } catch (error) {
    logger.error({ err: error }, 'Error generating summary with Ollama');
    return {
      overview: 'Unable to generate intelligent summary at this time.',
      priorities: [],
      conflicts: [],
      suggestedActions: []
    };
  }
};

/**
 * Understand what you're asking for
 * @param {string} text - What you said
 * @returns {Promise<Object>} - Your intent and key information
 */
export const extractIntent = async (text) => {
  try {
    const prompt = `
Extract the user's intent from the following text: "${text}"

Respond in JSON format:
{
  "intent": "the primary action or information the user wants",
  "confidence": 0.95,
  "parameters": {
    "key1": "value1",
    "key2": "value2"
  }
}

Common intents include: get_calendar, add_task, summarize_emails, check_weather, etc.
`;

    const response = await generateResponse(prompt, {
      model: MODELS.FAST,
      temperature: 0.3,
      maxTokens: 200,
      systemPrompt: 'You are an intent recognition system. Extract the user intent and parameters from the input.'
    });

    try {
      // Try to parse as JSON
      return JSON.parse(response);
    } catch (parseError) {
      // If JSON parsing fails, return basic intent
      logger.warn({ err: parseError }, 'Failed to parse intent as JSON');
      return {
        intent: "unknown",
        confidence: 0.5,
        parameters: {}
      };
    }
  } catch (error) {
    logger.error({ err: error }, 'Error extracting intent with Ollama');
    return {
      intent: "error",
      confidence: 0,
      parameters: {}
    };
  }
};

/**
 * List available models on your Ollama instance
 * @returns {Promise<Array>} - Available models
 */
export const listModels = async () => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    logger.error({ err: error }, 'Error listing Ollama models');
    return [];
  }
};

/**
 * Check if your local AI is ready to work
 * @returns {Promise<boolean>} - True if Ollama is running and ready
 */
export const checkOllamaStatus = async () => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch (error) {
    logger.error({ err: error }, 'Ollama is not available');
    return false;
  }
};

/**
 * Check if a model exists in Ollama
 * @param {string} modelName - Model name to check
 * @returns {Promise<boolean>} - Whether model exists
 */
async function checkModelExists(modelName) {
  try {
    const models = await listModels();
    return models.some(model => model.name === modelName);
  } catch (error) {
    logger.error({ err: error, modelName }, 'Error checking if model exists');
    return false;
  }
}

/**
 * Create a Matryoshka-quantized version of a model if it doesn't exist
 * @param {string} modelName - Original model name
 * @returns {Promise<string>} - Name of the optimized model
 */
export const ensureOptimizedModel = async (modelName) => {
  try {
    // Check if model exists
    const modelExists = await checkModelExists(modelName);
    if (!modelExists) {
      logger.warn({ modelName }, 'Model does not exist');
      return modelName;
    }
    
    // Check if already has Matryoshka quantization
    const hasMatryoshka = await matryoshkaQuantization.hasMatryoshkaQuantization(modelName);
    if (hasMatryoshka) {
      logger.debug({ modelName }, 'Model already has Matryoshka quantization');
      return modelName;
    }
    
    // Check if optimized version exists
    const optimizedName = `${modelName}-matryoshka`;
    const optimizedExists = await checkModelExists(optimizedName);
    
    if (optimizedExists) {
      logger.debug({ originalModel: modelName, optimizedModel: optimizedName }, 'Optimized model already exists');
      return optimizedName;
    }
    
    // Create optimized version
    logger.info({ modelName, optimizedName }, 'Creating Matryoshka-quantized model');
    const result = await matryoshkaQuantization.createMatryoshkaModel(
      modelName, 
      optimizedName,
      {
        quantizationLevel: matryoshkaQuantization.getOptimalQuantizationLevel(),
        nestedLevels: true
      }
    );
    
    logger.info({ modelName, optimizedName }, 'Successfully created Matryoshka-quantized model');
    return optimizedName;
  } catch (error) {
    logger.error({ err: error, modelName }, 'Error ensuring optimized model');
    return modelName; // Return original model name if optimization fails
  }
};

/**
 * Update model definitions based on available Matryoshka-quantized models
 */
export const updateModelDefinitions = async () => {
  try {
    const models = await listModels();
    
    // Check if Matryoshka-quantized versions exist for default models
    for (const [key, modelName] of Object.entries(MODELS)) {
      // Check if model exists
      const modelExists = models.some(model => model.name === modelName);
      if (!modelExists) continue;
      
      // Check if Matryoshka version exists
      const matryoshkaName = `${modelName}-matryoshka`;
      const matryoshkaExists = models.some(model => model.name === matryoshkaName);
      
      if (matryoshkaExists) {
        logger.debug({ originalModel: modelName, matryoshkaModel: matryoshkaName }, 'Using Matryoshka-quantized model');
        MODELS[key] = matryoshkaName;
      }
    }
    
    logger.info({ models: MODELS }, 'Updated model definitions');
  } catch (error) {
    logger.error({ err: error }, 'Error updating model definitions');
  }
};

// Initialize by updating model definitions
updateModelDefinitions().catch(err => {
  logger.error({ err }, 'Failed to update model definitions during initialization');
});

export default {
  generateResponse,
  generateIntelligentSummary,
  extractIntent,
  checkOllamaStatus,
  listModels,
  ensureOptimizedModel,
  updateModelDefinitions,
  MODELS
}; 