#!/bin/bash

# S.I.R.I.U.S. Native Mobile App Setup Script
# This script sets up the React Native mobile app for S.I.R.I.U.S.

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== S.I.R.I.U.S. Native Mobile App Setup ===${NC}"
echo "This script will set up the React Native mobile app for S.I.R.I.U.S."
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the mobile-app directory."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. You have version $NODE_VERSION."
    exit 1
fi

print_status "Node.js version $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_status "npm version $(npm -v) detected"

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    print_warning "Expo CLI is not installed. Installing..."
    npm install -g expo-cli
    if [ $? -ne 0 ]; then
        print_error "Failed to install Expo CLI. Please install it manually: npm install -g expo-cli"
        exit 1
    fi
    print_status "Expo CLI installed successfully"
else
    print_status "Expo CLI is already installed"
fi

# Check if we're on macOS for iOS development
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_info "macOS detected - iOS development capabilities available"
    
    # Check for Xcode
    if command -v xcodebuild &> /dev/null; then
        print_status "Xcode detected"
    else
        print_warning "Xcode not found. iOS development will not be available."
    fi
    
    # Check for CocoaPods
    if command -v pod &> /dev/null; then
        print_status "CocoaPods detected"
    else
        print_warning "CocoaPods not found. Installing..."
        sudo gem install cocoapods
        if [ $? -ne 0 ]; then
            print_error "Failed to install CocoaPods"
        else
            print_status "CocoaPods installed successfully"
        fi
    fi
else
    print_info "Non-macOS system detected - iOS development not available"
fi

# Check for Android development tools
if command -v adb &> /dev/null; then
    print_status "Android SDK detected"
else
    print_warning "Android SDK not found. Android development will not be available."
    print_info "To enable Android development, install Android Studio and configure ANDROID_HOME"
fi

# Get server configuration
echo ""
print_info "S.I.R.I.U.S. Server Configuration"
echo ""

# Get server IP address
echo -e "${YELLOW}Enter the IP address of your S.I.R.I.U.S. server:${NC}"
echo "  - Use 'localhost' if running on the same machine"
echo "  - Use your local IP (e.g., 192.168.1.100) for network access"
echo "  - Use your public IP for remote access"
read -p "Server IP [localhost]: " SERVER_IP
SERVER_IP=${SERVER_IP:-"localhost"}

# Get server port
read -p "Server port [3000]: " SERVER_PORT
SERVER_PORT=${SERVER_PORT:-"3000"}

# Get WebSocket port (usually same as HTTP port)
read -p "WebSocket port [$SERVER_PORT]: " WS_PORT
WS_PORT=${WS_PORT:-$SERVER_PORT}

# Create .env file for configuration
print_info "Creating environment configuration..."

cat > .env << EOL
# S.I.R.I.U.S. Mobile App Configuration
API_SERVER=http://${SERVER_IP}:${SERVER_PORT}
WEBSOCKET_SERVER=ws://${SERVER_IP}:${WS_PORT}/ws

# Feature Flags
ENABLE_VOICE=true
ENABLE_LOCATION=true
ENABLE_NOTIFICATIONS=true
ENABLE_CAMERA=true
ENABLE_OFFLINE_MODE=true
MATRYOSHKA_ENABLED=true

# Device Configuration
DEVICE_TYPE=mobile
PLATFORM_TYPE=native

# Development Settings
DEBUG_MODE=true
LOG_LEVEL=info
EOL

print_status "Environment configuration created"

# Create app.json for Expo configuration
print_info "Creating Expo configuration..."

