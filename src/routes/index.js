/**
 * Main API Routes - RESTful Endpoints
 * 
 * Central routing configuration for all API endpoints including
 * services, controllers, and middleware.
 * 
 * Lines: 150
 */

// Express routing
import { Router } from 'express';

// Service routes
import asanaRoutes from './asanaRoutes.js';
import autonomousActionRoutes from './autonomousActionRoutes.js';
import contextRoutes from './contextRoutes.js';
import dailyDigestRoutes from './dailyDigestRoutes.js';
import googleRoutes from './googleRoutes.js';
import jiraRoutes from './jiraRoutes.js';
import multiPlatformRoutes from './multiPlatformRoutes.js';
import n8nRoutes from './n8nRoutes.js';
import notionRoutes from './notionRoutes.js';
import oauthRoutes from './oauthRoutes.js';
import pineconeRoutes from './pineconeRoutes.js';
import trelloRoutes from './trelloRoutes.js';

//  AI CORE FEATURES - CRITICAL!
import predictionRoutes from './predictionRoutes.js';
import memoryRoutes from './memoryRoutes.js';
import learningAnalyticsRoutes from './learningAnalyticsRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'S.I.R.I.U.S. API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// System status endpoint
router.get('/status', async (req, res) => {
  try {
    // Check Ollama status
    let ollamaStatus = false;
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/tags');
      ollamaStatus = ollamaResponse.ok;
    } catch (error) {
      console.log('Ollama not available:', error.message);
    }

    // Check memory system status
    let memoryStatus = false;
    try {
      const fs = await import('fs/promises');
      await fs.access('./data/memory/default-user.json');
      memoryStatus = true;
    } catch (error) {
      console.log('Memory file not accessible:', error.message);
    }

    res.json({
      success: true,
      message: 'System status retrieved',
      data: {
        ollama: ollamaStatus,
        memory: memoryStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check system status',
      details: error.message
    });
  }
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'S.I.R.I.U.S. API Documentation',
    data: {
      version: '1.0.0',
      endpoints: {
        health: 'GET /api/health - Health check',
        status: 'GET /api/status - System status',
        docs: 'GET /api/docs - This documentation',
        asana: 'GET /api/asana/* - Asana integration',
        jira: 'GET /api/jira/* - Jira integration',
        trello: 'GET /api/trello/* - Trello integration',
        notion: 'GET /api/notion/* - Notion integration',
        google: 'GET /api/google/* - Google Workspace integration',
        oauth: 'GET /api/oauth/* - OAuth authentication',
        autonomous: 'POST /api/autonomous/* - Autonomous actions',
        context: 'POST /api/context/* - Context analysis',
        digest: 'POST /api/daily-digest/* - Daily digest generation',
        pinecone: 'POST /api/pinecone/* - Vector database operations',
        n8n: 'POST /api/n8n/* - Workflow automation'
      },
      documentation: 'https://github.com/Devjosef/S.I.R.I.U.S./docs/'
    }
  });
});

// Mount service routes
router.use('/asana', asanaRoutes);
router.use('/autonomous', autonomousActionRoutes);
router.use('/context', contextRoutes);
router.use('/daily-digest', dailyDigestRoutes);
router.use('/google', googleRoutes);
router.use('/jira', jiraRoutes);
router.use('/multi-platform', multiPlatformRoutes);
router.use('/n8n', n8nRoutes);
router.use('/notion', notionRoutes);
router.use('/oauth', oauthRoutes);
router.use('/pinecone', pineconeRoutes);
router.use('/trello', trelloRoutes);

//  MOUNT AI CORE FEATURES
router.use('/predict', predictionRoutes);
router.use('/memory', memoryRoutes);
router.use('/learning-analytics', learningAnalyticsRoutes);

// 404 handler for unknown API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/api/health',
      '/api/status',
      '/api/docs',
      '/api/asana/*',
      '/api/jira/*',
      '/api/trello/*',
      '/api/notion/*',
      '/api/google/*',
      '/api/oauth/*',
      '/api/autonomous/*',
      '/api/context/*',
      '/api/daily-digest/*',
      '/api/pinecone/*',
      '/api/n8n/*'
    ]
  });
});

export default router;