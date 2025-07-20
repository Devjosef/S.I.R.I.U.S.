/**
 * S.I.R.I.U.S. Browser Extension - Background Script
 * 
 * Handles WebSocket connections, notifications, and background tasks
 */

// S.I.R.I.U.S. Browser Extension Background Script

// Configuration
const config = {
  apiServer: 'http://localhost:3000',
  websocketServer: 'ws://localhost:3000/ws',
  enableVoice: true,
  deviceType: 'browser-extension'
};

// Message types
const MessageTypes = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  HEARTBEAT: 'heartbeat',
  VOICE_COMMAND: 'voice_command',
  VOICE_RESPONSE: 'voice_response',
  NOTIFICATION: 'notification',
  ALERT: 'alert',
  REMINDER: 'reminder',
  SYNC_CONTEXT: 'sync_context'
};

// Debug logging
function debug(message, data) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage, data || '');
}

// WebSocket connection
let ws = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let reconnectTimeout = null;

// Connection status
let isConnected = false;

// Connect to WebSocket server
function connectWebSocket() {
  if (ws) {
    ws.close();
  }
  
  try {
    // Add userId, platform, and deviceId as URL parameters
    const deviceId = `browser-${Date.now()}`;
    const wsUrl = `${config.websocketServer}?userId=browser-user&platform=browser_extension&deviceId=${deviceId}`;
    debug(`Connecting to WebSocket: ${wsUrl}`);
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      debug('WebSocket connected successfully');
      reconnectAttempts = 0;
      isConnected = true;
      
      // Send heartbeat message to keep connection alive
      const heartbeatMessage = {
        type: MessageTypes.HEARTBEAT,
        data: {
          timestamp: Date.now()
        }
      };
      debug('Sending heartbeat message', heartbeatMessage);
      ws.send(JSON.stringify(heartbeatMessage));
      
      // Notify all open popup windows
      try {
        chrome.runtime.sendMessage({ type: 'connection_status', connected: true });
      } catch (error) {
        console.log('No popup listening yet');
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        debug('Message received', data);
        
        // Forward message to popup
        try {
          chrome.runtime.sendMessage({ type: 'ws_message', data });
        } catch (error) {
          console.log('Error forwarding message to popup:', error);
        }
        
        // Handle specific message types
        if (data.type === MessageTypes.NOTIFICATION || data.type === 'notification') {
          showNotification(data.data?.title || data.title, data.data?.message || data.message);
        }
      } catch (error) {
        debug('Error parsing message', error);
      }
    };
    
    ws.onclose = (event) => {
      debug(`WebSocket closed: ${event.code} - ${event.reason}`);
      isConnected = false;
      
      // Notify all open popup windows
      try {
        chrome.runtime.sendMessage({ type: 'connection_status', connected: false });
      } catch (error) {
        console.log('No popup listening yet');
      }
      
      // Try to reconnect
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        debug(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
        
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        
        reconnectTimeout = setTimeout(connectWebSocket, delay);
      }
    };
    
    ws.onerror = (error) => {
      debug('WebSocket error', error);
      isConnected = false;
    };
  } catch (error) {
    debug('Failed to connect', error);
    isConnected = false;
  }
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('popup/notification-icon.png'),
    title: title || 'S.I.R.I.U.S.',
    message: message || 'Notification from S.I.R.I.U.S.'
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debug('Message from popup', message);
  
  if (message.type === 'get_connection_status') {
    const connected = isConnected && ws && ws.readyState === WebSocket.OPEN;
    debug(`Connection status: ${connected ? 'Connected' : 'Disconnected'}`);
    sendResponse({ connected });
  } else if (message.type === 'send_ws_message' && ws && ws.readyState === WebSocket.OPEN) {
    debug('Sending message to server', message.data);
    ws.send(JSON.stringify(message.data));
    sendResponse({ success: true });
  } else if (message.type === 'voice_command') {
    // Handle voice command
    if (ws && ws.readyState === WebSocket.OPEN) {
      const voiceMessage = {
        type: MessageTypes.VOICE_COMMAND,
        data: {
          command: message.command
        }
      };
      debug('Sending voice command', voiceMessage);
      ws.send(JSON.stringify(voiceMessage));
      sendResponse({ success: true });
    } else {
      debug('Cannot send voice command - WebSocket not connected');
      sendResponse({ success: false, error: 'WebSocket not connected' });
    }
  } else {
    // For any other message, just acknowledge receipt
    sendResponse({ received: true });
  }
  
  return true; // Keep the message channel open for async response
});

// Connect when the extension is loaded
debug('Extension background script loaded');
connectWebSocket();

// Set up a heartbeat interval to keep the connection alive
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const heartbeatMessage = {
      type: MessageTypes.HEARTBEAT,
      data: {
        timestamp: Date.now()
      }
    };
    ws.send(JSON.stringify(heartbeatMessage));
  }
}, 30000); // Send heartbeat every 30 seconds

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  debug(`Keyboard command received: ${command}`);
  if (command === 'voice_command') {
    // Open popup and trigger voice command
    chrome.action.openPopup();
    setTimeout(() => {
      try {
        chrome.runtime.sendMessage({ type: 'trigger_voice_command' });
      } catch (error) {
        console.log('Error triggering voice command:', error);
      }
    }, 500);
  }
});

// Handle installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First installation - log instead of opening welcome page
    debug('S.I.R.I.U.S. extension installed');
  } else if (details.reason === 'update') {
    // Extension updated
    debug('S.I.R.I.U.S. extension updated');
  }
}); 