/**
 * Configuration Module
 * 
 * Central configuration system that loads from environment variables
 * and provides defaults. Works in both local and Replit environments.
 * 
 * Lines: 170
 * Documentation: docs/CONFIGURATION.md
 */

// Environment variable loading and Node.js built-ins
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import os from 'os';
import pino from 'pino';
const logger = pino();

/**
 * Environment detection
 */
const ENV = {
  REPLIT: process.env.REPL_ID !== undefined,
  PRODUCTION: process.env.NODE_ENV === 'production',
  TEST: process.env.NODE_ENV === 'test',
  DEV: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
};

// Load environment variables from .env file
  dotenv.config();

/**
 * Path resolution
 */
// Safely determine project root directory
const getRootDir = () => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    return join(__dirname, '../..');
  } catch (err) {
    logger.warn('⚠️ Warning: Failed to resolve root directory from import.meta.url. Falling back to process.cwd(). This may cause unexpected behavior.');
    return process.cwd();
  }
};

const ROOT_DIR = getRootDir();
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const TEMP_DIR = join(ROOT_DIR, 'temp');

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Configuration values with defaults
 */
const config = {
  // Server settings
  PORT: parseInt(process.env.PORT || process.env.localPort || '3001', 10),
  ENV,
  
  // Security settings
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    MAX: parseInt(process.env.RATE_LIMIT_MAX || (ENV.DEV ? '1000' : '100'), 10) // More lenient in development
  },
  
  // External APIs
  PINECONE: {
    API_KEY: process.env.PINECONE_API_KEY,
    INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'SIRIUS'
  },
  
  TRELLO: {
    API_KEY: process.env.TRELLO_API_KEY,
    TOKEN: process.env.TRELLO_TOKEN
  },
  
  NOTION: {
    API_KEY: process.env.NOTION_API_KEY,
    DATABASE_ID: process.env.NOTION_DATABASE_ID
  },
  
  GOOGLE: {
    API_KEY: process.env.GOOGLE_API_KEY,
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
  },
  
  JIRA: {
    BASE_URL: process.env.JIRA_BASE_URL,
    EMAIL: process.env.JIRA_EMAIL,
    API_TOKEN: process.env.JIRA_API_TOKEN
  },
  
  ASANA: {
    ACCESS_TOKEN: process.env.ASANA_ACCESS_TOKEN
  },
  
  SLACK: {
    BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
    USER_TOKEN: process.env.SLACK_USER_TOKEN
  },
  
  // Ollama settings
  OLLAMA: {
    BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  },
  
  // Worker thread settings
  WORKERS: {
    // Enable/disable worker threads
    ENABLED: process.env.DISABLE_WORKERS !== 'true',
    // Maximum number of worker threads to use (defaults to CPU count - 1, minimum 1)
    MAX_THREADS: parseInt(process.env.MAX_WORKER_THREADS || Math.max(1, os.cpus().length - 1), 10),
    // Timeout for worker operations in ms
    TIMEOUT_MS: parseInt(process.env.WORKER_TIMEOUT_MS || '30000', 10),
    // Directory for worker scripts
    DIR: join(ROOT_DIR, 'workers')
  },
  
  // Device detection
  DEVICE: {
    // Detect if running on mobile (will be set by the client)
    IS_MOBILE: process.env.IS_MOBILE === 'true',
    // Available memory (MB)
    MEMORY_LIMIT: parseInt(process.env.MEMORY_LIMIT || (os.totalmem() / (1024 * 1024)).toFixed(0), 10),
    // CPU cores available
    CPU_CORES: parseInt(process.env.CPU_CORES || os.cpus().length, 10)
  },
  
  // Paths
  PATHS: {
    ROOT: ROOT_DIR,
    PUBLIC: PUBLIC_DIR,
    TEMP: TEMP_DIR
  }
};

/**
 * Validation
 */
const requiredConfigs = [
  { key: 'PINECONE.API_KEY', value: config.PINECONE.API_KEY },
  { key: 'PINECONE.INDEX_NAME', value: config.PINECONE.INDEX_NAME }
];

const missingConfigs = requiredConfigs
  .filter(item => !item.value)
  .map(item => item.key);

if (missingConfigs.length > 0) {
  logger.warn(`⚠️ Missing required configuration: ${missingConfigs.join(', ')}`);
  logger.warn('Some features may not work correctly.');
}

// Log minimal configuration info
logger.info(`Environment: ${ENV.PRODUCTION ? 'production' : ENV.TEST ? 'test' : 'development'}`);
logger.info(`Platform: ${ENV.REPLIT ? 'Replit' : 'Local'}`);
logger.info(`Worker Threads: ${config.WORKERS.ENABLED ? 'Enabled (max: ' + config.WORKERS.MAX_THREADS + ')' : 'Disabled'}`);

// Debug API keys (only show presence, never the value)
if (process.env.NOTION_API_KEY) {
  logger.info('Notion API Key: [HIDDEN]');
} else {
  logger.warn('⚠️ Notion API Key not found in environment variables');
}

export default config; 