#!/bin/bash

# S.I.R.I.U.S. Mobile App Setup Script
# This script sets up the React Native mobile app for S.I.R.I.U.S.

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== S.I.R.I.U.S. Mobile App Setup ===${NC}"
echo "This script will set up the React Native mobile app for S.I.R.I.U.S."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version 18+ is required. You have version $NODE_VERSION.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm and try again.${NC}"
    exit 1
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo -e "${YELLOW}Expo CLI is not installed. Installing...${NC}"
    npm install -g expo-cli
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install Expo CLI. Please install it manually: npm install -g expo-cli${NC}"
        exit 1
    fi
    echo -e "${GREEN}Expo CLI installed successfully.${NC}"
else
    echo -e "${GREEN}Expo CLI is already installed.${NC}"
fi

# Create .env file for configuration
echo -e "${YELLOW}Setting up environment configuration...${NC}"

# Get server IP address
echo -e "${YELLOW}Enter the IP address of your S.I.R.I.U.S. server (default: 192.168.1.100):${NC}"
read SERVER_IP
SERVER_IP=${SERVER_IP:-"192.168.1.100"}

# Create .env file
cat > .env << EOL
API_SERVER=http://${SERVER_IP}:3000
WEBSOCKET_SERVER=ws://${SERVER_IP}:3000/ws
ENABLE_VOICE=true
DEVICE_TYPE=mobile
MATRYOSHKA_ENABLED=true
EOL

echo -e "${GREEN}Environment configuration created.${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies. Please check the error messages above.${NC}"
    exit 1
fi
echo -e "${GREEN}Dependencies installed successfully.${NC}"

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p assets/icons
mkdir -p src/components
mkdir -p src/screens
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/hooks

# Copy icons
echo -e "${YELLOW}Copying icons...${NC}"
cp -r ../public/icons/* assets/icons/

# Create basic app structure if it doesn't exist
if [ ! -f "App.js" ]; then
    echo -e "${YELLOW}Creating basic app structure...${NC}"
    cat > App.js << EOL
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ActivityIndicator } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// Import environment variables
import Constants from 'expo-constants';
const API_SERVER = Constants.manifest.extra?.apiServer || 'http://localhost:3000';
const WEBSOCKET_SERVER = Constants.manifest.extra?.websocketServer || 'ws://localhost:3000/ws';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('Welcome to S.I.R.I.U.S.');
  const [listening, setListening] = useState(false);
  const [ws, setWs] = useState(null);

  // Connect to WebSocket server
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Connect to WebSocket server
  const connectWebSocket = () => {
    setLoading(true);
    try {
      const socket = new WebSocket(WEBSOCKET_SERVER);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setLoading(false);
        setMessage('Connected to S.I.R.I.U.S.');
        
        // Register as mobile device
        socket.send(JSON.stringify({
          type: 'register',
          platform: 'mobile',
          capabilities: {
            voice: true,
            notifications: true,
            location: true
          }
        }));
      };
      
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Message received:', data);
        
        if (data.type === 'speak') {
          speakMessage(data.content);
        } else if (data.type === 'update') {
          setMessage(data.content);
        }
      };
      
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        setMessage('Disconnected. Trying to reconnect...');
        // Try to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setMessage('Connection error. Check server status.');
        setConnected(false);
      };
      
      setWs(socket);
    } catch (error) {
      console.error('Failed to connect:', error);
      setLoading(false);
      setMessage('Failed to connect to S.I.R.I.U.S. server.');
    }
  };

  // Speak message using text-to-speech
  const speakMessage = (text) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9
    });
  };

  // Start voice recognition
  const startListening = async () => {
    try {
      setListening(true);
      setMessage('Listening...');
      
      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setMessage('Microphone permission denied');
        setListening(false);
        return;
      }
      
      // In a real app, you would implement voice recognition here
      // For this demo, we'll simulate it with a timeout
      setTimeout(() => {
        setListening(false);
        setMessage('Command received: "What\'s on my schedule today?"');
        
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'voice_command',
            command: 'What\'s on my schedule today?'
          }));
        }
        
        // Simulate response after 1 second
        setTimeout(() => {
          setMessage('You have a meeting at 2 PM with the design team.');
          speakMessage('You have a meeting at 2 PM with the design team.');
        }, 1000);
      }, 2000);
    } catch (error) {
      console.error('Voice recognition error:', error);
      setListening(false);
      setMessage('Voice recognition error');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <Text style={styles.title}>S.I.R.I.U.S.</Text>
      <Text style={styles.subtitle}>Mobile Assistant</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" />
      ) : (
        <>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: connected ? '#4CAF50' : '#F44336' }]} />
            <Text style={styles.statusText}>{connected ? 'Connected' : 'Disconnected'}</Text>
          </View>
          
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <Button
              title={listening ? "Listening..." : "Voice Command"}
              onPress={startListening}
              disabled={listening || !connected}
              color="#0066cc"
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 30,
    color: '#333',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    marginTop: 20,
    width: '80%',
  },
});
EOL

    # Create app.json for Expo configuration
    cat > app.json << EOL
{
  "expo": {
    "name": "S.I.R.I.U.S.",
    "slug": "sirius-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icons/sirius-icon-512.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/icons/sirius-icon-512.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.devjosef.sirius"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icons/sirius-icon-512.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.devjosef.sirius"
    },
    "web": {
      "favicon": "./assets/icons/sirius-icon-192.png"
    },
    "extra": {
      "apiServer": "http://${SERVER_IP}:3000",
      "websocketServer": "ws://${SERVER_IP}:3000/ws",
      "enableVoice": true,
      "deviceType": "mobile",
      "matryoshkaEnabled": true
    },
    "plugins": [
      "expo-speech",
      "expo-av"
    ]
  }
}
EOL

    # Create package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        cat > package.json << EOL
{
  "name": "sirius-mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "expo-status-bar": "~1.11.1",
    "expo-speech": "~11.7.0",
    "expo-av": "~13.10.0",
    "expo-constants": "~15.4.5",
    "react": "18.2.0",
    "react-native": "0.73.4"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}
EOL
    fi

    echo -e "${GREEN}Basic app structure created.${NC}"
fi

# Start the Expo development server
echo -e "${GREEN}Setup complete! You can now start the app with:${NC}"
echo -e "${YELLOW}npx expo start${NC}"
echo ""
echo -e "${GREEN}To run on a physical device:${NC}"
echo "1. Install the Expo Go app on your device"
echo "2. Scan the QR code that appears after starting the app"
echo ""
echo -e "${GREEN}To run on an emulator:${NC}"
echo "Press 'a' for Android emulator"
echo "Press 'i' for iOS simulator (macOS only)"
echo ""
echo -e "${YELLOW}Would you like to start the app now? (y/n)${NC}"
read START_APP

if [[ $START_APP == "y" || $START_APP == "Y" ]]; then
    npx expo start
else
    echo -e "${GREEN}You can start the app later with: npx expo start${NC}"
fi 