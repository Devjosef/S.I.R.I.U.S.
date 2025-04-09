import { Router } from 'express';
import pineconeRoutes from './pineconeRoutes.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import config from '../config/index.js';

const router = Router();

/**
 * API documentation endpoint that provides information about 
 * all available endpoints and their usage.
 */
router.get('/', (req, res) => {
  // Build API documentation with examples
  const apiDocs = {
    message: 'Welcome to S.I.R.I.U.S. API',
    version: '1.0.0',
    description: 'SMART, INTELLIGENT, RESPONSIVE, INTEGRATIVE, USER-FRIENDLY, SYSTEM',
    environment: config.ENV.PRODUCTION ? 'production' : config.ENV.TEST ? 'test' : 'development',
    
    // List all available endpoints with documentation
    endpoints: {
      // Pinecone embeddings endpoints
      pinecone: {
        base: '/api/pinecone',
        endpoints: [
          {
            path: '/store',
            method: 'POST',
            description: 'Store an embedding in Pinecone vector database',
            body: {
              text: 'Text content to be embedded',
              id: 'Unique identifier for the embedding'
            },
            example: {
              request: {
                method: 'POST',
                url: '/api/pinecone/store',
                body: {
                  text: 'This is a sample text to be stored as an embedding',
                  id: 'sample-123'
                }
              },
              response: {
                message: 'Embedding stored successfully',
                success: true,
                id: 'sample-123'
              }
            }
          },
          {
            path: '/query',
            method: 'POST',
            description: 'Query embeddings to find similar content',
            body: {
              text: 'Text to find similar embeddings for',
              topK: '(Optional) Number of results to return (default: 5)'
            },
            example: {
              request: {
                method: 'POST',
                url: '/api/pinecone/query',
                body: {
                  text: 'Query text to find similar embeddings',
                  topK: 3
                }
              },
              response: {
                message: 'Query successful',
                matches: [
                  {
                    id: 'result-1',
                    score: 0.92,
                    metadata: { createdAt: '2023-04-01T12:00:00Z' }
                  },
                  {
                    id: 'result-2',
                    score: 0.87,
                    metadata: { createdAt: '2023-04-02T15:30:00Z' }
                  }
                ]
              }
            }
          },
          {
            path: '/:id',
            method: 'DELETE',
            description: 'Delete an embedding by ID',
            params: {
              id: 'Unique identifier of the embedding to delete'
            },
            example: {
              request: {
                method: 'DELETE',
                url: '/api/pinecone/sample-123'
              },
              response: {
                message: 'Embedding deleted successfully',
                success: true,
                id: 'sample-123'
              }
            }
          }
        ]
      },
      
      // Legacy endpoints (deprecated)
      legacy: {
        note: 'These endpoints are maintained for backward compatibility and will be removed in v2.0.0',
        endpoints: [
          {
            path: '/store-embedding',
            method: 'POST',
            description: 'Store an embedding (deprecated)',
            replacement: '/api/pinecone/store'
          },
          {
            path: '/query-embedding',
            method: 'POST',
            description: 'Query embeddings (deprecated)',
            replacement: '/api/pinecone/query'
          }
        ]
      }
    },
    
    // Usage examples
    examples: {
      curl: {
        store: 'curl -X POST http://localhost:3000/api/pinecone/store -H "Content-Type: application/json" -d \'{"text": "Example text", "id": "example-id"}\'',
        query: 'curl -X POST http://localhost:3000/api/pinecone/query -H "Content-Type: application/json" -d \'{"text": "Example query", "topK": 3}\''
      },
      javascript: {
        store: `
fetch('/api/pinecone/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Example text', id: 'example-id' })
})
.then(response => response.json())
.then(data => console.log(data));`,
        query: `
fetch('/api/pinecone/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Example query', topK: 3 })
})
.then(response => response.json())
.then(data => console.log(data));`
      }
    }
  };
  
  res.json(apiDocs);
});

// Mount routes
router.use('/pinecone', pineconeRoutes);

// 404 handler for API routes
router.use('*', (req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

export default router; 