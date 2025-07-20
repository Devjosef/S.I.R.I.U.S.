/**
 * Multi-Platform Service
 * 
 * S.I.R.I.U.S.'s platform manager - connects across web, mobile,
 * browser extensions, and system integrations
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Supported platform types
 */
export const PlatformTypes = {
  WEB: 'web',
  MOBILE: 'mobile',
  BROWSER_EXTENSION: 'browser_extension',
  DESKTOP_APP: 'desktop_app',
  SMARTWATCH: 'smartwatch',
  VOICE_ASSISTANT: 'voice_assistant'
};

/**
 * Connection status
 */
export const ConnectionStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  ERROR: 'error'
};

/**
 * A platform connection
 */
export class PlatformConnection {
  constructor(platformType, deviceId, userId) {
    this.id = `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.platformType = platformType;
    this.deviceId = deviceId;
    this.userId = userId;
    this.status = ConnectionStatus.DISCONNECTED;
    this.lastSeen = null;
    this.capabilities = this.getDefaultCapabilities(platformType);
    this.preferences = {};
    this.createdAt = new Date();
  }

  /**
   * Get default capabilities for a platform type
   * @param {string} platformType - Type of platform
   * @returns {Object} - Platform capabilities
   */
  getDefaultCapabilities(platformType) {
    const capabilities = {
      notifications: false,
      voice: false,
      location: false,
      camera: false,
      microphone: false,
      storage: false,
      background: false
    };

    switch (platformType) {
      case PlatformTypes.WEB:
        capabilities.notifications = true;
        capabilities.voice = true;
        capabilities.storage = true;
        break;
      
      case PlatformTypes.MOBILE:
        capabilities.notifications = true;
        capabilities.voice = true;
        capabilities.location = true;
        capabilities.camera = true;
        capabilities.microphone = true;
        capabilities.storage = true;
        capabilities.background = true;
        break;
      
      case PlatformTypes.BROWSER_EXTENSION:
        capabilities.notifications = true;
        capabilities.storage = true;
        capabilities.background = true;
        break;
      
      case PlatformTypes.DESKTOP_APP:
        capabilities.notifications = true;
        capabilities.voice = true;
        capabilities.storage = true;
        capabilities.background = true;
        break;
      
      case PlatformTypes.SMARTWATCH:
        capabilities.notifications = true;
        capabilities.voice = true;
        capabilities.location = true;
        break;
      
      case PlatformTypes.VOICE_ASSISTANT:
        capabilities.voice = true;
        capabilities.microphone = true;
        break;
    }

    return capabilities;
  }

  /**
   * Update connection status
   * @param {string} status - New status
   */
  updateStatus(status) {
    this.status = status;
    this.lastSeen = new Date();
  }

  /**
   * Check if connection is active
   * @returns {boolean} - Is connection active
   */
  isActive() {
    if (this.status !== ConnectionStatus.CONNECTED) return false;
    
    // Check if last seen is within 5 minutes
    if (!this.lastSeen) return false;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastSeen > fiveMinutesAgo;
  }
}

/**
 * Manages multi-platform connections and synchronization
 */
export class MultiPlatformService {
  constructor() {
    this.connections = new Map();
    this.syncQueue = [];
    this.platformDataDir = path.join(__dirname, '../../data/platforms');
    this.ensurePlatformDataDir();
  }

  /**
   * Make sure the platform data directory exists
   */
  async ensurePlatformDataDir() {
    try {
      await fs.mkdir(this.platformDataDir, { recursive: true });
    } catch (error) {
      console.error('Error creating platform data directory:', error);
    }
  }

  /**
   * Register a new platform connection
   * @param {string} platformType - Type of platform
   * @param {string} deviceId - Unique device identifier
   * @param {string} userId - User identifier
   * @param {Object} capabilities - Platform capabilities
   * @returns {PlatformConnection} - The created connection
   */
  registerConnection(platformType, deviceId, userId, capabilities = {}) {
    const connection = new PlatformConnection(platformType, deviceId, userId);
    
    // Override default capabilities with provided ones
    if (capabilities) {
      connection.capabilities = { ...connection.capabilities, ...capabilities };
    }
    
    this.connections.set(connection.id, connection);
    connection.updateStatus(ConnectionStatus.CONNECTED);
    
    console.log(`📱 Platform connected: ${platformType} (${deviceId})`);
    return connection;
  }

  /**
   * Remove a platform connection
   * @param {string} connectionId - Connection ID to remove
   */
  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      console.log(`📱 Platform disconnected: ${connection.platformType} (${connection.deviceId})`);
    }
  }

  /**
   * Get all connections for a user
   * @param {string} userId - User identifier
   * @returns {Array} - List of user's connections
   */
  getUserConnections(userId) {
    return Array.from(this.connections.values())
      .filter(connection => connection.userId === userId);
  }

  /**
   * Get active connections for a user
   * @param {string} userId - User identifier
   * @returns {Array} - List of active connections
   */
  getActiveConnections(userId) {
    return this.getUserConnections(userId)
      .filter(connection => connection.isActive());
  }

  /**
   * Send notification to all user's platforms
   * @param {string} userId - User identifier
   * @param {Object} notification - Notification data
   * @returns {Promise<Array>} - Results of notification attempts
   */
  async sendNotification(userId, notification) {
    const activeConnections = this.getActiveConnections(userId);
    const results = [];

    for (const connection of activeConnections) {
      if (connection.capabilities.notifications) {
        try {
          const result = await this.sendToPlatform(connection, 'notification', notification);
          results.push({
            connectionId: connection.id,
            platformType: connection.platformType,
            success: true,
            result
          });
        } catch (error) {
          results.push({
            connectionId: connection.id,
            platformType: connection.platformType,
            success: false,
            error: error.message
          });
        }
      }
    }

    return results;
  }

  /**
   * Send data to a specific platform
   * @param {PlatformConnection} connection - Platform connection
   * @param {string} type - Type of data to send
   * @param {Object} data - Data to send
   * @returns {Promise<Object>} - Result of the send operation
   */
  async sendToPlatform(connection, type, data) {
    // In a real implementation, this would use platform-specific APIs
    // For now, we'll simulate the sending process
    
    switch (connection.platformType) {
      case PlatformTypes.WEB:
        return this.sendToWeb(connection, type, data);
      
      case PlatformTypes.MOBILE:
        return this.sendToMobile(connection, type, data);
      
      case PlatformTypes.BROWSER_EXTENSION:
        return this.sendToBrowserExtension(connection, type, data);
      
      case PlatformTypes.DESKTOP_APP:
        return this.sendToDesktopApp(connection, type, data);
      
      case PlatformTypes.SMARTWATCH:
        return this.sendToSmartwatch(connection, type, data);
      
      case PlatformTypes.VOICE_ASSISTANT:
        return this.sendToVoiceAssistant(connection, type, data);
      
      default:
        throw new Error(`Unknown platform type: ${connection.platformType}`);
    }
  }

  /**
   * Send to web platform
   * @param {PlatformConnection} connection - Platform connection
   * @param {string} type - Type of data
   * @param {Object} data - Data to send
   * @returns {Promise<Object>} - Result
   */
  async sendToWeb(connection, type, data) {
    // Web platforms use WebSocket or Server-Sent Events
    return {
      platform: 'web',
      type,
      sent: true,
      timestamp: new Date()
    };
  }

  /**
   * Send to mobile platform
   * @param {PlatformConnection} connection - Platform connection
   * @param {string} type - Type of data
   * @param {Object} data - Data to send
   * @returns {Promise<Object>} - Result
   */
  async sendToMobile(connection, type, data) {
    // Mobile platforms use push notifications or WebSocket
    return {
      platform: 'mobile',
      type,
      sent: true,
      timestamp: new Date()
    };
  }

  /**
   * Send to browser extension
   * @param {PlatformConnection} connection - Platform connection
   * @param {string} type - Type of data
   * @param {Object} data - Data to send
   * @returns {Promise<Object>} - Result
   */
  async sendToBrowserExtension(connection, type, data) {
    // Browser extensions use chrome.runtime.sendMessage
    return {
      platform: 'browser_extension',
      type,
      sent: true,
      timestamp: new Date()
    };
  }

  /**
   * Send to desktop app
   * @param {PlatformConnection} connection - Platform connection
   * @param {string} type - Type of data
   * @param {Object} data - Data to send
   * @returns {Promise<Object>} - Result
   */
  async sendToDesktopApp(connection, type, data) {
    // Desktop apps use WebSocket or IPC
    return {
      platform: 'desktop_app',
      type,
      sent: true,
      timestamp: new Date()
    };
  }

  /**
   * Send to smartwatch
   * @param {PlatformConnection} connection - Platform connection
   * @param {string} type - Type of data
   * @param {Object} data - Data to send
   * @returns {Promise<Object>} - Result
   */
  async sendToSmartwatch(connection, type, data) {
    // Smartwatches use platform-specific APIs
    return {
      platform: 'smartwatch',
      type,
      sent: true,
      timestamp: new Date()
    };
  }

  /**
   * Send to voice assistant
   * @param {PlatformConnection} connection - Platform connection
   * @param {string} type - Type of data
   * @param {Object} data - Data to send
   * @returns {Promise<Object>} - Result
   */
  async sendToVoiceAssistant(connection, type, data) {
    // Voice assistants use text-to-speech
    return {
      platform: 'voice_assistant',
      type,
      sent: true,
      timestamp: new Date()
    };
  }

  /**
   * Sync data across all user's platforms
   * @param {string} userId - User identifier
   * @param {Object} data - Data to sync
   * @returns {Promise<Array>} - Sync results
   */
  async syncData(userId, data) {
    const activeConnections = this.getActiveConnections(userId);
    const results = [];

    for (const connection of activeConnections) {
      try {
        const result = await this.sendToPlatform(connection, 'sync', data);
        results.push({
          connectionId: connection.id,
          platformType: connection.platformType,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          connectionId: connection.id,
          platformType: connection.platformType,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get platform statistics
   * @param {string} userId - User identifier
   * @returns {Object} - Platform statistics
   */
  getPlatformStats(userId) {
    const userConnections = this.getUserConnections(userId);
    const activeConnections = this.getActiveConnections(userId);

    const stats = {
      total: userConnections.length,
      active: activeConnections.length,
      byPlatform: {},
      byStatus: {
        [ConnectionStatus.CONNECTED]: 0,
        [ConnectionStatus.DISCONNECTED]: 0,
        [ConnectionStatus.CONNECTING]: 0,
        [ConnectionStatus.ERROR]: 0
      }
    };

    userConnections.forEach(connection => {
      // Count by platform
      if (!stats.byPlatform[connection.platformType]) {
        stats.byPlatform[connection.platformType] = 0;
      }
      stats.byPlatform[connection.platformType]++;

      // Count by status
      stats.byStatus[connection.status]++;
    });

    return stats;
  }

  /**
   * Clean up inactive connections
   */
  cleanupInactiveConnections() {
    const now = new Date();
    const inactiveThreshold = 10 * 60 * 1000; // 10 minutes

    for (const [connectionId, connection] of this.connections) {
      if (connection.lastSeen) {
        const timeSinceLastSeen = now - connection.lastSeen.getTime();
        if (timeSinceLastSeen > inactiveThreshold) {
          connection.updateStatus(ConnectionStatus.DISCONNECTED);
        }
      }
    }
  }

  /**
   * Get connection by device ID
   * @param {string} deviceId - Device identifier
   * @returns {PlatformConnection|null} - Connection or null
   */
  getConnectionByDeviceId(deviceId) {
    for (const connection of this.connections.values()) {
      if (connection.deviceId === deviceId) {
        return connection;
      }
    }
    return null;
  }
}

// Create a singleton instance
const multiPlatformService = new MultiPlatformService();

export default multiPlatformService; 