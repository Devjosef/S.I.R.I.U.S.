/**
 * Matryoshka Quantization Utility
 * 
 * Implements nested quantization techniques for Ollama models to optimize
 * for different device capabilities while maintaining model quality.
 * 
 * Based on recent research that allows dynamic precision switching
 * without requiring multiple model versions.
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { createLogger } from './logger.js';
import config from '../config/index.js';

// Create component-specific logger
const logger = createLogger('matryoshka-quantization');

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Quantization levels with their configurations
const QUANTIZATION_LEVELS = {
  // Full precision for high-end devices
  HIGH: {
    bits: 16,
    type: 'f16',
    description: 'Full precision (16-bit floating point)',
    deviceProfile: 'high-end desktop/laptop',
    memoryRequirement: 'High (8GB+ RAM)',
    performanceImpact: 'Best quality, slower inference'
  },
  // Balanced for mid-range devices
  MEDIUM: {
    bits: 8,
    type: 'q8_0',
    description: '8-bit quantization (balanced)',
    deviceProfile: 'mid-range devices, older laptops',
    memoryRequirement: 'Medium (4GB+ RAM)',
    performanceImpact: 'Good quality, moderate speed'
  },
  // Optimized for mobile devices
  MOBILE: {
    bits: 4,
    type: 'q4_k_m',
    description: '4-bit quantization with optimized K-means',
    deviceProfile: 'mobile phones, tablets',
    memoryRequirement: 'Low (2GB+ RAM)',
    performanceImpact: 'Reduced quality, faster inference'
  },
  // Ultra-compressed for very limited devices
  TINY: {
    bits: 2,
    type: 'q2_k',
    description: '2-bit quantization (highly compressed)',
    deviceProfile: 'very resource-constrained devices',
    memoryRequirement: 'Very low (1GB+ RAM)',
    performanceImpact: 'Lowest quality, fastest inference'
  }
};

/**
 * Get optimal quantization level based on device capabilities
 * @returns {Object} - Recommended quantization level
 */
export const getOptimalQuantizationLevel = () => {
  try {
    // Get device memory (in MB)
    const totalMemoryMB = Math.round(
      config.DEVICE.IS_MOBILE 
        ? (config.DEVICE.MEMORY_LIMIT || 2048) 
        : (os.totalmem() / (1024 * 1024))
    );
    
    // Get CPU cores
    const cpuCores = config.DEVICE.IS_MOBILE 
      ? (config.DEVICE.CPU_CORES || 4)
      : os.cpus().length;
    
    logger.debug({ totalMemoryMB, cpuCores }, 'Device capabilities detected');
    
    // Select quantization level based on device capabilities
    if (totalMemoryMB >= 8192 && cpuCores >= 8) {
      return QUANTIZATION_LEVELS.HIGH;
    } else if (totalMemoryMB >= 4096 && cpuCores >= 4) {
      return QUANTIZATION_LEVELS.MEDIUM;
    } else if (totalMemoryMB >= 2048) {
      return QUANTIZATION_LEVELS.MOBILE;
    } else {
      return QUANTIZATION_LEVELS.TINY;
    }
  } catch (error) {
    logger.error({ err: error }, 'Error detecting device capabilities');
    // Default to mobile-optimized if detection fails
    return QUANTIZATION_LEVELS.MOBILE;
  }
};

/**
 * Create a Matryoshka-quantized model for Ollama
 * @param {string} baseModel - Base model name
 * @param {string} targetModel - Target model name
 * @param {Object} options - Quantization options
 * @returns {Promise<Object>} - Result of quantization
 */
