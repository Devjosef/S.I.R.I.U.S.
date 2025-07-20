/**
 * Test Runtime Matryoshka Quantization
 * 
 * Tests the runtime Matryoshka Quantization for Ollama models
 * without creating new models.
 */

import ollamaService from '../src/services/ollamaService.js';
import config from '../src/config/index.js';
import logger from '../src/utils/logger.js';
import os from 'os';

async function testRuntimeMatryoshka() {
  console.log('\n🧪 TESTING RUNTIME MATRYOSHKA QUANTIZATION\n');
  console.log(`Environment: ${config.ENV.PRODUCTION ? 'production' : config.ENV.TEST ? 'test' : 'development'}`);
  console.log(`Device type: ${config.DEVICE.IS_MOBILE ? 'Mobile' : 'Desktop'}`);
  console.log(`Memory: ${config.DEVICE.MEMORY_LIMIT} MB`);
  console.log(`CPU cores: ${config.DEVICE.CPU_CORES}`);
  console.log('-------------------------------------------');
  
  try {
    // 1. Check if Ollama is available
    console.log('\n1️⃣ Checking Ollama status...');
    const isAvailable = await ollamaService.checkOllamaStatus();
    
    if (!isAvailable) {
      console.log('❌ Ollama is not running');
      console.log('💡 Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh');
      console.log('💡 Start Ollama: ollama serve');
      console.log('💡 Download model: ollama pull llama3.1:8b');
      return;
    }
    
    console.log('✅ Ollama is running!');
    
    // 2. List available models
    console.log('\n2️⃣ Listing available models...');
    const models = await ollamaService.listModels();
    if (models.length === 0) {
      console.log('❌ No models found');
      console.log('💡 Download a model: ollama pull llama3.1:8b');
      return;
    }
    
    console.log('✅ Available models:');
    models.forEach(model => {
      console.log(`   - ${model.name} (${Math.round(model.size / (1024 * 1024))} MB)`);
    });
    
    // 3. Test with default settings (high-end device)
    console.log('\n3️⃣ Testing with default settings (high-end device)...');
    console.time('High-end device response time');
    const highEndResponse = await ollamaService.generateResponse('Hello, how are you?', {
      model: models[0].name,
      maxTokens: 50
    });
    console.timeEnd('High-end device response time');
    console.log(`Response: "${highEndResponse}"`);
    
    // 4. Test with mid-range device settings
    console.log('\n4️⃣ Testing with mid-range device settings...');
    // Temporarily modify config
    const originalMemory = config.DEVICE.MEMORY_LIMIT;
    config.DEVICE.MEMORY_LIMIT = 6144; // 6GB
    
    console.time('Mid-range device response time');
    const midRangeResponse = await ollamaService.generateResponse('What is your favorite color?', {
      model: models[0].name,
      maxTokens: 50
    });
    console.timeEnd('Mid-range device response time');
    console.log(`Response: "${midRangeResponse}"`);
    
    // 5. Test with mobile device settings
    console.log('\n5️⃣ Testing with mobile device settings...');
    // Modify config for mobile
    config.DEVICE.MEMORY_LIMIT = 2048; // 2GB
    config.DEVICE.IS_MOBILE = true;
    config.DEVICE.CPU_CORES = 4;
    
    console.time('Mobile device response time');
    const mobileResponse = await ollamaService.generateResponse('Tell me a short joke.', {
      model: models[0].name,
      maxTokens: 50
    });
    console.timeEnd('Mobile device response time');
    console.log(`Response: "${mobileResponse}"`);
    
    // Restore original config
    config.DEVICE.MEMORY_LIMIT = originalMemory;
    config.DEVICE.IS_MOBILE = false;
    config.DEVICE.CPU_CORES = os.cpus().length;
    
    console.log('\n✅ Runtime Matryoshka Quantization test completed successfully');
  } catch (error) {
    console.error('❌ Error during Runtime Matryoshka Quantization test:', error);
  }
}

// Run the test
testRuntimeMatryoshka(); 