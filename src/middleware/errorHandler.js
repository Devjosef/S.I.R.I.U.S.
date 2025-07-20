/**
 * Error Handler Middleware - Global Error Management
 * 
 * Provides centralized error handling, validation error processing,
 * and consistent error response formatting.
 * 
 * Lines: 120
 */

// Internal configuration and utilities
import config from '../config/index.js';
import { createLogger } from '../utils/logger.js';

// Create component-specific logger
const logger = createLogger('error-handler');

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for request validation failures
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized error for authentication failures
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error for authorization failures
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Global error handler middleware for Express
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error with appropriate level based on status code
  if (err.statusCode >= 500) {
    logger.error({ 
      err,
      req: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?.id
      }
    }, `${err.name}: ${err.message}`);
  } else if (err.statusCode >= 400) {
    logger.warn({
      err,
      req: {
        method: req.method,
        url: req.originalUrl
      }
    }, `${err.name}: ${err.message}`);
  } else {
    logger.info({ err }, `${err.name}: ${err.message}`);
  }
  
  // Set default values
  const statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Internal Server Error';
  let errorDetails = err.details || null;
  
  // Handle specific types of errors
  if (err.name === 'ValidationError' && !errorDetails) {
    errorDetails = { validation: 'Invalid input data' };
  }
  
  // In production, don't expose error details for 500 errors
  if (config.ENV.PRODUCTION && statusCode === 500) {
    errorMessage = 'Internal Server Error';
    errorDetails = null;
  }
  
  // Send the response
  res.status(statusCode).json({
    error: errorMessage,
    ...(errorDetails && { details: errorDetails }),
    ...(config.ENV.DEV && { stack: err.stack })
  });
};

export default errorHandler; 