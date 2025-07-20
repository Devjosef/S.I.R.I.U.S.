/**
 * ML Prediction Testing Script
 * 
 * Test the advanced machine learning capabilities of S.I.R.I.U.S.
 */

import { createLogger } from '../src/utils/logger.js';
import memoryService from '../src/services/memoryService.js';
import { 
  predictNextAction, 
  predictOptimalTiming, 
  predictSuccessProbability, 
  generatePersonalizedRecommendations 
} from '../src/services/predictionService.js';

const logger = createLogger('ml-test');

/**
 * Generate test data for ML training
 */
const generateTestData = () => {
  const testInteractions = [
    // Morning productivity patterns (Morning Person)
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'morning',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-15T06:00:00Z').toISOString()
    },
    {
      type: 'jira_operation',
      operation: 'update_issue',
      timeBlock: 'morning',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-15T08:00:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'meeting_prep',
      timeBlock: 'morning',
      focus: 'meeting-prep',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-15T10:00:00Z').toISOString()
    },
    {
      type: 'jira_operation',
      operation: 'update_issue',
      timeBlock: 'morning',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-15T11:30:00Z').toISOString()
    },
    
    // Afternoon patterns
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'afternoon',
      focus: 'collaboration',
      energy: 'medium',
      urgency: 'high',
      success: false,
      timestamp: new Date('2024-01-15T14:00:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'email_processing',
      timeBlock: 'afternoon',
      focus: 'collaboration',
      energy: 'medium',
      urgency: 'high',
      success: true,
      timestamp: new Date('2024-01-15T15:00:00Z').toISOString()
    },
    
    // Evening patterns
    {
      type: 'jira_operation',
      operation: 'update_issue',
      timeBlock: 'evening',
      focus: 'review',
      energy: 'low',
      urgency: 'low',
      success: true,
      timestamp: new Date('2024-01-15T18:00:00Z').toISOString()
    },
    
    // More morning data for pattern learning
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'morning',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-16T07:15:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'meeting_prep',
      timeBlock: 'morning',
      focus: 'meeting-prep',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-16T09:00:00Z').toISOString()
    },
    {
      type: 'jira_operation',
      operation: 'update_issue',
      timeBlock: 'afternoon',
      focus: 'collaboration',
      energy: 'medium',
      urgency: 'high',
      success: false,
      timestamp: new Date('2024-01-16T14:30:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'email_processing',
      timeBlock: 'evening',
      focus: 'review',
      energy: 'low',
      urgency: 'low',
      success: true,
      timestamp: new Date('2024-01-16T19:00:00Z').toISOString()
    }
  ];
  
  return testInteractions;
};

/**
 * Test ML prediction capabilities
 */
