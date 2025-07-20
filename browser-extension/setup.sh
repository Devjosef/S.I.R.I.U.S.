#!/bin/bash

# S.I.R.I.U.S. Browser Extension Setup Script
# This script sets up the browser extension for S.I.R.I.U.S.

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== S.I.R.I.U.S. Browser Extension Setup ===${NC}"
echo "This script will set up the browser extension for S.I.R.I.U.S."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm and try again.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p icons
mkdir -p js
mkdir -p css
mkdir -p popup

# Copy icons
echo -e "${YELLOW}Copying icons...${NC}"
cp -r ../public/icons/* icons/

# Get server IP address
echo -e "${YELLOW}Enter the IP address of your S.I.R.I.U.S. server (default: 192.168.1.100):${NC}"
read SERVER_IP
SERVER_IP=${SERVER_IP:-"192.168.1.100"}

# Create manifest.json if it doesn't exist
if [ ! -f "manifest.json" ]; then
    echo -e "${YELLOW}Creating manifest.json...${NC}"
    cat > manifest.json << EOL
{
  "manifest_version": 3,
  "name": "S.I.R.I.U.S. Assistant",
  "version": "1.0.0",
  "description": "S.I.R.I.U.S. productivity assistant browser extension",
  "icons": {
    "16": "icons/sirius-icon-192.png",
    "48": "icons/sirius-icon-192.png",
    "128": "icons/sirius-icon-512.png"
  },
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "icons/sirius-icon-192.png",
      "48": "icons/sirius-icon-192.png",
      "128": "icons/sirius-icon-512.png"
    }
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "permissions": [
    "storage",
    "tabs",
    "activeTab",
    "scripting",
    "webNavigation"
  ],
  "host_permissions": [
    "http://${SERVER_IP}:3000/*",
    "ws://${SERVER_IP}:3000/*"
  ],
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+S",
        "mac": "Command+Shift+S"
      },
      "description": "Open S.I.R.I.U.S. Assistant"
    },
    "voice_command": {
      "suggested_key": {
        "default": "Alt+Shift+S",
        "mac": "Alt+Shift+S"
      },
      "description": "Start voice command"
    }
  }
}
EOL
fi

# Create background.js if it doesn't exist
if [ ! -f "background.js" ]; then
    echo -e "${YELLOW}Creating background.js...${NC}"
    cat > background.js << EOL
// S.I.R.I.U.S. Browser Extension Background Script

// Configuration
const config = {
  apiServer: 'http://${SERVER_IP}:3000',
  websocketServer: 'ws://${SERVER_IP}:3000/ws',
  enableVoice: true,
  deviceType: 'browser-extension'
};

// WebSocket connection
let ws = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let reconnectTimeout = null;

// Connect to WebSocket server
function connectWebSocket() {
  if (ws) {
    ws.close();
  }
  
  try {
    ws = new WebSocket(config.websocketServer);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts = 0;
      
      // Register as browser extension
      ws.send(JSON.stringify({
        type: 'register',
        platform: 'browser-extension',
        capabilities: {
          voice: config.enableVoice,
          notifications: true,
          contextAwareness: true
        }
      }));
      
      // Notify all open popup windows
      chrome.runtime.sendMessage({ type: 'connection_status', connected: true });
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Message received:', data);
      
      // Forward message to popup
      chrome.runtime.sendMessage({ type: 'ws_message', data });
      
      // Handle specific message types
      if (data.type === 'notification') {
        showNotification(data.title, data.message);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      
      // Notify all open popup windows
      chrome.runtime.sendMessage({ type: 'connection_status', connected: false });
      
      // Try to reconnect
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(\`Reconnecting in \${delay}ms (attempt \${reconnectAttempts})\`);
        
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        
        reconnectTimeout = setTimeout(connectWebSocket, delay);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('Failed to connect:', error);
  }
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/sirius-icon-192.png',
    title: title || 'S.I.R.I.U.S.',
    message: message || 'Notification from S.I.R.I.U.S.'
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get_connection_status') {
    sendResponse({ connected: ws && ws.readyState === WebSocket.OPEN });
  } else if (message.type === 'send_ws_message' && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message.data));
    sendResponse({ success: true });
  } else if (message.type === 'voice_command') {
    // Handle voice command
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'voice_command',
        command: message.command
      }));
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'WebSocket not connected' });
    }
  }
  
  return true; // Keep the message channel open for async response
});

// Connect when the extension is loaded
connectWebSocket();

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'voice_command') {
    // Open popup and trigger voice command
    chrome.action.openPopup();
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: 'trigger_voice_command' });
    }, 500);
  }
});

// Handle installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First installation
    chrome.tabs.create({ url: \`\${config.apiServer}/welcome\` });
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('Extension updated');
  }
});
EOL
fi

# Create popup HTML
if [ ! -f "popup/index.html" ]; then
    echo -e "${YELLOW}Creating popup HTML...${NC}"
    mkdir -p popup
    cat > popup/index.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>S.I.R.I.U.S. Assistant</title>
  <link rel="stylesheet" href="../css/popup.css">
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">
        <img src="../icons/sirius-icon-192.png" alt="S.I.R.I.U.S. Logo">
        <h1>S.I.R.I.U.S.</h1>
      </div>
      <div class="status">
        <span id="status-indicator"></span>
        <span id="status-text">Connecting...</span>
      </div>
    </header>
    
    <div class="content">
      <div id="message-display">Welcome to S.I.R.I.U.S.</div>
      
      <div class="voice-section">
        <button id="voice-button" class="primary-button">
          <span class="icon">🎤</span>
          Voice Command
        </button>
        <div id="voice-status">Click to speak</div>
      </div>
      
      <div class="actions">
        <button id="daily-digest-button" class="action-button">
          <span class="icon">📋</span>
          Daily Digest
        </button>
        <button id="context-button" class="action-button">
          <span class="icon">🧠</span>
          Analyze Context
        </button>
        <button id="settings-button" class="action-button">
          <span class="icon">⚙️</span>
          Settings
        </button>
      </div>
    </div>
    
    <footer>
      <div class="footer-text">S.I.R.I.U.S. Browser Assistant</div>
    </footer>
  </div>
  
  <script src="../js/popup.js"></script>
</body>
</html>
EOL

    # Create CSS for popup
    mkdir -p css
    cat > css/popup.css << EOL
/* S.I.R.I.U.S. Browser Extension Popup Styles */

