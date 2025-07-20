/**
 * S.I.R.I.U.S. - Main Application Entry Point
 * 
 * SMART, INTELLIGENT, RESPONSIVE, INTEGRATIVE, USER-FRIENDLY, SYSTEM
 * 
 * This file initializes the Express application, configures middleware,
 * and starts the server.
 */

import express from 'express';
import morgan from 'morgan';
import { join } from 'path';
import { createServer } from 'http';
import config from './src/config/index.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { configureSecurityMiddleware } from './src/middleware/security.js';
import apiRoutes from './src/routes/index.js';
import legacyRoutes from './src/routes/legacyRoutes.js';
import ensureIcons from './src/utils/setupIcons.js';
import autonomousActionEngine from './src/services/autonomousActionEngine.js';
import websocketService from './src/services/websocketService.js';
import logger from './src/utils/logger.js';

// Initialize the app variable at the module level
let app;

// Application initialization with improved error handling
try {
  logger.info('Starting S.I.R.I.U.S. application...');
  
  // Ensure all required icons exist for PWA functionality
  ensureIcons();

  // Initialize express app
  app = express();

  // Configure security middleware (helmet, cors, rate limiting)
  configureSecurityMiddleware(app);

  // Logging middleware based on environment
  if (!config.ENV.TEST) {
    // Use Pino for HTTP request logging in production
    if (config.ENV.PRODUCTION) {
      const pinoHttp = await import('pino-http').then(m => m.default);
      app.use(pinoHttp({ logger }));
    } else {
      // Use Morgan for more detailed logs in development
      app.use(morgan(config.ENV.DEV ? 'dev' : 'combined'));
    }
  }

  // Body parsers
  app.use(express.json()); 
  app.use(express.urlencoded({ extended: true }));

  // API routes - modern structure
  app.use('/api', apiRoutes);

  // Legacy routes - for backward compatibility, to be deprecated
  app.use(legacyRoutes);

  // Static file serving
  app.use(express.static(join(config.PATHS.PUBLIC)));

  // Root endpoint serves the main HTML file
  app.get('/', (req, res) => {
    res.sendFile(join(config.PATHS.PUBLIC, 'index.html'));
  });

  // API documentation endpoint
  app.get('/api-docs', (req, res) => {
    res.sendFile(join(config.PATHS.PUBLIC, 'api-docs.html'));
  });

  // Global error handler
  app.use(errorHandler);

  // Start the server
  const PORT = config.PORT;
  try {
    // Create HTTP server for WebSocket support
    const server = createServer(app);
    
    // Initialize WebSocket service
    websocketService.initialize(server);
    
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`
=============================================
 S.I.R.I.U.S. API Server v1.0.0
 ----------------------------------------- 
 Server running on port: ${PORT}
 Environment: ${config.ENV.PRODUCTION ? 'production' : config.ENV.TEST ? 'test' : 'development'}
 Platform: ${config.ENV.REPLIT ? 'Replit' : 'Local'}
 
 URLs:
 • API: http://localhost:${PORT}/api
 • App: http://localhost:${PORT}/
 • WebSocket: ws://localhost:${PORT}/ws
=============================================
      `);
      
      // Start the autonomous action engine
      autonomousActionEngine.createDefaultTriggers(); // Now enabled with ML learning
      autonomousActionEngine.start();
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught Exception');
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled Rejection');
    // No need to exit here as it's often not fatal
  });

} catch (err) {
  logger.fatal({ err }, 'Fatal error during startup');
  process.exit(1);
}

// Export the app for testing
export default app;
 
