/**
 * WebSocket Service
 * 
 * Real-time communication layer for S.I.R.I.U.S. - enables
 * instant updates across all connected platforms
 */

import { WebSocketServer } from 'ws';
import multiPlatformService from './multiPlatformService.js';
import contextEngine from './contextEngine.js';
import autonomousActionEngine from './autonomousActionEngine.js';

/**
 * WebSocket message types
 */
export const MessageTypes = {
  // Connection management
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  HEARTBEAT: 'heartbeat',
  
  // Data synchronization
  SYNC_CONTEXT: 'sync_context',
  SYNC_ACTIONS: 'sync_actions',
  SYNC_PREFERENCES: 'sync_preferences',
  
  // Notifications
  NOTIFICATION: 'notification',
  ALERT: 'alert',
  REMINDER: 'reminder',
  
  // Actions
  ACTION_TRIGGERED: 'action_triggered',
  ACTION_COMPLETED: 'action_completed',
  ACTION_FAILED: 'action_failed',
  
  // Future voice interface (see VOICE_ROADMAP.md)
  // VOICE_COMMAND: 'voice_command',
  // VOICE_RESPONSE: 'voice_response',
  
  // Platform specific
  PLATFORM_UPDATE: 'platform_update',
  CAPABILITY_UPDATE: 'capability_update'
};

/**
 * WebSocket message structure
 */
export class WebSocketMessage {
  constructor(type, data, userId = null, connectionId = null) {
    this.id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.data = data;
    this.userId = userId;
    this.connectionId = connectionId;
    this.timestamp = new Date();
  }

  /**
   * Convert to JSON string
   * @returns {string} - JSON representation
   */
  toJSON() {
    return JSON.stringify({
      id: this.id,
      type: this.type,
      data: this.data,
      userId: this.userId,
      connectionId: this.connectionId,
      timestamp: this.timestamp.toISOString()
    });
  }

  /**
   * Create from JSON string
   * @param {string} json - JSON string
   * @returns {WebSocketMessage} - Message object
   */
  static fromJSON(json) {
    const obj = JSON.parse(json);
    const message = new WebSocketMessage(obj.type, obj.data, obj.userId, obj.connectionId);
    message.id = obj.id;
    message.timestamp = new Date(obj.timestamp);
    return message;
  }
}

/**
 * WebSocket connection wrapper
 */
export class WebSocketConnection {
  constructor(ws, userId, platformType, deviceId) {
    this.ws = ws;
    this.userId = userId;
    this.platformType = platformType;
    this.deviceId = deviceId;
    this.connectionId = null;
    this.isAlive = true;
    this.lastHeartbeat = Date.now();
    this.messageQueue = [];
    this.createdAt = new Date();
  }

