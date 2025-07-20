/**
 * Memory Service Test Script
 * 
 * Tests the memory service with Pino logging integration.
 */

import memoryService from '../src/services/memoryService.js';
import { UserMemory } from '../src/services/memoryService.js';
import logger from '../src/utils/logger.js';
import config from '../src/config/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test user ID
const TEST_USER_ID = 'test-memory-user';

// Memory file path
const memoryFilePath = path.join(__dirname, '../data/memory', `${TEST_USER_ID}.json`);

// Main test function
async function runTests() {
  console.log('\n🧠 TESTING MEMORY SERVICE\n');
  console.log(`Environment: ${config.ENV.PRODUCTION ? 'production' : config.ENV.TEST ? 'test' : 'development'}`);
  console.log(`Memory file: ${memoryFilePath}`);
  console.log('-------------------------------------------');

  // Clean up previous test data
  try {
    if (fs.existsSync(memoryFilePath)) {
      fs.unlinkSync(memoryFilePath);
      console.log('Cleaned up previous test data');
    }
  } catch (err) {
    console.error('Error cleaning up test data:', err);
  }

  // Test 1: Create new memory
  console.log('\n📝 Test 1: Create new memory');
  const memory = new UserMemory(TEST_USER_ID);
  const saveResult = await memoryService.storeMemory(memory);
  console.log(`Memory created and stored: ${saveResult}`);

  // Test 2: Load memory
  console.log('\n📖 Test 2: Load memory');
  const loadedMemory = await memoryService.loadMemory(TEST_USER_ID);
  console.log(`Memory loaded: ${loadedMemory.userId === TEST_USER_ID}`);
  console.log(`Default preferences loaded: ${Object.keys(loadedMemory.preferences).length > 0}`);

  // Test 3: Update preferences
  console.log('\n🔄 Test 3: Remember behavior');
  const behaviorResult = await memoryService.rememberBehavior(
    TEST_USER_ID,
    'taskPrioritization',
    'urgentFirst',
    true
  );
  console.log(`Behavior remembered: ${behaviorResult}`);

  // Test 4: Learn from interaction
  console.log('\n🧠 Test 4: Learn from interaction');
  const interaction = {
    type: 'task-completion',
    task: 'Test memory service',
    timeBlock: 'morning-focus',
    focus: 'deep-work',
    duration: 30,
    success: true
  };
  const learnResult = await memoryService.learnFromInteraction(TEST_USER_ID, interaction);
  console.log(`Learned from interaction: ${learnResult}`);

  // Test 5: Get preferences
  console.log('\n⚙️ Test 5: Get preferences');
  const preferences = await memoryService.getPreferences(TEST_USER_ID);
  console.log(`Preferences retrieved: ${preferences !== null}`);
  console.log(`Contains learned behaviors: ${preferences.learnedBehaviors.taskPrioritization.urgentFirst.value === true}`);
  console.log(`Contains interaction: ${preferences.patterns.interactions.length === 1}`);

  // Check memory file
  if (fs.existsSync(memoryFilePath)) {
    const stats = fs.statSync(memoryFilePath);
    console.log(`\n📄 Memory file created: ${memoryFilePath}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Read and display memory file
    const memoryContent = JSON.parse(fs.readFileSync(memoryFilePath, 'utf8'));
    console.log('\nMemory file content (partial):');
    console.log('- userId:', memoryContent.userId);
    console.log('- preferences:', Object.keys(memoryContent.preferences).join(', '));
    console.log('- interactions count:', memoryContent.patterns.interactions.length);
    console.log('- learned behaviors:', Object.keys(memoryContent.learnedBehaviors.taskPrioritization).join(', '));
  } else {
    console.log('\n❌ Memory file not found');
  }

  console.log('\n✅ Memory service test completed');
}

// Run the tests
runTests().catch(err => {
  console.error('Test error:', err);
}); 