:root {
  --primary-color: #0066cc;
  --secondary-color: #004080;
  --background-color: #f5f5f5;
  --text-color: #333;
  --border-color: #ddd;
  --success-color: #4CAF50;
  --error-color: #F44336;
  --warning-color: #FF9800;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  width: 350px;
  height: 500px;
  overflow: hidden;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

header {
  background-color: var(--primary-color);
  color: white;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
}

.logo img {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

.logo h1 {
  font-size: 18px;
  font-weight: 500;
}

.status {
  display: flex;
  align-items: center;
  font-size: 12px;
}

#status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--warning-color);
  margin-right: 6px;
}

.content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

#message-display {
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  min-height: 100px;
  max-height: 150px;
  overflow-y: auto;
}

.voice-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

#voice-button {
  width: 100%;
  padding: 12px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background-color 0.2s;
}

#voice-button:hover {
  background-color: var(--secondary-color);
}

#voice-button:disabled {
  background-color: var(--border-color);
  cursor: not-allowed;
}

#voice-status {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.action-button {
  padding: 8px;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: #f0f0f0;
}

.action-button .icon {
  font-size: 24px;
  margin-bottom: 4px;
}

footer {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #666;
  border-top: 1px solid var(--border-color);
}

/* Status colors */
.connected #status-indicator {
  background-color: var(--success-color);
}

.disconnected #status-indicator {
  background-color: var(--error-color);
}

/* Animations */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.listening #voice-button {
  animation: pulse 1.5s infinite;
  background-color: var(--warning-color);
}
EOL

    # Create JS for popup
    mkdir -p js
    cat > js/popup.js << EOL
// S.I.R.I.U.S. Browser Extension Popup Script

// DOM elements
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const messageDisplay = document.getElementById('message-display');
const voiceButton = document.getElementById('voice-button');
const voiceStatus = document.getElementById('voice-status');
const dailyDigestButton = document.getElementById('daily-digest-button');
const contextButton = document.getElementById('context-button');
const settingsButton = document.getElementById('settings-button');

