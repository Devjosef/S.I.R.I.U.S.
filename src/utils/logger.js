/**
 * Logger Utility - Centralized Logging System
 * 
 * Provides structured logging with Pino, file rotation, and
 * environment-based configuration.
 * 
 * Lines: 180
 */

// Logging libraries
import pino from 'pino';
import pinoHttp from 'pino-http';
import pinoPretty from 'pino-pretty';
import pinoRoll from 'pino-roll';

// File system and path utilities
import fs from 'fs';
import path from 'path';

// Internal configuration
import config from '../config/index.js';

// Create logs directory if it doesn't exist
const logsDir = path.join(config.PATHS.ROOT, 'logs');
if (process.env.LOG_FILE && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure log level based on environment and .env settings
const logLevel = process.env.LOG_LEVEL || 
  (config.ENV.PRODUCTION ? 'info' : config.ENV.TEST ? 'silent' : 'debug');

// Configure pretty printing based on .env settings
const prettyPrint = process.env.LOG_PRETTY_PRINT !== 'false' && 
  !config.ENV.PRODUCTION && !config.ENV.TEST;

// File destination if LOG_FILE is set
const logFile = process.env.LOG_FILE ? 
  path.join(config.PATHS.ROOT, process.env.LOG_FILE) : 
  undefined;

// External logging service
const useExternalLogging = process.env.LOG_EXTERNAL === 'true';
const externalLogUrl = process.env.LOG_EXTERNAL_URL;

// Create logger configuration
const loggerConfig = {
  level: logLevel,
  // Mobile-optimized settings
  base: config.DEVICE.IS_MOBILE ? { app: 'sirius-mobile' } : { app: 'sirius' },
  // Add mobile-specific context
  mixin: () => {
    return {
      device: config.DEVICE.IS_MOBILE ? 'mobile' : 'desktop',
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      workers: config.WORKERS.ENABLED ? 'enabled' : 'disabled'
    };
  }
};

// Initialize the logger
let logger;

// Configure transports based on environment
if (logFile) {
  // If file logging is enabled
  const streams = [
    { stream: fs.createWriteStream(logFile) }
  ];
  
  // Add console output with pretty printing in development
  if (prettyPrint) {
    streams.push({ 
      stream: pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }) 
    });
  }
  
  // Create multi-destination logger
  logger = pino(
    loggerConfig,
    pino.multistream(streams)
  );
  
  // Log startup information
  logger.info({
    environment: config.ENV.PRODUCTION ? 'production' : config.ENV.TEST ? 'test' : 'development',
    logLevel,
    fileLogging: !!logFile,
    logFile,
    prettyPrint,
    externalLogging: useExternalLogging
  }, 'Logger initialized with file transport');
} else {
  // Console-only logging
  if (prettyPrint) {
    // Pretty printing for development
    loggerConfig.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    };
  }
  
  // Create console logger
  logger = pino(loggerConfig);
  
  // Log startup information
  logger.info({
    environment: config.ENV.PRODUCTION ? 'production' : config.ENV.TEST ? 'test' : 'development',
    logLevel,
    fileLogging: false,
    prettyPrint,
    externalLogging: useExternalLogging
  }, 'Logger initialized with console transport');
  
  // External logging for errors in browser environment
  if (typeof window !== 'undefined' && useExternalLogging && externalLogUrl) {
    const originalError = logger.error;
    logger.error = (obj, msg, ...args) => {
      // Call original error method
      originalError.call(logger, obj, msg, ...args);
      
      // Send to external logging service
      try {
        fetch(externalLogUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 'error',
            message: msg,
            data: obj,
            timestamp: new Date().toISOString(),
            app: config.DEVICE.IS_MOBILE ? 'sirius-mobile' : 'sirius'
          })
        }).catch(() => {
          // Silently fail if external logging fails
        });
      } catch (err) {
        // Silently fail if external logging fails
      }
    };
  }
}

/**
 * Create child loggers for different components
 * @param {string} component - Component name
 * @returns {Object} - Child logger
 */
export const createLogger = (component) => {
  return logger.child({ component });
};

// Export default logger (for general use)
export default logger; 