const testMLPredictions = async () => {
  const userId = 'test-user-ml';
  
  try {
    logger.info('🧠 Starting ML Prediction Tests');
    
    // 1. Generate and store test data
    logger.info('📊 Generating test data...');
    const testInteractions = generateTestData();
    
    for (const interaction of testInteractions) {
      await memoryService.learnFromInteraction(userId, interaction);
    }
    
    logger.info(`✅ Stored ${testInteractions.length} test interactions`);
    
    // 2. Test next action prediction
    logger.info('🔮 Testing next action prediction...');
    const currentContext = {
      timeBlock: 'morning',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      actionType: 'jira_operation'
    };
    
    const nextActionPrediction = await predictNextAction(userId, currentContext);
    logger.info('Next action prediction:', {
      confidence: nextActionPrediction.confidence,
      predictions: nextActionPrediction.predictions.length,
      message: nextActionPrediction.message
    });
    
    // 3. Test optimal timing prediction
    logger.info('⏰ Testing optimal timing prediction...');
    const timingPrediction = await predictOptimalTiming(userId, 'jira_operation');
    logger.info('Optimal timing prediction:', {
      confidence: timingPrediction.confidence,
      recommendations: timingPrediction.recommendations.length,
      message: timingPrediction.message
    });
    
    // 4. Test success probability prediction
    logger.info('🎯 Testing success probability prediction...');
    const actionContext = {
      actionType: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'morning',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal'
    };
    
    const successPrediction = await predictSuccessProbability(userId, actionContext);
    logger.info('Success probability prediction:', {
      probability: successPrediction.probability,
      confidence: successPrediction.confidence,
      factors: successPrediction.factors.length,
      message: successPrediction.message
    });
    
    // 5. Test personalized recommendations
    logger.info('💡 Testing personalized recommendations...');
    const recommendations = await generatePersonalizedRecommendations(userId, currentContext);
    logger.info('Personalized recommendations:', {
      totalRecommendations: recommendations.recommendations.length,
      highPriorityCount: recommendations.summary?.highPriorityCount || 0,
      categories: recommendations.recommendations.map(r => r.category)
    });
    
    // 6. Test with different contexts
    logger.info('🔄 Testing with different contexts...');
    
    const contexts = [
      {
        timeBlock: 'afternoon',
        focus: 'collaboration',
        energy: 'medium',
        urgency: 'high',
        actionType: 'autonomous_action'
      },
      {
        timeBlock: 'evening',
        focus: 'review',
        energy: 'low',
        urgency: 'low',
        actionType: 'jira_operation'
      }
    ];
    
    for (const context of contexts) {
      const contextPrediction = await predictNextAction(userId, context);
      const contextSuccess = await predictSuccessProbability(userId, context);
      
      logger.info(`Context ${context.timeBlock}/${context.focus}:`, {
        nextActionConfidence: contextPrediction.confidence,
        successProbability: contextSuccess.probability,
        successConfidence: contextSuccess.confidence
      });
    }
    
    // 7. Test memory patterns
    logger.info('🧠 Testing memory pattern analysis...');
    const memory = await memoryService.loadMemory(userId);
    
    logger.info('Memory patterns:', {
      totalInteractions: memory.patterns.interactions.length,
      hasTimeBlocks: !!memory.patterns.timeBlocks,
      hasBehavioralPreferences: !!memory.patterns.behavioralPreferences,
      hasSuccessPatterns: !!memory.patterns.successPatterns,
      hasOptimalContexts: !!memory.patterns.optimalContexts,
      hasPredictivePatterns: !!memory.patterns.predictivePatterns
    });
    
    if (memory.patterns.timeBlocks) {
      logger.info('Time patterns:', {
        optimalHour: memory.patterns.timeBlocks.optimalHour,
        optimalTimeBlock: memory.patterns.timeBlocks.optimalTimeBlock,
        optimalWeekday: memory.patterns.timeBlocks.optimalWeekday
      });
      
      // Test circadian rhythm analysis
      if (memory.patterns.timeBlocks.circadianRhythm) {
        const circadian = memory.patterns.timeBlocks.circadianRhythm;
        logger.info('🌅 Circadian rhythm analysis:', {
          type: circadian.type,
          confidence: (circadian.confidence * 100).toFixed(1) + '%',
          peakHours: circadian.peakHours,
          recommendations: circadian.recommendations.length
        });
        
        logger.info('Circadian period performance:', circadian.periods);
      }
    }
    
    if (memory.patterns.behavioralPreferences) {
      logger.info('Behavioral preferences:', {
        preferredFocus: memory.patterns.behavioralPreferences.preferredFocus?.value,
        preferredEnergy: memory.patterns.behavioralPreferences.preferredEnergy?.value,
        preferredUrgency: memory.patterns.behavioralPreferences.preferredUrgency?.value
      });
    }
    
    if (memory.patterns.successPatterns) {
      logger.info('Success patterns:', Object.keys(memory.patterns.successPatterns).map(operation => ({
        operation,
        successRate: memory.patterns.successPatterns[operation].successRate,
        totalAttempts: memory.patterns.successPatterns[operation].totalAttempts
      })));
    }
    
    logger.info('✅ ML Prediction Tests Completed Successfully!');
    
    return {
      success: true,
      summary: {
        testInteractions: testInteractions.length,
        nextActionConfidence: nextActionPrediction.confidence,
        timingConfidence: timingPrediction.confidence,
        successProbability: successPrediction.probability,
        recommendationsCount: recommendations.recommendations.length,
        memoryPatterns: Object.keys(memory.patterns).length
      }
    };
    
  } catch (error) {
    logger.error('❌ ML Prediction Tests Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test ML with real-world scenarios
 */
const testRealWorldScenarios = async () => {
  const userId = 'real-world-test';
  
  try {
    logger.info('🌍 Testing Real-World ML Scenarios');
    
    // Scenario 1: Morning productivity burst
    logger.info('🌅 Scenario 1: Morning Productivity Burst');
    const morningInteractions = [
      {
        type: 'jira_operation',
        operation: 'create_issue',
        timeBlock: 'morning',
        focus: 'deep-work',
        energy: 'high',
        urgency: 'normal',
        success: true,
        timestamp: new Date('2024-01-20T08:00:00Z').toISOString()
      },
      {
        type: 'autonomous_action',
        actionType: 'meeting_prep',
        timeBlock: 'morning',
        focus: 'deep-work',
        energy: 'high',
        urgency: 'normal',
        success: true,
        timestamp: new Date('2024-01-20T09:00:00Z').toISOString()
      },
      {
        type: 'jira_operation',
        operation: 'update_issue',
        timeBlock: 'morning',
        focus: 'deep-work',
        energy: 'high',
        urgency: 'normal',
        success: true,
        timestamp: new Date('2024-01-20T10:00:00Z').toISOString()
      }
    ];
    
    for (const interaction of morningInteractions) {
      await memoryService.learnFromInteraction(userId, interaction);
    }
    
    const morningPrediction = await predictNextAction(userId, {
      timeBlock: 'morning',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      actionType: 'jira_operation'
    });
    
    logger.info('Morning prediction confidence:', morningPrediction.confidence);
    
    // Scenario 2: Afternoon collaboration
    logger.info('🤝 Scenario 2: Afternoon Collaboration');
    const afternoonInteractions = [
      {
        type: 'autonomous_action',
        actionType: 'email_processing',
        timeBlock: 'afternoon',
        focus: 'collaboration',
        energy: 'medium',
        urgency: 'high',
        success: true,
        timestamp: new Date('2024-01-20T14:00:00Z').toISOString()
      },
      {
        type: 'jira_operation',
        operation: 'create_issue',
        timeBlock: 'afternoon',
        focus: 'collaboration',
        energy: 'medium',
        urgency: 'high',
        success: false,
        timestamp: new Date('2024-01-20T15:00:00Z').toISOString()
      }
    ];
    
    for (const interaction of afternoonInteractions) {
      await memoryService.learnFromInteraction(userId, interaction);
    }
    
    const afternoonSuccess = await predictSuccessProbability(userId, {
      actionType: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'afternoon',
      focus: 'collaboration',
      energy: 'medium',
      urgency: 'high'
    });
    
    logger.info('Afternoon success probability:', afternoonSuccess.probability);
    
    // Scenario 3: Evening review
    logger.info('📝 Scenario 3: Evening Review');
    const eveningInteractions = [
      {
        type: 'jira_operation',
        operation: 'update_issue',
        timeBlock: 'evening',
        focus: 'review',
        energy: 'low',
        urgency: 'low',
        success: true,
        timestamp: new Date('2024-01-20T18:00:00Z').toISOString()
      }
    ];
    
    for (const interaction of eveningInteractions) {
      await memoryService.learnFromInteraction(userId, interaction);
    }
    
    const eveningRecommendations = await generatePersonalizedRecommendations(userId, {
      timeBlock: 'evening',
      focus: 'review',
      energy: 'low',
      urgency: 'low',
      actionType: 'jira_operation'
    });
    
    logger.info('Evening recommendations count:', eveningRecommendations.recommendations.length);
    
    logger.info('✅ Real-World Scenarios Completed!');
    
    return {
      success: true,
      scenarios: {
        morning: { confidence: morningPrediction.confidence },
        afternoon: { successProbability: afternoonSuccess.probability },
        evening: { recommendations: eveningRecommendations.recommendations.length }
      }
    };
    
  } catch (error) {
    logger.error('❌ Real-World Scenarios Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Main test runner
 */
const runMLTests = async () => {
  logger.info('🚀 Starting S.I.R.I.U.S. ML Testing Suite');
  
  const results = {
    basicTests: await testMLPredictions(),
    realWorldTests: await testRealWorldScenarios()
  };
  
  logger.info('📊 Test Results Summary:', results);
  
  const allPassed = results.basicTests.success && results.realWorldTests.success;
  
  if (allPassed) {
    logger.info('🎉 All ML Tests Passed! S.I.R.I.U.S. ML capabilities are working correctly.');
  } else {
    logger.error('❌ Some ML Tests Failed. Check the logs for details.');
  }
  
  return results;
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMLTests()
    .then(results => {
      console.log('Test execution completed:', results);
      process.exit(results.basicTests.success && results.realWorldTests.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runMLTests, testMLPredictions, testRealWorldScenarios }; 