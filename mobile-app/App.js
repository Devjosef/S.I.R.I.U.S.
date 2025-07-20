/**
 * S.I.R.I.U.S. Native Mobile App
 * 
 * React Native mobile application for S.I.R.I.U.S. assistant
 * Provides native mobile capabilities and seamless integration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Import S.I.R.I.U.S. service
import SiriusService from './src/services/SiriusService';

const { width, height } = Dimensions.get('window');

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [message, setMessage] = useState('');
  const [inputText, setInputText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [context, setContext] = useState(null);
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);

  const scrollViewRef = useRef();

  useEffect(() => {
    initializeApp();
    setupNotifications();
    requestPermissions();
    
    return () => {
      // Cleanup
      if (recording) {
        recording.unloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
      SiriusService.disconnect();
    };
  }, []);

  /**
   * Initialize the mobile app
   */
  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Initialize S.I.R.I.U.S. service
      await SiriusService.initialize();
      
      // Set up event listeners
      setupEventListeners();
      
      // Get initial context
      await fetchContext();
      
      setIsLoading(false);
      setIsConnected(true);
      
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsLoading(false);
      Alert.alert('Connection Error', 'Failed to connect to S.I.R.I.U.S. server. Please check your connection and try again.');
    }
  };

  /**
   * Set up event listeners for S.I.R.I.U.S. service
   */
  const setupEventListeners = () => {
    // Connection events
    SiriusService.on('connected', () => {
      setIsConnected(true);
      setMessage('Connected to S.I.R.I.U.S.');
    });

    SiriusService.on('disconnected', (reason) => {
      setIsConnected(false);
      setMessage(`Disconnected: ${reason}`);
    });

    // Message events
    SiriusService.on('message', (data) => {
      addConversation('sirius', data.response);
      speakMessage(data.response);
    });

    SiriusService.on('response', (data) => {
      addConversation('sirius', data.response);
      speakMessage(data.response);
    });

    // Context events
    SiriusService.on('context_update', (contextData) => {
      setContext(contextData);
    });

    SiriusService.on('cached_context', (contextData) => {
      setContext(contextData);
    });

    // Action events
    SiriusService.on('action_triggered', (action) => {
      setMessage(`⚡ Action triggered: ${action.title}`);
    });

    SiriusService.on('action_result', (result) => {
      setMessage(`✅ Action completed: ${result.title}`);
    });

    // Voice events
    SiriusService.on('voice_command', (command) => {
      setMessage(`🎤 Voice command: ${command.transcription}`);
    });

    // Error events
    SiriusService.on('error', (error) => {
      console.error('S.I.R.I.U.S. error:', error);
      setMessage(`❌ Error: ${error.message}`);
    });
  };

  /**
   * Set up push notifications
   */
  const setupNotifications = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications to receive S.I.R.I.U.S. updates.');
        return;
      }
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  };

  /**
   * Request necessary permissions
   */
  const requestPermissions = async () => {
    try {
      // Location permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Location Permission', 'Location access is needed for context-aware assistance.');
      }

      // Audio permission
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      if (audioStatus !== 'granted') {
        Alert.alert('Audio Permission', 'Microphone access is needed for voice commands.');
      }

    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  /**
   * Fetch context from S.I.R.I.U.S.
   */
  const fetchContext = async () => {
    try {
      const contextData = await SiriusService.getContext();
      setContext(contextData);
    } catch (error) {
      console.error('Error fetching context:', error);
    }
  };

  /**
   * Send text message to S.I.R.I.U.S.
   */
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    // Add user message to conversation
    addConversation('user', userMessage);
    
    try {
      // Send to S.I.R.I.U.S.
      await SiriusService.sendMessage(userMessage, {
        location: await getCurrentLocation(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage('❌ Failed to send message. Please try again.');
    }
  };

  /**
   * Start voice recording
   */
  const startRecording = async () => {
    try {
      setIsListening(true);
      setMessage('🎤 Listening...');

      // Configure audio recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsListening(false);
      setMessage('❌ Failed to start recording');
    }
  };

  /**
   * Stop voice recording and send
   */
  const stopRecording = async () => {
    try {
      setIsListening(false);
      setMessage('🔄 Processing voice command...');

      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Convert to base64
      const base64Audio = await convertAudioToBase64(uri);

      // Send voice command to S.I.R.I.U.S.
      await SiriusService.sendVoiceCommand(base64Audio);

    } catch (error) {
      console.error('Error stopping recording:', error);
      setMessage('❌ Failed to process voice command');
    }
  };

  /**
   * Convert audio file to base64
   */
  const convertAudioToBase64 = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting audio to base64:', error);
      throw error;
    }
  };

  /**
   * Speak message using text-to-speech
   */
  const speakMessage = async (text) => {
    try {
      setIsSpeaking(true);
      
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    } catch (error) {
      console.error('Error speaking message:', error);
      setIsSpeaking(false);
    }
  };

  /**
   * Get current location
   */
  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  /**
   * Add conversation to the list
   */
  const addConversation = (sender, message) => {
    const newConversation = {
      id: Date.now(),
      sender,
      message,
      timestamp: new Date().toISOString()
    };
    
    setConversations(prev => [...prev, newConversation]);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  /**
   * Trigger autonomous action
   */
  const triggerAction = async (actionType) => {
    try {
      setMessage(`⚡ Triggering ${actionType}...`);
      await SiriusService.triggerAction(actionType);
    } catch (error) {
      console.error('Error triggering action:', error);
      setMessage('❌ Failed to trigger action');
    }
  };

  /**
   * Render conversation item
   */
  const renderConversationItem = (item) => {
    const isUser = item.sender === 'user';
    
    return (
      <View key={item.id} style={[styles.conversationItem, isUser ? styles.userMessage : styles.siriusMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.siriusBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.siriusText]}>
            {item.message}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#00c6ff', '#0072ff']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Connecting to S.I.R.I.U.S...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00c6ff" />
      
      {/* Header */}
      <LinearGradient colors={['#00c6ff', '#0072ff']} style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="robot" size={32} color="#ffffff" />
          <Text style={styles.headerTitle}>S.I.R.I.U.S.</Text>
          <View style={[styles.connectionIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }]} />
        </View>
        <Text style={styles.statusText}>{message}</Text>
      </LinearGradient>

      {/* Context Display */}
      {context && (
        <View style={styles.contextContainer}>
          <Text style={styles.contextTitle}>Current Context</Text>
          <Text style={styles.contextText}>
            Focus: {context.focus} | Energy: {context.energy} | Urgency: {context.urgency}
          </Text>
        </View>
      )}

      {/* Conversations */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.conversationsContainer}
        contentContainerStyle={styles.conversationsContent}
      >
        {conversations.map(renderConversationItem)}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => triggerAction('daily_digest')}
        >
          <MaterialIcons name="today" size={24} color="#ffffff" />
          <Text style={styles.actionText}>Daily Digest</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => triggerAction('context_analysis')}
        >
          <MaterialIcons name="psychology" size={24} color="#ffffff" />
          <Text style={styles.actionText}>Analyze Context</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={fetchContext}
        >
          <MaterialIcons name="refresh" size={24} color="#ffffff" />
          <Text style={styles.actionText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          multiline
          onSubmitEditing={sendMessage}
        />
        
        <TouchableOpacity 
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          disabled={isListening}
        >
          <MaterialIcons 
            name={isListening ? "stop" : "mic"} 
            size={24} 
            color="#ffffff" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <MaterialIcons name="send" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
    flex: 1,
  },
  connectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
  },
  contextContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  contextText: {
    fontSize: 14,
    color: '#666',
  },
  conversationsContainer: {
    flex: 1,
    marginTop: 10,
  },
  conversationsContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  conversationItem: {
    marginBottom: 15,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  siriusMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#00c6ff',
  },
  siriusBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  siriusText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  voiceButton: {
    backgroundColor: '#ff6b6b',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  voiceButtonActive: {
    backgroundColor: '#f44336',
  },
  sendButton: {
    backgroundColor: '#00c6ff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App; 