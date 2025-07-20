import { Router } from 'express';
import { join } from 'path';
import pineconeRoutes from './pineconeRoutes.js';
import dailyDigestRoutes from './dailyDigestRoutes.js';
import contextRoutes from './contextRoutes.js';
import autonomousActionRoutes from './autonomousActionRoutes.js';
import multiPlatformRoutes from './multiPlatformRoutes.js';
import jiraRoutes from './jiraRoutes.js';
import notionRoutes from './notionRoutes.js';

import trelloRoutes from './trelloRoutes.js';
import n8nRoutes from './n8nRoutes.js';
import googleRoutes from './googleRoutes.js';
import oauthRoutes from './oauthRoutes.js';
import asanaRoutes from './asanaRoutes.js';
import memoryRoutes from './memoryRoutes.js';
import learningAnalyticsRoutes from './learningAnalyticsRoutes.js';
import predictionRoutes from './predictionRoutes.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import config from '../config/index.js';
import workerManager from '../utils/workerManager.js';
import { checkOllamaStatus } from '../services/ollamaService.js';
import { directAPICall } from '../services/pineconeService.js';

const router = Router();

/**
 * Welcome to S.I.R.I.U.S. - your personal AI assistant
 * This page shows you all the ways you can interact with your assistant
 */
router.get('/', (req, res) => {
  // Serve the beautiful frontend interface
  res.sendFile(join(config.PATHS.PUBLIC, 'index.html'));
});

/**
 * API documentation endpoint
 */