  /**
   * Send a message to this connection
   * @param {WebSocketMessage} message - Message to send
   * @returns {boolean} - Success status
   */
  send(message) {
    if (this.ws.readyState === 1) { // WebSocket.OPEN
      try {
        this.ws.send(message.toJSON());
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Send a simple message
   * @param {string} type - Message type
   * @param {Object} data - Message data
   * @returns {boolean} - Success status
   */
  sendSimple(type, data) {
    const message = new WebSocketMessage(type, data, this.userId, this.connectionId);
    return this.send(message);
  }

  /**
   * Close the connection
   */
  close() {
    this.isAlive = false;
    if (this.ws.readyState === 1) {
      this.ws.close();
    }
  }

  /**
   * Update heartbeat
   */
  updateHeartbeat() {
    this.lastHeartbeat = Date.now();
    this.isAlive = true;
  }

  /**
   * Check if connection is stale
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {boolean} - Is connection stale
   */
  isStale(timeoutMs = 30000) {
    return Date.now() - this.lastHeartbeat > timeoutMs;
  }
}

/**
 * WebSocket service for real-time communication
 */
export class WebSocketService {
  constructor() {
    this.wss = null;
    this.connections = new Map();
    this.messageHandlers = new Map();
    this.heartbeatInterval = null;
    this.cleanupInterval = null;
  }

  /**
   * Initialize the WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Start heartbeat and cleanup intervals
    this.startHeartbeat();
    this.startCleanup();

    console.log('🔌 WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket instance
   * @param {Object} req - HTTP request
   */
  handleConnection(ws, req) {
    // Extract connection info from URL parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    const platformType = url.searchParams.get('platform') || 'web';
    const deviceId = url.searchParams.get('deviceId') || `device-${Date.now()}`;

    if (!userId) {
      ws.close(1008, 'User ID required');
      return;
    }

    // Create connection wrapper
    const connection = new WebSocketConnection(ws, userId, platformType, deviceId);
    
    // Register with multi-platform service
    const platformConnection = multiPlatformService.registerConnection(
      platformType, 
      deviceId, 
      userId
    );
    connection.connectionId = platformConnection.id;

    // Store connection
    this.connections.set(connection.connectionId, connection);

    // Set up message handlers
    ws.on('message', (data) => {
      this.handleMessage(connection, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(connection);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(connection);
    });

    // Send welcome message
    connection.sendSimple(MessageTypes.CONNECT, {
      message: 'Connected to S.I.R.I.U.S.',
      connectionId: connection.connectionId,
      platformType: connection.platformType,
      capabilities: platformConnection.capabilities
    });

    console.log(`🔌 WebSocket connected: ${platformType} (${deviceId}) for user ${userId}`);
  }

  /**
   * Handle WebSocket message
   * @param {WebSocketConnection} connection - Connection wrapper
   * @param {Buffer|string} data - Raw message data
   */
  handleMessage(connection, data) {
    try {
      const message = WebSocketMessage.fromJSON(data.toString());
      
      // Update heartbeat
      connection.updateHeartbeat();

      // Handle different message types
      switch (message.type) {
        case MessageTypes.HEARTBEAT:
          connection.sendSimple(MessageTypes.HEARTBEAT, { timestamp: Date.now() });
          break;

        case MessageTypes.SYNC_CONTEXT:
          this.handleSyncContext(connection, message);
          break;

        // Voice commands removed - see VOICE_ROADMAP.md for future plans
        // case MessageTypes.VOICE_COMMAND:
        //   this.handleVoiceCommand(connection, message);
        //   break;

        case MessageTypes.PLATFORM_UPDATE:
          this.handlePlatformUpdate(connection, message);
          break;

        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle context synchronization
   * @param {WebSocketConnection} connection - Connection wrapper
   * @param {WebSocketMessage} message - Message
   */
  async handleSyncContext(connection, message) {
    try {
      const context = await contextEngine.analyzeContext(connection.userId);
      connection.sendSimple(MessageTypes.SYNC_CONTEXT, {
        context,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error syncing context:', error);
    }
  }

  /**
   * Handle voice command (removed - see VOICE_ROADMAP.md for future plans)
   * @param {WebSocketConnection} connection - Connection wrapper
   * @param {WebSocketMessage} message - Message
   */
  // async handleVoiceCommand(connection, message) {
  //   // Voice command handling removed - will be reimplemented with professional solutions
  //   // See docs/VOICE_ROADMAP.md for implementation plans
  // }

  /**
   * Handle platform update
   * @param {WebSocketConnection} connection - Connection wrapper
   * @param {WebSocketMessage} message - Message
   */
  handlePlatformUpdate(connection, message) {
    try {
      // Update platform capabilities or preferences
      const platformConnection = multiPlatformService.getConnectionByDeviceId(connection.deviceId);
      if (platformConnection) {
        if (message.data.capabilities) {
          platformConnection.capabilities = { ...platformConnection.capabilities, ...message.data.capabilities };
        }
        if (message.data.preferences) {
          platformConnection.preferences = { ...platformConnection.preferences, ...message.data.preferences };
        }
      }

      connection.sendSimple(MessageTypes.PLATFORM_UPDATE, {
        success: true,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error handling platform update:', error);
    }
  }

  /**
   * Handle WebSocket disconnection
   * @param {WebSocketConnection} connection - Connection wrapper
   */
  handleDisconnection(connection) {
    // Remove from connections
    this.connections.delete(connection.connectionId);
    
    // Remove from multi-platform service
    multiPlatformService.removeConnection(connection.connectionId);
    
    console.log(`🔌 WebSocket disconnected: ${connection.platformType} (${connection.deviceId})`);
  }

  /**
   * Broadcast message to all connections for a user
   * @param {string} userId - User identifier
   * @param {WebSocketMessage} message - Message to broadcast
   */
  broadcastToUser(userId, message) {
    let sentCount = 0;
    
    for (const connection of this.connections.values()) {
      if (connection.userId === userId && connection.isAlive) {
        if (connection.send(message)) {
          sentCount++;
        }
      }
    }
    
    return sentCount;
  }

  /**
   * Broadcast message to all connections
   * @param {WebSocketMessage} message - Message to broadcast
   */
  broadcastToAll(message) {
    let sentCount = 0;
    
    for (const connection of this.connections.values()) {
      if (connection.isAlive) {
        if (connection.send(message)) {
          sentCount++;
        }
      }
    }
    
    return sentCount;
  }

  /**
   * Send notification to user's platforms
   * @param {string} userId - User identifier
   * @param {Object} notification - Notification data
   */
  sendNotification(userId, notification) {
    const message = new WebSocketMessage(MessageTypes.NOTIFICATION, notification, userId);
    return this.broadcastToUser(userId, message);
  }

  /**
   * Send action update to user's platforms
   * @param {string} userId - User identifier
   * @param {Object} action - Action data
   */
  sendActionUpdate(userId, action) {
    const messageType = action.success ? MessageTypes.ACTION_COMPLETED : MessageTypes.ACTION_FAILED;
    const message = new WebSocketMessage(messageType, action, userId);
    return this.broadcastToUser(userId, message);
  }

  /**
   * Start heartbeat interval
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      for (const connection of this.connections.values()) {
        if (connection.isAlive) {
          connection.sendSimple(MessageTypes.HEARTBEAT, { timestamp: Date.now() });
        }
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Start cleanup interval
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      for (const [connectionId, connection] of this.connections) {
        if (connection.isStale()) {
          console.log(`Cleaning up stale connection: ${connectionId}`);
          connection.close();
          this.connections.delete(connectionId);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Stop the WebSocket service
   */
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
    console.log('🔌 WebSocket service stopped');
  }

  /**
   * Get connection statistics
   * @returns {Object} - Connection statistics
   */
  getStats() {
    const stats = {
      total: this.connections.size,
      byPlatform: {},
      byUser: {}
    };

    for (const connection of this.connections.values()) {
      // Count by platform
      if (!stats.byPlatform[connection.platformType]) {
        stats.byPlatform[connection.platformType] = 0;
      }
      stats.byPlatform[connection.platformType]++;

      // Count by user
      if (!stats.byUser[connection.userId]) {
        stats.byUser[connection.userId] = 0;
      }
      stats.byUser[connection.userId]++;
    }

    return stats;
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService; 