// State
let isConnected = false;
let isListening = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check connection status
  chrome.runtime.sendMessage({ type: 'get_connection_status' }, (response) => {
    updateConnectionStatus(response.connected);
  });
  
  // Set up event listeners
  voiceButton.addEventListener('click', startVoiceCommand);
  dailyDigestButton.addEventListener('click', requestDailyDigest);
  contextButton.addEventListener('click', analyzeContext);
  settingsButton.addEventListener('click', openSettings);
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'connection_status') {
      updateConnectionStatus(message.connected);
    } else if (message.type === 'ws_message') {
      handleWebSocketMessage(message.data);
    } else if (message.type === 'trigger_voice_command') {
      startVoiceCommand();
    }
  });
});

// Update connection status UI
function updateConnectionStatus(connected) {
  isConnected = connected;
  document.body.classList.remove('connected', 'disconnected');
  
  if (connected) {
    document.body.classList.add('connected');
    statusText.textContent = 'Connected';
    voiceButton.disabled = false;
    dailyDigestButton.disabled = false;
    contextButton.disabled = false;
  } else {
    document.body.classList.add('disconnected');
    statusText.textContent = 'Disconnected';
    voiceButton.disabled = true;
    dailyDigestButton.disabled = true;
    contextButton.disabled = true;
  }
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
  if (data.type === 'speak') {
    messageDisplay.textContent = data.content;
    // Use browser's speech synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(data.content);
      speechSynthesis.speak(utterance);
    }
  } else if (data.type === 'update') {
    messageDisplay.textContent = data.content;
  }
}

// Start voice command
function startVoiceCommand() {
  if (!isConnected || isListening) return;
  
  isListening = true;
  document.body.classList.add('listening');
  voiceButton.innerHTML = '<span class="icon">🎤</span> Listening...';
  voiceStatus.textContent = 'Listening for command...';
  messageDisplay.textContent = 'Listening for your command...';
  
  // Check if browser supports speech recognition
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      console.log('Voice recognition started');
    };
    
    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript;
      voiceStatus.textContent = \`Command: "\${command}"\`;
      messageDisplay.textContent = \`Processing: "\${command}"\`;
      
      // Send command to background script
      chrome.runtime.sendMessage({ 
        type: 'send_ws_message',
        data: {
          type: 'voice_command',
          command: command
        }
      });
    };
    
    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      voiceStatus.textContent = \`Error: \${event.error}\`;
      stopListening();
    };
    
    recognition.onend = () => {
      stopListening();
    };
    
    // Start recognition
    recognition.start();
  } else {
    // Fallback for browsers without speech recognition
    voiceStatus.textContent = 'Speech recognition not supported';
    messageDisplay.textContent = 'Your browser does not support voice commands. Please type your command instead.';
    
    // Simulate recognition after 3 seconds
    setTimeout(() => {
      const simulatedCommand = "What's on my schedule today?";
      messageDisplay.textContent = \`Simulated command: "\${simulatedCommand}"\`;
      
      // Send command to background script
      chrome.runtime.sendMessage({ 
        type: 'send_ws_message',
        data: {
          type: 'voice_command',
          command: simulatedCommand
        }
      });
      
      stopListening();
    }, 3000);
  }
}

// Stop listening for voice commands
function stopListening() {
  isListening = false;
  document.body.classList.remove('listening');
  voiceButton.innerHTML = '<span class="icon">🎤</span> Voice Command';
  voiceStatus.textContent = 'Click to speak';
}

// Request daily digest
function requestDailyDigest() {
  if (!isConnected) return;
  
  messageDisplay.textContent = 'Generating daily digest...';
  
  chrome.runtime.sendMessage({ 
    type: 'send_ws_message',
    data: {
      type: 'request',
      action: 'daily_digest'
    }
  });
}

// Analyze current context
function analyzeContext() {
  if (!isConnected) return;
  
  messageDisplay.textContent = 'Analyzing current context...';
  
  // Get current tab information
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    
    chrome.runtime.sendMessage({ 
      type: 'send_ws_message',
      data: {
        type: 'request',
        action: 'analyze_context',
        context: {
          url: currentTab.url,
          title: currentTab.title
        }
      }
    });
  });
}

// Open settings
function openSettings() {
  chrome.runtime.openOptionsPage();
}
EOL
fi

# Make the script executable
chmod +x setup.sh

echo -e "${GREEN}Browser extension setup complete!${NC}"
echo -e "${YELLOW}To load the extension in Chrome:${NC}"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select the browser-extension directory"
echo ""
echo -e "${GREEN}To test the extension:${NC}"
echo "1. Make sure the S.I.R.I.U.S. server is running"
echo "2. Click the S.I.R.I.U.S. icon in your browser toolbar"
echo "3. Try the voice command feature" 