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

// ... rest of the file stays exactly the same ...