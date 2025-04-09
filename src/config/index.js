/**
 * Configuration Module
 * 
 * Central configuration system that loads from environment variables
 * and provides defaults. Works in both local and Replit environments.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

/**
 * Environment detection
 */
const ENV = {
  REPLIT: process.env.REPL_ID !== undefined,
  PRODUCTION: process.env.NODE_ENV === 'production',
  TEST: process.env.NODE_ENV === 'test',
  DEV: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
};

// Load environment variables from .env file if not in Replit
if (!ENV.REPLIT) {
  dotenv.config();
}

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
    return process.cwd();
  }
};

const ROOT_DIR = getRootDir();
const PUBLIC_DIR = join(ROOT_DIR, 'public');

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
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
    MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  },
  
  // External APIs
  OPENAI: {
    API_KEY: process.env.OPENAI_API_KEY,
    EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002'
  },
  
  PINECONE: {
    API_KEY: process.env.PINECONE_API_KEY,
    INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'sirius-index'
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
    API_KEY: process.env.GOOGLE_API_KEY
  },
  
  // Paths
  PATHS: {
    ROOT: ROOT_DIR,
    PUBLIC: PUBLIC_DIR
  }
};

/**
 * Validation
 */
const requiredConfigs = [
  { key: 'OPENAI.API_KEY', value: config.OPENAI.API_KEY },
  { key: 'PINECONE.API_KEY', value: config.PINECONE.API_KEY },
  { key: 'PINECONE.INDEX_NAME', value: config.PINECONE.INDEX_NAME }
];

const missingConfigs = requiredConfigs
  .filter(item => !item.value)
  .map(item => item.key);

if (missingConfigs.length > 0) {
  console.warn(`⚠️ Missing required configuration: ${missingConfigs.join(', ')}`);
  console.warn('Some features may not work correctly.');
}

// Log minimal configuration info
console.log(`Environment: ${ENV.PRODUCTION ? 'production' : ENV.TEST ? 'test' : 'development'}`);
console.log(`Platform: ${ENV.REPLIT ? 'Replit' : 'Local'}`);

export default config; 