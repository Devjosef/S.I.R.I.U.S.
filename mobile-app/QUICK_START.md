# 🚀 S.I.R.I.U.S. Native Mobile App - Quick Start

## Overview

This is a **native React Native mobile app** for S.I.R.I.U.S. that provides:
- 🤖 Full AI assistant integration
- 🎤 Voice commands and speech synthesis
- 📍 Location-aware context
- 🔔 Push notifications
- 📱 Native performance and offline support
- 🎨 Modern, responsive UI

## Prerequisites

- **Node.js 18+** and **npm**
- **Expo CLI** (`npm install -g expo-cli`)
- **S.I.R.I.U.S. server** running (see main project)
- **Mobile device** or **emulator**

## Quick Setup (5 minutes)

### 1. Navigate to Mobile App Directory
```bash
cd mobile-app
```

### 2. Run Setup Script
```bash
./setup-native.sh
```

The script will:
- ✅ Check dependencies
- ✅ Install required packages
- ✅ Configure server connection
- ✅ Create project structure
- ✅ Set up development environment

### 3. Start S.I.R.I.U.S. Server
```bash
# In another terminal, from the main project directory
cd ..
npm start
```

### 4. Start Mobile App
```bash
# Back in mobile-app directory
npm start
```

### 5. Run on Device
- **Install Expo Go** app on your phone
- **Scan QR code** from terminal
- **Grant permissions** when prompted

## Manual Setup (Alternative)

If the setup script doesn't work:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
API_SERVER=http://localhost:3000
WEBSOCKET_SERVER=ws://localhost:3000/ws
ENABLE_VOICE=true
ENABLE_LOCATION=true
ENABLE_NOTIFICATIONS=true
ENABLE_OFFLINE_MODE=true
```

### 3. Start Development
```bash
npm start
```

## Features

### 🤖 AI Assistant
- **Text Chat**: Type messages and get AI responses
- **Voice Commands**: Hold mic button to speak
- **Context Awareness**: Location and time-based responses
- **Autonomous Actions**: Trigger automated tasks

### 🎤 Voice Features
- **Speech Recognition**: Convert voice to text
- **Text-to-Speech**: Hear S.I.R.I.U.S. responses
- **Voice Commands**: Natural language interaction
- **Background Audio**: Works while app is minimized

### 📍 Location Services
- **Context Awareness**: Location-based assistance
- **Geofencing**: Location-triggered actions
- **Navigation**: Location-aware responses
- **Privacy**: Local processing when possible

### 🔔 Notifications
- **Push Notifications**: Real-time updates
- **Smart Alerts**: Context-aware notifications
- **Action Triggers**: Notification-based actions
- **Custom Sounds**: Personalized notification sounds

### 📱 Native Features
- **Offline Support**: Works without internet
- **Background Processing**: Continues working in background
- **Native Performance**: Optimized for mobile
- **Battery Efficient**: Minimal battery usage

## Development Commands

```bash
# Start development server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run in web browser
npm run web

# Build for production
expo build:android
expo build:ios

# Clear cache
expo r -c
```

## Configuration

### Environment Variables (.env)
```env
# Server Configuration
API_SERVER=http://localhost:3000
WEBSOCKET_SERVER=ws://localhost:3000/ws

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
```

### App Configuration (app.json)
- **iOS Bundle ID**: `com.sirius.mobile`
- **Android Package**: `com.sirius.mobile`
- **Permissions**: Microphone, Location, Camera, Notifications
- **Plugins**: Speech, Audio, Location, Notifications, etc.

## Troubleshooting

### Connection Issues
```bash
# Check server is running
curl http://localhost:3000

# Check network connectivity
ping localhost

# Verify WebSocket connection
# (Check browser console for WebSocket errors)
```

### Permission Issues
- **iOS**: Settings → Privacy & Security → Microphone/Location
- **Android**: Settings → Apps → S.I.R.I.U.S. → Permissions
- **Expo Go**: Grant permissions when prompted

### Build Issues
```bash
# Clear cache
expo r -c

# Reset Metro bundler
npx react-native start --reset-cache

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Performance Issues
- **Enable Hermes**: Better JavaScript performance
- **Optimize Images**: Use appropriate image sizes
- **Background Processing**: Limit background tasks
- **Memory Management**: Monitor memory usage

## Architecture

### Core Components
```
src/
├── services/
│   └── SiriusService.js    # Main S.I.R.I.U.S. integration
├── components/             # Reusable UI components
├── screens/               # App screens
├── navigation/            # Navigation setup
├── store/                 # State management
├── utils/                 # Utility functions
└── constants/             # App constants
```

### Key Features
- **WebSocket Communication**: Real-time server connection
- **Local SQLite Database**: Offline data storage
- **Event-Driven Architecture**: Reactive UI updates
- **State Management**: Zustand for app state
- **Native APIs**: Device-specific functionality

## Security

### Data Protection
- **Local Storage**: Sensitive data stored locally
- **Secure Communication**: HTTPS/WSS connections
- **Permission Management**: Minimal required permissions
- **Data Encryption**: Local data encryption

### Privacy
- **Local Processing**: Voice and location processed locally when possible
- **Data Minimization**: Only collect necessary data
- **User Control**: User controls data sharing
- **Transparency**: Clear data usage policies

## Performance

### Optimization
- **Lazy Loading**: Load components on demand
- **Image Optimization**: Compressed images and caching
- **Memory Management**: Efficient memory usage
- **Background Processing**: Optimized background tasks

### Monitoring
- **Performance Metrics**: Track app performance
- **Error Tracking**: Monitor and fix errors
- **Usage Analytics**: Understand user behavior
- **Battery Usage**: Monitor battery consumption

## Support

### Documentation
- **Main Project**: See main S.I.R.I.U.S. documentation
- **React Native**: [React Native Docs](https://reactnative.dev/)
- **Expo**: [Expo Documentation](https://docs.expo.dev/)
- **API Reference**: See API documentation

### Community
- **GitHub Issues**: Report bugs and feature requests
- **Discord**: Join the S.I.R.I.U.S. community
- **Stack Overflow**: Search for solutions
- **React Native Community**: General React Native help

## Next Steps

1. **Explore Features**: Try voice commands, location services
2. **Customize UI**: Modify colors, fonts, layout
3. **Add Integrations**: Connect to external services
4. **Deploy**: Build and publish to app stores
5. **Contribute**: Help improve the project

---

**Happy coding! 🚀**

For more information, see the main S.I.R.I.U.S. documentation. 