router.get('/api-docs', (req, res) => {
  // Build API documentation with examples
  const apiDocs = {
    message: 'Welcome to S.I.R.I.U.S. API',
    version: '1.0.0',
    description: 'Your personal AI assistant that helps you manage your day, understand your data, and take smart actions',
    environment: config.ENV.PRODUCTION ? 'production' : config.ENV.TEST ? 'test' : 'development',
    
    // List all available endpoints with documentation
    endpoints: {
      // Memory and knowledge storage
      pinecone: {
        base: '/api/pinecone',
        endpoints: [
          {
            path: '/store',
            method: 'POST',
            description: 'Save information to S.I.R.I.U.S. memory for future reference',
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
            description: 'Find similar information in S.I.R.I.U.S. memory',
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
            description: 'Remove information from S.I.R.I.U.S. memory',
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
      
      // Your daily assistant
      dailyDigest: {
        base: '/api/daily-digest',
        endpoints: [
          {
            path: '/generate',
            method: 'POST',
            description: 'Create a smart summary of your day with AI insights',
            body: {
              userId: 'User identifier'
            },
            example: {
              request: {
                method: 'POST',
                url: '/api/daily-digest/generate',
                body: {
                  userId: 'user123'
                }
              },
              response: {
                success: true,
                message: 'Daily digest generated successfully',
                data: {
                  timestamp: '2024-01-15T10:00:00Z',
                  summary: {
                    overview: 'You have 3 meetings and 2 urgent todos today',
                    priorities: ['Complete API documentation', 'Client meeting prep', 'Review budget'],
                    conflicts: [],
                    suggestedActions: ['Reschedule code review', 'Reply to urgent email']
                  },
                  metrics: {
                    totalMeetings: 3,
                    urgentTodos: 1,
                    unreadEmails: 2,
                    conflicts: 0
                  },
                  actions: [
                    {
                      id: 'reschedule',
                      label: 'Reschedule Meeting',
                      type: 'calendar',
                      available: true
                    }
                  ]
                }
              }
            }
          },
          {
            path: '/summary',
            method: 'GET',
            description: 'Get your latest daily summary',
            query: {
              userId: 'User identifier'
            }
          },
          {
            path: '/actions',
            method: 'POST',
            description: 'Take action on something from your daily digest',
            body: {
              actionId: 'Action identifier (reschedule, reply-email, add-todo)',
              context: 'Optional context for the action'
            }
          },
          {
            path: '/calendar',
            method: 'GET',
            description: 'Get your calendar events for today',
            query: {
              userId: 'User identifier'
            }
          },
          {
            path: '/todos',
            method: 'GET',
            description: 'Get your todos for today',
            query: {
              userId: 'User identifier'
            }
          },
          {
            path: '/emails',
            method: 'GET',
            description: 'Get your important emails from today',
            query: {
              userId: 'User identifier'
            }
          }
        ]
      },
      
      // Your AI's brain
      context: {
        base: '/api/context',
        endpoints: [
          {
            path: '/analyze',
            method: 'POST',
            description: 'Analyze your current situation and get smart insights',
            body: {
              userId: 'User identifier'
            },
            example: {
              request: {
                method: 'POST',
                url: '/api/context/analyze',
                body: {
                  userId: 'user123'
                }
              },
              response: {
                success: true,
                message: 'Context analyzed successfully',
                data: {
                  timestamp: '2024-01-15T10:00:00Z',
                  currentTimeBlock: 'morning-focus',
                  urgency: 'medium',
                  focus: 'deep-work',
                  energy: 'high',
                  insights: [
                    'You have 2 urgent tasks that need attention',
                    'Your energy is high - perfect for focused work',
                    'Consider scheduling your meeting prep for later'
                  ],
                  actions: [
                    {
                      id: 'focus-mode',
                      label: 'Enable focus mode',
                      type: 'productivity',
                      priority: 'medium'
                    }
                  ]
                }
              }
            }
          },
          {
            path: '/situation',
            method: 'GET',
            description: 'Get your current situation summary',
            query: {
              userId: 'User identifier'
            }
          },
          {
            path: '/preferences',
            method: 'GET',
            description: 'Get your learned preferences and patterns',
            query: {
              userId: 'User identifier'
            }
          },
          {
            path: '/preferences',
            method: 'POST',
            description: 'Update your preferences',
            body: {
              userId: 'User identifier',
              preferences: 'Object containing your preferences'
            }
          },
          {
            path: '/remember',
            method: 'POST',
            description: 'Remember a specific behavior or preference',
            body: {
              userId: 'User identifier',
              category: 'Behavior category (meetingPreferences, emailHandling, etc.)',
              key: 'Specific behavior key',
              value: 'What you prefer'
            }
          },
          {
            path: '/behavior',
            method: 'GET',
            description: 'Get a remembered behavior',
            query: {
              userId: 'User identifier',
              category: 'Behavior category',
              key: 'Behavior key'
            }
          },
          {
            path: '/cleanup',
            method: 'POST',
            description: 'Clean up old memories',
            body: {
              userId: 'User identifier',
              daysOld: '(Optional) How old memories to forget (default: 90)'
            }
          }
        ]
      },
      
      // Your AI's autonomous actions
      autonomous: {
        base: '/api/autonomous',
        endpoints: [
          {
            path: '/start',
            method: 'POST',
            description: 'Start the autonomous action engine',
            example: {
              request: {
                method: 'POST',
                url: '/api/autonomous/start'
              },
              response: {
                success: true,
                message: 'Autonomous action engine started successfully',
                data: {
                  isRunning: true,
                  triggerCount: 3,
                  checkInterval: 60000
                }
              }
            }
          },
          {
            path: '/status',
            method: 'GET',
            description: 'Get engine status and statistics'
          },
          {
            path: '/triggers',
            method: 'GET',
            description: 'Get all smart triggers'
          },
          {
            path: '/triggers',
            method: 'POST',
            description: 'Add a new smart trigger',
            body: {
              condition: 'Trigger condition object',
              action: 'Action to execute object',
              priority: 'Priority level (low, medium, high, critical)'
            }
          },
          {
            path: '/trigger',
            method: 'POST',
            description: 'Manually trigger an action',
            body: {
              actionType: 'Type of action (focus_mode, break_reminder, meeting_prep)',
              userId: 'User identifier'
            }
          },
          {
            path: '/history',
            method: 'GET',
            description: 'Get action history',
            query: {
              limit: 'Number of actions to return (default: 20)',
              userId: 'Filter by user ID'
            }
          },
          {
            path: '/defaults',
            method: 'POST',
            description: 'Create default triggers (meeting prep, focus mode, break reminders)'
          }
        ]
      },
      
      // Multi-platform support
      platforms: {
        base: '/api/platforms',
        endpoints: [
          {
            path: '/register',
            method: 'POST',
            description: 'Register a new platform connection',
            body: {
                              platformType: 'Platform type (web, mobile, browser_extension, desktop_app, smartwatch)',
              deviceId: 'Unique device identifier',
              userId: 'User identifier',
              capabilities: '(Optional) Platform capabilities object'
            },
            example: {
              request: {
                method: 'POST',
                url: '/api/platforms/register',
                body: {
                  platformType: 'mobile',
                  deviceId: 'iphone-123',
                  userId: 'user123',
                  capabilities: {
                    notifications: true,
                    location: true
                  }
                }
              },
              response: {
                success: true,
                message: 'Platform registered successfully',
                data: {
                  connectionId: 'connection-1234567890-abc123',
                  platformType: 'mobile',
                  deviceId: 'iphone-123',
                  capabilities: { notifications: true, location: true },
                  status: 'connected'
                }
              }
            }
          },
          {
            path: '/stats',
            method: 'GET',
            description: 'Get platform statistics for a user',
            query: {
              userId: 'User identifier'
            }
          },
          {
            path: '/connections',
            method: 'GET',
            description: 'Get user\'s platform connections',
            query: {
              userId: 'User identifier'
            }
          },
          {
            path: '/connections/:connectionId',
            method: 'DELETE',
            description: 'Remove a platform connection',
            params: {
              connectionId: 'Connection ID to remove'
            }
          },
          {
            path: '/notify',
            method: 'POST',
            description: 'Send notification to user\'s platforms',
            body: {
              userId: 'User identifier',
              notification: 'Notification object with title, message, type'
            }
          },
          {
            path: '/sync',
            method: 'POST',
            description: 'Sync data across user\'s platforms',
            body: {
              userId: 'User identifier',
              data: 'Data to sync',
              dataType: '(Optional) Type of data being synced'
            }
          },
          {
            path: '/capabilities',
            method: 'PATCH',
            description: 'Update platform capabilities',
            body: {
              deviceId: 'Device identifier',
              capabilities: 'Updated capabilities object'
            }
          },
          {
            path: '/websocket',
            method: 'GET',
            description: 'Get WebSocket connection information',
            query: {
              userId: 'User identifier'
            }
          },
          {
            path: '/broadcast',
            method: 'POST',
            description: 'Broadcast message to all platforms',
            body: {
              message: 'Message object',
              messageType: 'Type of message',
              userId: '(Optional) Specific user to broadcast to'
            }
          },
          {
            path: '/supported',
            method: 'GET',
            description: 'Get supported platform types and their capabilities'
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

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * System status endpoint
 */
router.get('/status', async (req, res) => {
  try {
    const stats = workerManager.getWorkerStats();
    
    // Check Ollama status
    let ollamaStatus = false;
    try {
      ollamaStatus = await checkOllamaStatus();
    } catch (error) {
      console.warn('Ollama status check failed:', error.message);
    }
    
    // Check Pinecone memory status
    let memoryStatus = false;
    try {
      // Try a simple query to check if Pinecone is accessible
      await directAPICall('/describe_index_stats', {}, 'GET');
      memoryStatus = true;
    } catch (error) {
      console.warn('Pinecone status check failed:', error.message);
    }
    
    res.json({
      success: true,
      data: {
        ollama: ollamaStatus,
        memory: memoryStatus,
        workers: stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check system status',
      message: error.message
    });
  }
});

/**
 * Get worker thread status
 */
router.get('/system/workers', (req, res) => {
  const stats = workerManager.getWorkerStats();
  res.json({
    success: true,
    workerStatus: stats
  });
});

// Mount routes
router.use('/pinecone', pineconeRoutes);
router.use('/daily-digest', dailyDigestRoutes);
router.use('/context', contextRoutes);
router.use('/autonomous', autonomousActionRoutes);
router.use('/platforms', multiPlatformRoutes);
router.use('/jira', jiraRoutes);
router.use('/notion', notionRoutes);

router.use('/trello', trelloRoutes);
router.use('/n8n', n8nRoutes);
router.use('/google', googleRoutes);
router.use('/oauth', oauthRoutes);
router.use('/asana', asanaRoutes);
router.use('/memory', memoryRoutes);
router.use('/learning-analytics', learningAnalyticsRoutes);
router.use('/predict', predictionRoutes);

// 404 handler for API routes
router.use('*', (req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

export default router; 