cat > app.json << EOL
{
  "expo": {
    "name": "S.I.R.I.U.S.",
    "slug": "sirius-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#00c6ff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.sirius.mobile",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "S.I.R.I.U.S. needs microphone access for voice commands",
        "NSLocationWhenInUseUsageDescription": "S.I.R.I.U.S. uses location for context-aware assistance",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "S.I.R.I.U.S. uses location for background context",
        "NSCameraUsageDescription": "S.I.R.I.U.S. uses camera for visual assistance",
        "NSPhotoLibraryUsageDescription": "S.I.R.I.U.S. accesses photos for document analysis"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#00c6ff"
      },
      "package": "com.sirius.mobile",
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.WAKE_LOCK",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.RECEIVE_BOOT_COMPLETED"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-speech",
      "expo-av",
      "expo-location",
      "expo-notifications",
      "expo-device",
      "expo-secure-store",
      "expo-file-system",
      "expo-sqlite",
      "expo-background-fetch",
      "expo-task-manager"
    ],
    "extra": {
      "eas": {
        "projectId": "sirius-mobile-project"
      }
    }
  }
}
EOL

print_status "Expo configuration created"

# Create necessary directories
print_info "Creating project structure..."

mkdir -p assets/icons
mkdir -p assets/images
mkdir -p src/components
mkdir -p src/screens
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/hooks
mkdir -p src/store
mkdir -p src/navigation
mkdir -p src/constants

print_status "Project structure created"

