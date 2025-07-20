/**
 * Multi-Platform Controller
 * 
 * Handles web requests for S.I.R.I.U.S.'s multi-platform features -
 * platform registration, synchronization, and cross-device communication
 */

import multiPlatformService, { PlatformTypes } from '../services/multiPlatformService.js';
import websocketService from '../services/websocketService.js';
import contextEngine from '../services/contextEngine.js';

/**
 * Register a new platform connection
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const registerPlatform = async (req, res, next) => {
  try {
    const { platformType, deviceId, userId, capabilities } = req.body;
    
    if (!platformType || !deviceId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Platform type, device ID, and user ID are required'
      });
    }

    // Validate platform type
    if (!Object.values(PlatformTypes).includes(platformType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid platform type. Supported types: ${Object.values(PlatformTypes).join(', ')}`
      });
    }

    const connection = multiPlatformService.registerConnection(
      platformType,
      deviceId,
      userId,
      capabilities
    );
    
    res.status(200).json({
      success: true,
      message: 'Platform registered successfully',
      data: {
        connectionId: connection.id,
        platformType: connection.platformType,
        deviceId: connection.deviceId,
        capabilities: connection.capabilities,
        status: connection.status
      }
    });
  } catch (error) {
    console.error('Error registering platform:', error);
    next(error);
  }
};

/**
 * Get platform statistics for a user
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getPlatformStats = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const stats = multiPlatformService.getPlatformStats(userId);
    const wsStats = websocketService.getStats();
    
    res.status(200).json({
      success: true,
      message: 'Platform statistics retrieved successfully',
      data: {
        platformStats: stats,
        websocketStats: wsStats,
        totalConnections: stats.total + wsStats.total
      }
    });
  } catch (error) {
    console.error('Error getting platform stats:', error);
    next(error);
  }
};

/**
 * Get user's platform connections
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getUserConnections = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const connections = multiPlatformService.getUserConnections(userId);
    const activeConnections = multiPlatformService.getActiveConnections(userId);
    
    res.status(200).json({
      success: true,
      message: 'User connections retrieved successfully',
      data: {
        connections: connections.map(conn => ({
          id: conn.id,
          platformType: conn.platformType,
          deviceId: conn.deviceId,
          status: conn.status,
          lastSeen: conn.lastSeen,
          capabilities: conn.capabilities,
          preferences: conn.preferences,
          createdAt: conn.createdAt
        })),
        active: activeConnections.length,
        total: connections.length
      }
    });
  } catch (error) {
    console.error('Error getting user connections:', error);
    next(error);
  }
};

/**
 * Remove a platform connection
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const removeConnection = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'Connection ID is required'
      });
    }

    multiPlatformService.removeConnection(connectionId);
    
    res.status(200).json({
      success: true,
      message: 'Connection removed successfully',
      data: {
        connectionId
      }
    });
  } catch (error) {
    console.error('Error removing connection:', error);
    next(error);
  }
};

/**
 * Send notification to user's platforms
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const sendNotification = async (req, res, next) => {
  try {
    const { userId, notification } = req.body;
    
    if (!userId || !notification) {
      return res.status(400).json({
        success: false,
        error: 'User ID and notification are required'
      });
    }

    const results = await multiPlatformService.sendNotification(userId, notification);
    const wsResults = websocketService.sendNotification(userId, notification);
    
    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        platformResults: results,
        websocketResults: wsResults,
        totalSent: results.length + wsResults
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    next(error);
  }
};

/**
 * Sync data across user's platforms
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const syncData = async (req, res, next) => {
  try {
    const { userId, data, dataType } = req.body;
    
    if (!userId || !data) {
      return res.status(400).json({
        success: false,
        error: 'User ID and data are required'
      });
    }

    let syncData = data;
    
    // If syncing context, get fresh context data
    if (dataType === 'context') {
      const context = await contextEngine.analyzeContext(userId);
      syncData = { context, timestamp: new Date() };
    }

    const results = await multiPlatformService.syncData(userId, syncData);
    
    res.status(200).json({
      success: true,
      message: 'Data synced successfully',
      data: {
        results,
        dataType,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error syncing data:', error);
    next(error);
  }
};

/**
 * Update platform capabilities
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const updateCapabilities = async (req, res, next) => {
  try {
    const { deviceId, capabilities } = req.body;
    
    if (!deviceId || !capabilities) {
      return res.status(400).json({
        success: false,
        error: 'Device ID and capabilities are required'
      });
    }

    const connection = multiPlatformService.getConnectionByDeviceId(deviceId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    connection.capabilities = { ...connection.capabilities, ...capabilities };
    
    res.status(200).json({
      success: true,
      message: 'Capabilities updated successfully',
      data: {
        deviceId,
        capabilities: connection.capabilities
      }
    });
  } catch (error) {
    console.error('Error updating capabilities:', error);
    next(error);
  }
};

/**
 * Get WebSocket connection info
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getWebSocketInfo = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const wsStats = websocketService.getStats();
    const userConnections = wsStats.byUser[userId] || 0;
    
    res.status(200).json({
      success: true,
      message: 'WebSocket info retrieved successfully',
      data: {
        totalConnections: wsStats.total,
        userConnections,
        byPlatform: wsStats.byPlatform,
        websocketUrl: `ws://localhost:3000/ws?userId=${userId}&platform=web&deviceId=${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Error getting WebSocket info:', error);
    next(error);
  }
};

/**
 * Broadcast message to all platforms
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const broadcastMessage = async (req, res, next) => {
  try {
    const { message, messageType, userId } = req.body;
    
    if (!message || !messageType) {
      return res.status(400).json({
        success: false,
        error: 'Message and message type are required'
      });
    }

    let sentCount = 0;
    
    if (userId) {
      // Send to specific user
      const wsMessage = {
        type: messageType,
        data: message,
        timestamp: Date.now()
      };
      sentCount = websocketService.broadcastToUser(userId, wsMessage);
    } else {
      // Broadcast to all
      const wsMessage = {
        type: messageType,
        data: message,
        timestamp: Date.now()
      };
      sentCount = websocketService.broadcastToAll(wsMessage);
    }
    
    res.status(200).json({
      success: true,
      message: 'Message broadcasted successfully',
      data: {
        sentCount,
        messageType,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    next(error);
  }
};

/**
 * Get supported platform types
 * @param {Object} req - The web request
 * @param {Object} res - The web response
 * @param {Function} next - Move to next step if something goes wrong
 */
