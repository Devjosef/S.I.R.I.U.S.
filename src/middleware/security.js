/**
 * Security Middleware
 * 
 * Provides security-related middleware for the Express application,
 * including rate limiting, security headers, and CORS configuration.
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import config from '../config/index.js';

/**
 * Rate limiter for API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  skip: () => config.ENV.DEV // Skip rate limiting in development
});

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts, please try again later.'
  }
});

/**
 * Configure security middleware for Express app
 * @param {Express} app - Express application
 * @returns {Express} Configured Express application
 */
export const configureSecurityMiddleware = (app) => {
  // Trust proxy if behind a reverse proxy
  app.set('trust proxy', 1); 
  
  // Apply security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://*.openai.com", "https://*.pinecone.io"]
      }
    }
  }));
  
  // Apply CORS - More restrictive in production
  app.use(cors(config.ENV.PRODUCTION ? {
    origin: ['https://s-i-r-i-u-s.vercel.app', 'https://sirius-ai.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  } : {
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Apply rate limiter to all API routes
  app.use('/api', apiLimiter);
  
  return app;
};

export default {
  apiLimiter,
  authLimiter,
  configureSecurityMiddleware
}; 