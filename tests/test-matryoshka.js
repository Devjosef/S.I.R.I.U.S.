/**
 * Test Matryoshka Quantization
 * 
 * Tests the Matryoshka Quantization utility for optimizing Ollama models.
 */

import matryoshkaQuantization from '../src/utils/matryoshkaQuantization.js';
import ollamaService from '../src/services/ollamaService.js';
import config from '../src/config/index.js';
import logger from '../src/utils/logger.js';
import readline from 'readline';

async function testMatryoshkaQuantization() {
  console.log('\n🧪 TESTING MATRYOSHKA QUANTIZATION\n');
  console.log(`Environment: ${config.ENV.PRODUCTION ? 'production' : config.ENV.TEST ? 'test' : 'development'}`);
  console.log(`Device type: ${config.DEVICE.IS_MOBILE ? 'Mobile' : 'Desktop'}`);
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
    
    // 2. Get optimal quantization level
    console.log('\n2️⃣ Getting optimal quantization level for this device...');
    const optimalLevel = matryoshkaQuantization.getOptimalQuantizationLevel();
    console.log(`✅ Recommended quantization level: ${optimalLevel.type} (${optimalLevel.bits}-bit)`);
    console.log(`   Device profile: ${optimalLevel.deviceProfile}`);
    console.log(`   Memory requirement: ${optimalLevel.memoryRequirement}`);
    console.log(`   Performance impact: ${optimalLevel.performanceImpact}`);
    
    // 3. List available models
    console.log('\n3️⃣ Listing available models...');
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
    
    // 4. Check if any models already have Matryoshka quantization
    console.log('\n4️⃣ Checking for existing Matryoshka-quantized models...');
    let hasMatryoshkaModels = false;
    
    for (const model of models) {
      const hasMatryoshka = await matryoshkaQuantization.hasMatryoshkaQuantization(model.name);
      if (hasMatryoshka) {
        console.log(`✅ Model ${model.name} already has Matryoshka quantization`);
        
        // List quantization levels
        const levels = await matryoshkaQuantization.listQuantizationLevels(model.name);
        console.log(`   Quantization levels (${levels.length}):`);
        levels.forEach(level => {
          console.log(`   - ${level.type}${level.isPrimary ? ' (primary)' : ''} ${level.threshold ? `Threshold: ${level.threshold}` : ''}`);
        });
        
        hasMatryoshkaModels = true;
      }
    }
    
    if (!hasMatryoshkaModels) {
      console.log('ℹ️ No models with Matryoshka quantization found');
    }
    
    // 5. Ask if user wants to create a Matryoshka-quantized model
    console.log('\n5️⃣ Would you like to create a Matryoshka-quantized model?');
    console.log('   This will create a new model with nested quantization levels.');
    console.log('   The process can take several minutes depending on the model size.');
    console.log('   (Type "yes" to continue or any other key to skip)');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('> ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        // Select a base model
        console.log('\nSelect a base model by number:');
        models.forEach((model, index) => {
          console.log(`${index + 1}. ${model.name}`);
        });
        
        rl.question('> ', async (modelIndex) => {
          const index = parseInt(modelIndex) - 1;
          if (isNaN(index) || index < 0 || index >= models.length) {
            console.log('❌ Invalid selection');
            rl.close();
            return;
          }
          
          const baseModel = models[index].name;
          const targetModel = `${baseModel}-matryoshka`;
          
          console.log(`\nCreating Matryoshka-quantized model: ${targetModel}`);
          console.log('This may take several minutes...');
          
          try {
            const result = await matryoshkaQuantization.createMatryoshkaModel(baseModel, targetModel, {
              quantizationLevel: optimalLevel,
              nestedLevels: true
            });
            
            console.log(`✅ Successfully created Matryoshka-quantized model: ${result.modelName}`);
            console.log(`   Primary quantization level: ${result.quantizationLevel}`);
            
            // Test the model
            console.log('\nTesting the new model...');
            const response = await ollamaService.generateResponse('Hello, how are you?', {
              model: targetModel,
              maxTokens: 50
            });
            
            console.log(`\nTest response: "${response}"`);
            console.log('\n✅ Matryoshka quantization test completed successfully');
          } catch (error) {
            console.error('❌ Error creating Matryoshka-quantized model:', error.message);
          } finally {
            rl.close();
          }
        });
      } else {
        console.log('\nSkipping model creation.');
        console.log('\n✅ Matryoshka quantization test completed');
        rl.close();
      }
    });
  } catch (error) {
    console.error('❌ Error during Matryoshka quantization test:', error);
  }
}

// Run the test
testMatryoshkaQuantization(); 