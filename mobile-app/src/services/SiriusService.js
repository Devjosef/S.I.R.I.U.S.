/**
 * S.I.R.I.U.S. Service for Native Mobile App
 * 
 * Handles all communication with the S.I.R.I.U.S. server
 * Manages WebSocket connections, API calls, and local storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { io } from 'socket.io-client';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const WEBSOCKET_URL = 'ws://localhost:3000/ws';

class SiriusService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.deviceId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.db = null;
    this.listeners = new Map();
    
    this.initializeDatabase();
  }

  /**
   * Initialize local SQLite database
   */
  async initializeDatabase() {
    this.db = SQLite.openDatabase('sirius.db');
    
    // Create tables
    await this.createTables();
  }

  /**
   * Create necessary database tables
   */
  async createTables() {
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        user_message TEXT,
        sirius_response TEXT,
        context TEXT,
        metadata TEXT
      );
      
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        category TEXT
      );
      
      CREATE TABLE IF NOT EXISTS actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT NOT NULL,
        status TEXT NOT NULL,
        result TEXT,
        timestamp TEXT NOT NULL,
        metadata TEXT
      );
      
      CREATE TABLE IF NOT EXISTS context_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        context_type TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        expires_at TEXT
      );
    `;

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(createTablesSQL, [], 
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Initialize the service
   */
  async initialize(userId = null) {
    try {
      // Get or generate device ID
      this.deviceId = await this.getDeviceId();
      
      // Get or generate user ID
      this.userId = userId || await this.getUserId();
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection');
      }

      // Connect to WebSocket
      await this.connectWebSocket();
      
      // Register device with server
      await this.registerDevice();
      
      // Load cached data
      await this.loadCachedData();
      
      console.log('🔌 S.I.R.I.U.S. service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize S.I.R.I.U.S. service:', error);
      throw error;
    }
  }

  /**
   * Get or generate device ID
   */
  async getDeviceId() {
    let deviceId = await SecureStore.getItemAsync('sirius_device_id');
    
    if (!deviceId) {
      deviceId = `mobile-${Device.osInternalBuildId || Date.now()}`;
      await SecureStore.setItemAsync('sirius_device_id', deviceId);
    }
    
    return deviceId;
  }

  /**
   * Get or generate user ID
   */
  async getUserId() {
    let userId = await SecureStore.getItemAsync('sirius_user_id');
    
    if (!userId) {
      userId = `user-${Date.now()}`;
      await SecureStore.setItemAsync('sirius_user_id', userId);
    }
    
    return userId;
  }

  /**
   * Connect to WebSocket server
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(WEBSOCKET_URL, {
          transports: ['websocket'],
          query: {
            userId: this.userId,
            deviceId: this.deviceId,
            platform: 'mobile'
          }
        });

        this.socket.on('connect', () => {
          console.log('🔌 WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 WebSocket disconnected:', reason);
          this.isConnected = false;
          this.emit('disconnected', reason);
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connectWebSocket(), 5000);
          }
        });

        this.socket.on('error', (error) => {
          console.error('🔌 WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        });

        // Handle incoming messages
        this.socket.on('message', (data) => {
          this.handleIncomingMessage(data);
        });

        this.socket.on('context_update', (context) => {
          this.handleContextUpdate(context);
        });

        this.socket.on('action_triggered', (action) => {
          this.handleActionTriggered(action);
        });

        this.socket.on('voice_command', (command) => {
          this.handleVoiceCommand(command);
        });

      } catch (error) {
        console.error('❌ Failed to connect WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Register device with S.I.R.I.U.S. server
   */
  async registerDevice() {
    try {
      const deviceInfo = {
        platformType: 'mobile',
        deviceId: this.deviceId,
        userId: this.userId,
        capabilities: {
          notifications: true,
          voice: true,
          location: true,
          camera: true,
          microphone: true,
          storage: true,
          background: true,
          offline: true
        },
        deviceInfo: {
          brand: Device.brand,
          model: Device.modelName,
          osVersion: Device.osVersion,
          platformApiLevel: Device.platformApiLevel,
          totalMemory: Device.totalMemory,
          isDevice: Device.isDevice
        }
      };

      const response = await fetch(`${API_BASE_URL}/platforms/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deviceInfo)
      });

      if (!response.ok) {
        throw new Error(`Failed to register device: ${response.status}`);
      }

      const result = await response.json();
      console.log('📱 Device registered successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to register device:', error);
      throw error;
    }
  }

  /**
   * Send message to S.I.R.I.U.S.
   */
  async sendMessage(message, context = {}) {
    try {
      const messageData = {
        userId: this.userId,
        deviceId: this.deviceId,
        message,
        context: {
          ...context,
          platform: 'mobile',
          timestamp: new Date().toISOString()
        }
      };

      // Store in local database
      await this.storeConversation(message, null, context);

      // Send via WebSocket if connected
      if (this.isConnected && this.socket) {
        this.socket.emit('message', messageData);
      } else {
        // Fallback to HTTP API
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageData)
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        await this.handleResponse(result);
        return result;
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send voice command
   */
  async sendVoiceCommand(audioData, transcription = null) {
    try {
      const commandData = {
        userId: this.userId,
        deviceId: this.deviceId,
        audioData,
        transcription,
        platform: 'mobile',
        timestamp: new Date().toISOString()
      };

      // Send via WebSocket if connected
      if (this.isConnected && this.socket) {
        this.socket.emit('voice_command', commandData);
      } else {
        // Fallback to HTTP API
        const response = await fetch(`${API_BASE_URL}/voice/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(commandData)
        });

        if (!response.ok) {
          throw new Error(`Voice API request failed: ${response.status}`);
        }

        const result = await response.json();
        await this.handleResponse(result);
        return result;
      }
    } catch (error) {
      console.error('❌ Failed to send voice command:', error);
      throw error;
    }
  }

  /**
   * Get context analysis
   */
  async getContext() {
    try {
      const response = await fetch(`${API_BASE_URL}/context/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          deviceId: this.deviceId,
          platform: 'mobile'
        })
      });

      if (!response.ok) {
        throw new Error(`Context API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache context data
      await this.cacheContextData(result.data);
      
      return result.data;
    } catch (error) {
      console.error('❌ Failed to get context:', error);
      throw error;
    }
  }

  /**
   * Trigger autonomous action
   */
  async triggerAction(actionType, parameters = {}) {
    try {
      const actionData = {
        userId: this.userId,
        deviceId: this.deviceId,
        actionType,
        parameters,
        platform: 'mobile',
        timestamp: new Date().toISOString()
      };

      // Store action in local database
      await this.storeAction(actionType, 'pending', null, parameters);

      // Send via WebSocket if connected
      if (this.isConnected && this.socket) {
        this.socket.emit('trigger_action', actionData);
      } else {
        // Fallback to HTTP API
        const response = await fetch(`${API_BASE_URL}/autonomous/trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(actionData)
        });

        if (!response.ok) {
          throw new Error(`Action API request failed: ${response.status}`);
        }

        const result = await response.json();
        await this.handleActionResult(result);
        return result;
      }
    } catch (error) {
      console.error('❌ Failed to trigger action:', error);
      throw error;
    }
  }

  /**
   * Handle incoming messages
   */
  handleIncomingMessage(data) {
    console.log('📨 Received message:', data);
    
    // Store conversation
    this.storeConversation(null, data.response, data.context);
    
    // Emit to listeners
    this.emit('message', data);
  }

  /**
   * Handle context updates
   */
  async handleContextUpdate(context) {
    console.log('🔄 Context updated:', context);
    
    // Cache context data
    await this.cacheContextData(context);
    
    // Emit to listeners
    this.emit('context_update', context);
  }

  /**
   * Handle action triggers
   */
  async handleActionTriggered(action) {
    console.log('⚡ Action triggered:', action);
    
    // Update action status
    await this.updateActionStatus(action.id, 'executing', action);
    
    // Emit to listeners
    this.emit('action_triggered', action);
  }

  /**
   * Handle voice commands
   */
  handleVoiceCommand(command) {
    console.log('🎤 Voice command received:', command);
    
    // Emit to listeners
    this.emit('voice_command', command);
  }

  /**
   * Handle API responses
   */
  async handleResponse(result) {
    // Store conversation
    await this.storeConversation(null, result.response, result.context);
    
    // Emit to listeners
    this.emit('response', result);
  }

  /**
   * Handle action results
   */
  async handleActionResult(result) {
    // Update action status
    await this.updateActionStatus(result.actionId, result.success ? 'completed' : 'failed', result);
    
    // Emit to listeners
    this.emit('action_result', result);
  }

  /**
   * Store conversation in local database
   */
  async storeConversation(userMessage, siriusResponse, context = {}) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO conversations (timestamp, user_message, sirius_response, context, metadata) VALUES (?, ?, ?, ?, ?)',
          [
            new Date().toISOString(),
            userMessage,
            siriusResponse,
            JSON.stringify(context),
            JSON.stringify({ platform: 'mobile' })
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Store action in local database
   */
  async storeAction(actionType, status, result = null, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO actions (action_type, status, result, timestamp, metadata) VALUES (?, ?, ?, ?, ?)',
          [
            actionType,
            status,
            result ? JSON.stringify(result) : null,
            new Date().toISOString(),
            JSON.stringify(metadata)
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Update action status
   */
  async updateActionStatus(actionId, status, result = null) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'UPDATE actions SET status = ?, result = ? WHERE id = ?',
          [
            status,
            result ? JSON.stringify(result) : null,
            actionId
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Cache context data
   */
  async cacheContextData(context) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'INSERT OR REPLACE INTO context_cache (context_type, data, timestamp, expires_at) VALUES (?, ?, ?, ?)',
          [
            'current',
            JSON.stringify(context),
            new Date().toISOString(),
            new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Load cached data
   */
  async loadCachedData() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM context_cache WHERE expires_at > ? ORDER BY timestamp DESC LIMIT 1',
          [new Date().toISOString()],
          (_, { rows }) => {
            if (rows.length > 0) {
              const context = JSON.parse(rows.item(0).data);
              this.emit('cached_context', context);
            }
            resolve();
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Event listener system
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }
}

// Export singleton instance
export default new SiriusService(); 