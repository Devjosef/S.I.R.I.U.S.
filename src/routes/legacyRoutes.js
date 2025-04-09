/**
 * Legacy Routes Module
 * 
 * This module provides backward compatibility with the old API endpoints.
 * These routes are maintained temporarily to support existing integrations
 * but will be removed in future versions.
 * 
 * @deprecated These routes will be removed in v2.0.0. Use /api/* routes instead.
 */

import { Router } from 'express';
import pineconeController from '../controllers/pineconeController.js';
import { createLegacyRouteWrapper, mapLegacyRequest } from '../utils/legacySupport.js';

const router = Router();

/**
 * @deprecated Use /api/pinecone/store instead.
 * Legacy route for storing embeddings
 */
router.post('/store-embedding', 
  mapLegacyRequest({
    'text': 'text',
    'id': 'id'
  }),
  createLegacyRouteWrapper({
    legacyPath: '/store-embedding',
    newPath: '/api/pinecone/store',
    handler: pineconeController.storeEmbedding,
    version: 'v2.0.0'
  })
);

/**
 * @deprecated Use /api/pinecone/query instead.
 * Legacy route for querying embeddings
 */
router.post('/query-embedding', 
  mapLegacyRequest({
    'text': 'text',
    'topK': 'topK'
  }),
  createLegacyRouteWrapper({
    legacyPath: '/query-embedding',
    newPath: '/api/pinecone/query',
    handler: pineconeController.queryEmbedding,
    version: 'v2.0.0'
  })
);

// Add more legacy routes as needed...

export default router; 