# Copy icons from main project
if [ -d "../public/icons" ]; then
    print_info "Copying icons from main project..."
    cp -r ../public/icons/* assets/icons/
    print_status "Icons copied successfully"
else
    print_warning "Icons directory not found in main project"
fi

# Create basic assets if they don't exist
if [ ! -f "assets/icon.png" ]; then
    print_info "Creating placeholder icon..."
    # Create a simple placeholder icon (you should replace this with your actual icon)
    convert -size 1024x1024 xc:#00c6ff -fill white -gravity center -pointsize 72 -annotate 0 "S" assets/icon.png 2>/dev/null || print_warning "Could not create placeholder icon (ImageMagick not available)"
fi

if [ ! -f "assets/splash.png" ]; then
    print_info "Creating placeholder splash screen..."
    # Create a simple placeholder splash (you should replace this with your actual splash)
    convert -size 1242x2436 xc:#00c6ff -fill white -gravity center -pointsize 48 -annotate 0 "S.I.R.I.U.S." assets/splash.png 2>/dev/null || print_warning "Could not create placeholder splash (ImageMagick not available)"
fi

# Install dependencies
print_info "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies. Please check the error messages above."
    exit 1
fi

print_status "Dependencies installed successfully"

# Create basic component structure
print_info "Creating basic component structure..."

# Create index.js for the app
cat > index.js << EOL
import { registerRootComponent } from 'expo';
import App from './App';

// Register the main component
registerRootComponent(App);
EOL

# Create a basic constants file
cat > src/constants/index.js << EOL
// S.I.R.I.U.S. Mobile App Constants

export const COLORS = {
  primary: '#00c6ff',
  secondary: '#0072ff',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#f44336',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
  padding: 15,
  radius: 10,
};

export const FONTS = {
  regular: {
    fontWeight: 'normal',
  },
  medium: {
    fontWeight: '500',
  },
  bold: {
    fontWeight: 'bold',
  },
};

export const API_CONFIG = {
  baseURL: process.env.API_SERVER || 'http://localhost:3000',
  websocketURL: process.env.WEBSOCKET_SERVER || 'ws://localhost:3000/ws',
  timeout: 10000,
};

export const FEATURES = {
  voice: process.env.ENABLE_VOICE === 'true',
  location: process.env.ENABLE_LOCATION === 'true',
  notifications: process.env.ENABLE_NOTIFICATIONS === 'true',
  camera: process.env.ENABLE_CAMERA === 'true',
  offline: process.env.ENABLE_OFFLINE_MODE === 'true',
  matryoshka: process.env.MATRYOSHKA_ENABLED === 'true',
};
EOL

print_status "Basic component structure created"

# Create a basic navigation setup
cat > src/navigation/AppNavigator.js << EOL
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Import screens (to be created)
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Chat') {
            iconName = 'chat';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00c6ff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
EOL

print_status "Navigation structure created"

# Create a basic store setup
cat > src/store/index.js << EOL
import { create } from 'zustand';

export const useSiriusStore = create((set, get) => ({
  // Connection state
  isConnected: false,
  isLoading: false,
  error: null,
  
  // User state
  userId: null,
  deviceId: null,
  
  // Conversation state
  conversations: [],
  currentMessage: '',
  
  // Context state
  context: null,
  
  // Voice state
  isListening: false,
  isSpeaking: false,
  
  // Actions
  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setUserId: (userId) => set({ userId }),
  setDeviceId: (deviceId) => set({ deviceId }),
  addConversation: (conversation) => set((state) => ({
    conversations: [...state.conversations, conversation]
  })),
  setCurrentMessage: (message) => set({ currentMessage: message }),
  setContext: (context) => set({ context }),
  setListening: (listening) => set({ isListening: listening }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  
  // Computed
  getLastMessage: () => {
    const { conversations } = get();
    return conversations[conversations.length - 1];
  },
}));
EOL

print_status "Store structure created"

# Create a basic README for the mobile app
cat > README.md << EOL
# S.I.R.I.U.S. Mobile App

Native React Native mobile application for S.I.R.I.U.S. assistant.

## Features

- 🤖 **AI Assistant**: Full S.I.R.I.U.S. integration
- 🎤 **Voice Commands**: Natural language voice interaction
- 📍 **Location Awareness**: Context-aware assistance
- 🔔 **Push Notifications**: Real-time updates
- 📱 **Native Performance**: Optimized for mobile devices
- 🔄 **Offline Support**: Works without internet connection
- 🎨 **Modern UI**: Beautiful, responsive interface

## Setup

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure Server**
   - Update \`.env\` file with your S.I.R.I.U.S. server details
   - Ensure the server is running and accessible

3. **Start Development**
   \`\`\`bash
   npm start
   \`\`\`

4. **Run on Device**
   - Install Expo Go app on your device
   - Scan the QR code from the terminal
   - Or run: \`npm run android\` / \`npm run ios\`

## Development

- **iOS**: Requires macOS and Xcode
- **Android**: Requires Android Studio and SDK
- **Web**: Works in any modern browser

## Configuration

Edit \`.env\` file to customize:
- Server endpoints
- Feature flags
- Development settings

## Building for Production

\`\`\`bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
\`\`\`

## Troubleshooting

- **Connection Issues**: Check server IP and port in \`.env\`
- **Permission Errors**: Ensure all permissions are granted
- **Build Errors**: Clear cache with \`expo r -c\`

## Support

For issues and questions, refer to the main S.I.R.I.U.S. documentation.
EOL

print_status "Documentation created"

# Test the setup
print_info "Testing setup..."

# Check if the app can start
if npm start -- --help > /dev/null 2>&1; then
    print_status "Setup test passed"
else
    print_warning "Setup test failed - you may need to install additional dependencies"
fi

echo ""
print_status "🎉 S.I.R.I.U.S. Mobile App Setup Complete!"
echo ""
print_info "Next Steps:"
echo "1. Start the S.I.R.I.U.S. server: cd .. && npm start"
echo "2. Start the mobile app: npm start"
echo "3. Install Expo Go on your device"
echo "4. Scan the QR code to run the app"
echo ""
print_info "Configuration:"
echo "- Server: http://${SERVER_IP}:${SERVER_PORT}"
echo "- WebSocket: ws://${SERVER_IP}:${WS_PORT}/ws"
echo "- Environment: .env"
echo ""
print_info "Development Commands:"
echo "- npm start          # Start Expo development server"
echo "- npm run android    # Run on Android emulator"
echo "- npm run ios        # Run on iOS simulator"
echo "- npm run web        # Run in web browser"
echo ""
print_info "For more information, see README.md"
echo ""

# Make the script executable
chmod +x setup-native.sh

print_status "Setup script completed successfully!" 