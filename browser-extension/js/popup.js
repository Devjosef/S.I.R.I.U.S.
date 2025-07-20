// S.I.R.I.U.S. Browser Extension Popup Script

// Message types
const MessageTypes = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  HEARTBEAT: 'heartbeat',
  // Voice commands removed - see VOICE_ROADMAP.md for future plans
  // VOICE_COMMAND: 'voice_command',
  // VOICE_RESPONSE: 'voice_response',
  NOTIFICATION: 'notification',
  ALERT: 'alert',
  REMINDER: 'reminder',
  SYNC_CONTEXT: 'sync_context',
  REQUEST: 'request'
};

// DOM elements
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const messageDisplay = document.getElementById('message-display');
// Voice elements removed - see VOICE_ROADMAP.md for future plans
// const voiceButton = document.getElementById('voice-button');
// const voiceStatus = document.getElementById('voice-status');
const dailyDigestButton = document.getElementById('daily-digest-button');
const contextButton = document.getElementById('context-button');
const settingsButton = document.getElementById('settings-button');

// State
let isConnected = false;
let isListening = false;

// Voice system removed - see VOICE_ROADMAP.md for future plans
// import voiceSystem from './voice-system.js';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check connection status
  try {
    chrome.runtime.sendMessage({ type: 'get_connection_status' }, (response) => {
      if (response) {
        updateConnectionStatus(response.connected);
      } else {
        updateConnectionStatus(false);
      }
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    updateConnectionStatus(false);
  }
  
  // Set up event listeners
  // Voice commands removed - see VOICE_ROADMAP.md for future plans
  // voiceButton.addEventListener('click', startVoiceCommand);
  dailyDigestButton.addEventListener('click', requestDailyDigest);
  contextButton.addEventListener('click', analyzeContext);
  settingsButton.addEventListener('click', openSettings);
  
  // Set up test buttons
  const testAudioButton = document.getElementById('test-audio-button');
  const testSpeechButton = document.getElementById('test-speech-button');
  
  if (testAudioButton) {
    testAudioButton.addEventListener('click', () => {
      try {
        playBeep();
        messageDisplay.textContent = 'Testing audio with a beep sound...';
      } catch (error) {
        console.error('Error playing beep:', error);
        messageDisplay.textContent = 'Failed to play beep sound.';
      }
    });
  }
  
  if (testSpeechButton) {
    testSpeechButton.addEventListener('click', () => {
      try {
        testSpeechSynthesis();
      } catch (error) {
        console.error('Error testing speech:', error);
        messageDisplay.textContent = 'Failed to test speech synthesis.';
      }
    });
  }
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'connection_status') {
      updateConnectionStatus(message.connected);
    } else if (message.type === 'ws_message') {
      handleWebSocketMessage(message.data);
    // Voice commands removed - see VOICE_ROADMAP.md for future plans
    // } else if (message.type === 'trigger_voice_command') {
    //   startVoiceCommand();
    // }
  });
});

// Update connection status UI
function updateConnectionStatus(connected) {
  isConnected = connected;
  document.body.classList.remove('connected', 'disconnected');
  
  if (connected) {
    document.body.classList.add('connected');
    statusText.textContent = 'Connected';
    // Voice commands removed - see VOICE_ROADMAP.md for future plans
    // voiceButton.disabled = false;
    dailyDigestButton.disabled = false;
    contextButton.disabled = false;
  } else {
    document.body.classList.add('disconnected');
    statusText.textContent = 'Disconnected';
    // Voice commands removed - see VOICE_ROADMAP.md for future plans
    // voiceButton.disabled = true;
    dailyDigestButton.disabled = true;
    contextButton.disabled = true;
  }
}

// Play a beep sound
function playBeep() {
  try {
    // Create an audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    
    // Create an oscillator
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Set up the oscillator
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // value in hertz
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Start and stop the beep
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    oscillator.start();
    
    // Stop after a short duration
    setTimeout(() => {
      oscillator.stop();
    }, 200);
    
    console.log('Beep played successfully');
    return true;
  } catch (error) {
    console.error('Error playing beep:', error);
    return false;
  }
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
  console.log('Received message:', data);
  
  if (data.type === 'update') {
    const content = data.data?.content || data.content;
    messageDisplay.textContent = content;
  }
}

// Voice commands removed - see VOICE_ROADMAP.md for future plans
// function startVoiceCommand() { ... }
// function stopListening() { ... }

// Request daily digest
function requestDailyDigest() {
  if (!isConnected) return;
  
  messageDisplay.textContent = 'Generating daily digest...';
  
  chrome.runtime.sendMessage({ 
    type: 'send_ws_message',
    data: {
      type: MessageTypes.REQUEST,
      data: {
        action: 'daily_digest'
      }
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
        type: MessageTypes.REQUEST,
        data: {
          action: 'analyze_context',
          context: {
            url: currentTab.url,
            title: currentTab.title
          }
        }
      }
    });
  });
}

// Open settings
function openSettings() {
  // For now, just show a message
  messageDisplay.textContent = 'Settings will be available in a future update.';
} 

// Test speech synthesis
function testSpeechSynthesis() {
  if ('speechSynthesis' in window) {
    try {
      const testText = "This is a test of the speech synthesis. If you can hear this, speech synthesis is working correctly.";
      console.log('Testing speech synthesis with:', testText);
      
      // Create and speak the utterance
      const utterance = new SpeechSynthesisUtterance(testText);
      window.speechSynthesis.speak(utterance);
      
      messageDisplay.textContent = 'Testing speech synthesis...';
      return true;
    } catch (error) {
      console.error('Error in test speech synthesis:', error);
      messageDisplay.textContent = 'Error testing speech synthesis.';
      return false;
    }
  } else {
    console.error('Speech synthesis not supported');
    messageDisplay.textContent = 'Speech synthesis not supported in this browser.';
    return false;
  }
} 