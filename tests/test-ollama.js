/**
 * Test Ollama Integration
 * 
 * Tests Ollama integration for S.I.R.I.U.S. functionality
 */

import ollamaService from '../src/services/ollamaService.js';

async function testOllama() {
  console.log('🧪 Testing Ollama Integration for S.I.R.I.U.S.\n');
  
  try {
    // 1. Check if Ollama is available
    console.log('1️⃣ Checking Ollama status...');
    const isAvailable = await ollamaService.checkOllamaStatus();
    
    if (!isAvailable) {
      console.log('❌ Ollama is not running');
      console.log('💡 Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh');
      console.log('💡 Start Ollama: ollama serve');
      console.log('💡 Download model: ollama pull llama3.1:8b');
      return;
    }
    
    console.log('✅ Ollama is running!\n');
    
    // 2. List available models
    console.log('2️⃣ Checking available models...');
    const models = await ollamaService.listModels();
    console.log('📋 Available models:');
    models.forEach(model => {
      console.log(`   - ${model.name} (${model.size} bytes)`);
    });
    console.log();
    
    // 3. Test basic response generation
    console.log('3️⃣ Testing basic response generation...');
    const startTime = Date.now();
    const response = await ollamaService.generateResponse('Hello, how are you?', {
      model: ollamaService.MODELS.BALANCED,
      maxTokens: 50
    });
    const endTime = Date.now();
    
    console.log(`✅ Response generated in ${endTime - startTime}ms:`);
    console.log(`   "${response}"\n`);
    
    // 4. Test intent extraction
    console.log('4️⃣ Testing intent extraction...');
    const intent = await ollamaService.extractIntent("What's on my schedule today?");
    console.log('✅ Intent extracted:');
    console.log(`   Intent: ${intent.intent}`);
    console.log(`   Confidence: ${intent.confidence}`);
    console.log(`   Parameters:`, intent.parameters);
    console.log();
    
    // 5. Test daily digest summary
    console.log('5️⃣ Testing daily digest summary...');
    const mockData = {
      calendarEvents: [
        {
          summary: 'Team Standup',
          start: '2024-01-15T09:00:00Z'
        },
        {
          summary: 'Client Meeting',
          start: '2024-01-15T14:00:00Z'
        }
      ],
      todos: [
        {
          title: 'Complete API documentation',
          priority: 'high',
          dueDate: '2024-01-15T17:00:00Z'
        }
      ],
      emails: [
        {
          subject: 'Project Update',
          sender: 'manager@company.com',
          priority: 'high'
        }
      ]
    };
    
    const summary = await ollamaService.generateIntelligentSummary(mockData);
    console.log('✅ Daily digest summary generated:');
    console.log(`   Overview: ${summary.overview}`);
    console.log(`   Priorities: ${summary.priorities.length} items`);
    console.log(`   Actions: ${summary.suggestedActions.length} suggestions\n`);
    
    // 6. Performance comparison
    console.log('6️⃣ Performance Analysis...');
    console.log('📊 Ollama Performance:');
    console.log('   ✅ No API costs');
    console.log('   ✅ No rate limits');
    console.log('   ✅ Privacy (local processing)');
    console.log('   ✅ Offline capability');
    console.log('   ✅ Customizable models');
    console.log('   ⚠️  Requires local resources');
    console.log('   ⚠️  Initial model download');
    
    console.log('\n🎉 Ollama integration test complete!');
    console.log('🚀 Ready to use with S.I.R.I.U.S.');
    
  } catch (error) {
    console.error('❌ Error testing Ollama:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure Ollama is installed and running');
    console.log('2. Check if models are downloaded: ollama list');
    console.log('3. Try downloading a model: ollama pull llama3.1:8b');
  }
}

testOllama(); 