export const getSupportedPlatforms = async (req, res, next) => {
  try {
    const platforms = Object.values(PlatformTypes).map(type => ({
      type,
      name: type.replace('_', ' ').toUpperCase(),
      description: getPlatformDescription(type),
      capabilities: getDefaultCapabilities(type)
    }));
    
    res.status(200).json({
      success: true,
      message: 'Supported platforms retrieved successfully',
      data: {
        platforms,
        total: platforms.length
      }
    });
  } catch (error) {
    console.error('Error getting supported platforms:', error);
    next(error);
  }
};

/**
 * Get platform description
 * @param {string} platformType - Platform type
 * @returns {string} - Platform description
 */
function getPlatformDescription(platformType) {
  const descriptions = {
    [PlatformTypes.WEB]: 'Web browser interface with full functionality',
    [PlatformTypes.MOBILE]: 'Mobile app with native capabilities',
    [PlatformTypes.BROWSER_EXTENSION]: 'Browser extension for enhanced web integration',
    [PlatformTypes.DESKTOP_APP]: 'Desktop application with system integration',
    [PlatformTypes.SMARTWATCH]: 'Smartwatch app for quick interactions',
    [PlatformTypes.VOICE_ASSISTANT]: 'Voice-only interface for hands-free operation'
  };
  
  return descriptions[platformType] || 'Unknown platform type';
}

/**
 * Get default capabilities for platform
 * @param {string} platformType - Platform type
 * @returns {Object} - Default capabilities
 */
function getDefaultCapabilities(platformType) {
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

export default {
  registerPlatform,
  getPlatformStats,
  getUserConnections,
  removeConnection,
  sendNotification,
  syncData,
  updateCapabilities,
  getWebSocketInfo,
  broadcastMessage,
  getSupportedPlatforms
}; 