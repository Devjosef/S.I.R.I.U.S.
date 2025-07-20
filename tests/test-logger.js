/**
 * Logger Test Script
 * 
 * Tests the Pino logger implementation for lightweight logging.
 */

import logger, { createLogger } from '../src/utils/logger.js';
import config from '../src/config/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create component-specific loggers
const apiLogger = createLogger('api');
const dbLogger = createLogger('database');
const mobileLogger = createLogger('mobile');

// Log test messages at different levels
console.log('\n🪵 TESTING PINO LOGGER\n');
console.log(`Environment: ${config.ENV.PRODUCTION ? 'production' : config.ENV.TEST ? 'test' : 'development'}`);
console.log(`Log level: ${logger.level}`);
console.log(`File logging: ${process.env.LOG_FILE ? 'enabled → ' + process.env.LOG_FILE : 'disabled'}`);
console.log(`Pretty print: ${process.env.LOG_PRETTY_PRINT !== 'false' && !config.ENV.PRODUCTION ? 'enabled' : 'disabled'}`);
console.log(`External logging: ${process.env.LOG_EXTERNAL === 'true' ? 'enabled → ' + process.env.LOG_EXTERNAL_URL : 'disabled'}`);
console.log('-------------------------------------------');

// Test different log levels
logger.trace('This is a trace message (should not show in development)');
logger.debug('This is a debug message from the root logger');
logger.info('This is an info message from the root logger');
logger.warn('This is a warning message from the root logger');
logger.error(new Error('Test error'), 'This is an error message from the root logger');

// Test component-specific loggers
apiLogger.info('API request received');
apiLogger.debug({ method: 'GET', path: '/api/users', query: { limit: 10 } }, 'Processing API request');

dbLogger.info('Database connection established');
dbLogger.warn({ table: 'users', operation: 'update' }, 'Slow query detected');

// Test with structured data
mobileLogger.info({ 
  device: 'iPhone',
  os: 'iOS 16.5',
  memory: '120MB',
  battery: '78%'
}, 'Mobile client connected');

// Test error with context
try {
  throw new Error('Something went wrong');
} catch (error) {
  apiLogger.error({
    err: error,
    request: { id: '123', user: 'user-456' },
    context: { action: 'data-processing' }
  }, 'Request processing failed');
}

// Test performance
console.log('\n⚡ Testing logging performance...');
console.time('1000 log operations');
for (let i = 0; i < 1000; i++) {
  logger.debug({ iteration: i }, 'Performance test log message');
}
console.timeEnd('1000 log operations');

// Check if file logging is enabled and show file size
if (process.env.LOG_FILE) {
  const logFile = path.join(config.PATHS.ROOT, process.env.LOG_FILE);
  
  try {
    // Wait a moment for logs to be written
    setTimeout(() => {
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        console.log(`\n📄 Log file created: ${logFile}`);
        console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      } else {
        console.log(`\n❌ Log file not found: ${logFile}`);
      }
      
      console.log('\n✅ Logger test completed');
    }, 500);
  } catch (err) {
    console.error(`\n❌ Error checking log file: ${err.message}`);
    console.log('\n✅ Logger test completed');
  }
} else {
  console.log('\n✅ Logger test completed');
} 