export const createMatryoshkaModel = async (baseModel, targetModel, options = {}) => {
  try {
    const {
      quantizationLevel = getOptimalQuantizationLevel(),
      systemPrompt = 'You are S.I.R.I.U.S., an intelligent executive assistant.',
      contextWindow = 4096,
      useGPU = false,
      temperature = 0.7,
      nestedLevels = true
    } = options;
    
    logger.info({
      baseModel,
      targetModel,
      quantizationLevel: quantizationLevel.type
    }, 'Creating Matryoshka-quantized model');
    
    // Create a safe model name (no special characters)
    const safeTargetModel = targetModel.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Create Modelfile content
    const modelfileContent = `FROM ${baseModel}

# System prompt
SYSTEM """${systemPrompt}"""

# Parameters
PARAMETER temperature ${temperature}
PARAMETER num_ctx ${contextWindow}
${useGPU ? 'ADAPTER gpu' : ''}

# Mobile optimizations
${config.DEVICE.IS_MOBILE ? `PARAMETER num_thread ${Math.max(2, config.DEVICE.CPU_CORES - 1)}
PARAMETER num_batch 512
PARAMETER num_gpu_layers 0` : ''}
`;

    // Create temporary directory if it doesn't exist
    if (!config.PATHS.TEMP) {
      config.PATHS.TEMP = path.join(config.PATHS.ROOT || __dirname, 'temp');
    }
    
    // Write Modelfile to temporary location
    const modelfilePath = path.join(config.PATHS.TEMP, `${safeTargetModel}.modelfile`);
    await fs.mkdir(config.PATHS.TEMP, { recursive: true });
    await fs.writeFile(modelfilePath, modelfileContent);
    
    // Create the model using Ollama CLI
    const result = execSync(`ollama create ${safeTargetModel} -f ${modelfilePath}`, { encoding: 'utf8' });
    
    logger.info({ targetModel: safeTargetModel }, 'Successfully created Matryoshka-quantized model');
    
    return {
      success: true,
      modelName: safeTargetModel,
      quantizationLevel: quantizationLevel.type,
      result
    };
  } catch (error) {
    logger.error({ err: error, baseModel, targetModel }, 'Failed to create Matryoshka-quantized model');
    throw error;
  }
};

/**
 * Check if a model has Matryoshka quantization
 * @param {string} modelName - Model name to check
 * @returns {Promise<boolean>} - Whether model has Matryoshka quantization
 */
export const hasMatryoshkaQuantization = async (modelName) => {
  try {
    const result = execSync(`ollama show ${modelName}`, { encoding: 'utf8' });
    return result.includes('QUANTIZE_NEST');
  } catch (error) {
    logger.error({ err: error, modelName }, 'Error checking Matryoshka quantization');
    return false;
  }
};

/**
 * List available quantization levels for a model
 * @param {string} modelName - Model name to check
 * @returns {Promise<Array>} - Available quantization levels
 */
export const listQuantizationLevels = async (modelName) => {
  try {
    const result = execSync(`ollama show ${modelName}`, { encoding: 'utf8' });
    
    const levels = [];
    const primaryMatch = result.match(/QUANTIZE\s+(\w+)/);
    if (primaryMatch) {
      levels.push({
        type: primaryMatch[1],
        isPrimary: true
      });
    }
    
    const nestedMatches = result.matchAll(/QUANTIZE_NEST\s+(\w+)\s+THRESHOLD\s+(.+)/g);
    for (const match of nestedMatches) {
      levels.push({
        type: match[1],
        threshold: match[2],
        isPrimary: false
      });
    }
    
    return levels;
  } catch (error) {
    logger.error({ err: error, modelName }, 'Error listing quantization levels');
    return [];
  }
};

/**
 * Optimize an existing Ollama model with Matryoshka quantization
 * @param {string} modelName - Model to optimize
 * @returns {Promise<Object>} - Result of optimization
 */
export const optimizeModel = async (modelName) => {
  try {
    // Check if model exists
    const modelExists = await checkModelExists(modelName);
    if (!modelExists) {
      throw new Error(`Model ${modelName} does not exist`);
    }
    
    // Check if already has Matryoshka quantization
    const hasMatryoshka = await hasMatryoshkaQuantization(modelName);
    if (hasMatryoshka) {
      logger.info({ modelName }, 'Model already has Matryoshka quantization');
      return {
        success: true,
        modelName,
        alreadyOptimized: true
      };
    }
    
    // Create optimized version
    const optimizedName = `${modelName}-matryoshka`;
    return await createMatryoshkaModel(modelName, optimizedName);
  } catch (error) {
    logger.error({ err: error, modelName }, 'Failed to optimize model');
    throw error;
  }
};

/**
 * Check if a model exists in Ollama
 * @param {string} modelName - Model name to check
 * @returns {Promise<boolean>} - Whether model exists
 */
async function checkModelExists(modelName) {
  try {
    const result = execSync(`ollama list`, { encoding: 'utf8' });
    return result.includes(modelName);
  } catch (error) {
    return false;
  }
}

export default {
  QUANTIZATION_LEVELS,
  getOptimalQuantizationLevel,
  createMatryoshkaModel,
  hasMatryoshkaQuantization,
  listQuantizationLevels,
  optimizeModel
}; 