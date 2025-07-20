/**
 * Circadian Rhythm Pattern Testing
 * 
 * Test different circadian rhythm patterns (morning person, evening person, night owl)
 */

import { createLogger } from '../src/utils/logger.js';
import memoryService from '../src/services/memoryService.js';
import { generatePersonalizedRecommendations } from '../src/services/predictionService.js';

const logger = createLogger('circadian-test');

/**
 * Generate morning person test data
 */
const generateMorningPersonData = () => {
  return [
    // Early morning (6-8 AM) - Peak performance
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'morning',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T06:30:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'meeting_prep',
      timeBlock: 'morning',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T07:15:00Z').toISOString()
    },
    {
      type: 'jira_operation',
      operation: 'update_issue',
      timeBlock: 'morning',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T08:00:00Z').toISOString()
    },
    
    // Late morning (9-11 AM) - Still good
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'morning',
      focus: 'collaboration',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T09:30:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'email_processing',
      timeBlock: 'morning',
      focus: 'collaboration',
      energy: 'medium',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T10:45:00Z').toISOString()
    },
    
    // Afternoon (12-5 PM) - Declining performance
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'afternoon',
      focus: 'collaboration',
      energy: 'medium',
      urgency: 'high',
      success: false,
      timestamp: new Date('2024-01-20T14:00:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'meeting_prep',
      timeBlock: 'afternoon',
      focus: 'collaboration',
      energy: 'medium',
      urgency: 'high',
      success: true,
      timestamp: new Date('2024-01-20T15:30:00Z').toISOString()
    },
    
    // Evening (6-9 PM) - Low performance
    {
      type: 'jira_operation',
      operation: 'update_issue',
      timeBlock: 'evening',
      focus: 'review',
      energy: 'low',
      urgency: 'low',
      success: false,
      timestamp: new Date('2024-01-20T18:00:00Z').toISOString()
    }
  ];
};

/**
 * Generate evening person test data
 */
const generateEveningPersonData = () => {
  return [
    // Morning (6-11 AM) - Low performance
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'morning',
      focus: 'collaboration',
      energy: 'low',
      urgency: 'normal',
      success: false,
      timestamp: new Date('2024-01-20T08:00:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'email_processing',
      timeBlock: 'morning',
      focus: 'collaboration',
      energy: 'low',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T10:00:00Z').toISOString()
    },
    
    // Afternoon (12-5 PM) - Improving
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'afternoon',
      focus: 'collaboration',
      energy: 'medium',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T14:00:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'meeting_prep',
      timeBlock: 'afternoon',
      focus: 'collaboration',
      energy: 'medium',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T15:30:00Z').toISOString()
    },
    
    // Evening (6-9 PM) - Peak performance
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'evening',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T18:00:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'email_processing',
      timeBlock: 'evening',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T19:30:00Z').toISOString()
    },
    {
      type: 'jira_operation',
      operation: 'update_issue',
      timeBlock: 'evening',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T20:15:00Z').toISOString()
    },
    
    // Night (10 PM+) - Still good
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'evening',
      focus: 'review',
      energy: 'medium',
      urgency: 'low',
      success: true,
      timestamp: new Date('2024-01-20T22:00:00Z').toISOString()
    }
  ];
};

/**
 * Generate night owl test data
 */
const generateNightOwlData = () => {
  return [
    // Morning (6-11 AM) - Very low performance
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'morning',
      focus: 'collaboration',
      energy: 'low',
      urgency: 'normal',
      success: false,
      timestamp: new Date('2024-01-20T09:00:00Z').toISOString()
    },
    
    // Afternoon (12-5 PM) - Low performance
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'afternoon',
      focus: 'collaboration',
      energy: 'low',
      urgency: 'normal',
      success: false,
      timestamp: new Date('2024-01-20T14:00:00Z').toISOString()
    },
    
    // Evening (6-9 PM) - Improving
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'evening',
      focus: 'collaboration',
      energy: 'medium',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T19:00:00Z').toISOString()
    },
    
    // Night (10 PM+) - Peak performance
    {
      type: 'jira_operation',
      operation: 'create_issue',
      timeBlock: 'evening',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T22:00:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'email_processing',
      timeBlock: 'evening',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-20T23:30:00Z').toISOString()
    },
    {
      type: 'jira_operation',
      operation: 'update_issue',
      timeBlock: 'evening',
      focus: 'deep-work',
      energy: 'high',
      urgency: 'normal',
      success: true,
      timestamp: new Date('2024-01-21T01:00:00Z').toISOString()
    },
    {
      type: 'autonomous_action',
      actionType: 'meeting_prep',
      timeBlock: 'evening',
      focus: 'review',
      energy: 'medium',
      urgency: 'low',
      success: true,
      timestamp: new Date('2024-01-21T02:30:00Z').toISOString()
    }
  ];
};

/**
 * Test circadian rhythm patterns
 */
const testCircadianPatterns = async () => {
  logger.info('🌅 Starting Circadian Rhythm Pattern Tests');
  
  const testResults = {};
  
  // Test 1: Morning Person
  logger.info('🌅 Test 1: Morning Person Pattern');
  const morningPersonId = 'morning-person-test';
  const morningData = generateMorningPersonData();
  
  for (const interaction of morningData) {
    await memoryService.learnFromInteraction(morningPersonId, interaction);
  }
  
  const morningMemory = await memoryService.loadMemory(morningPersonId);
  const morningCircadian = morningMemory.patterns.timeBlocks?.circadianRhythm;
  
  testResults.morningPerson = {
    expected: 'morning_person',
    actual: morningCircadian?.type,
    confidence: morningCircadian?.confidence,
    peakHours: morningCircadian?.peakHours,
    success: morningCircadian?.type === 'morning_person'
  };
  
  logger.info('Morning person results:', testResults.morningPerson);
  
  // Test 2: Evening Person
  logger.info('🌅 Test 2: Evening Person Pattern');
  const eveningPersonId = 'evening-person-test';
  const eveningData = generateEveningPersonData();
  
  for (const interaction of eveningData) {
    await memoryService.learnFromInteraction(eveningPersonId, interaction);
  }
  
  const eveningMemory = await memoryService.loadMemory(eveningPersonId);
  const eveningCircadian = eveningMemory.patterns.timeBlocks?.circadianRhythm;
  
  testResults.eveningPerson = {
    expected: 'evening_person',
    actual: eveningCircadian?.type,
    confidence: eveningCircadian?.confidence,
    peakHours: eveningCircadian?.peakHours,
    success: eveningCircadian?.type === 'evening_person'
  };
  
  logger.info('Evening person results:', testResults.eveningPerson);
  
  // Test 3: Night Owl
  logger.info('🌅 Test 3: Night Owl Pattern');
  const nightOwlId = 'night-owl-test';
  const nightOwlData = generateNightOwlData();
  
  for (const interaction of nightOwlData) {
    await memoryService.learnFromInteraction(nightOwlId, interaction);
  }
  
  const nightOwlMemory = await memoryService.loadMemory(nightOwlId);
  const nightOwlCircadian = nightOwlMemory.patterns.timeBlocks?.circadianRhythm;
  
  testResults.nightOwl = {
    expected: 'night_owl',
    actual: nightOwlCircadian?.type,
    confidence: nightOwlCircadian?.confidence,
    peakHours: nightOwlCircadian?.peakHours,
    success: nightOwlCircadian?.type === 'night_owl'
  };
  
  logger.info('Night owl results:', testResults.nightOwl);
  
  // Test recommendations for each type
  logger.info('💡 Testing circadian-specific recommendations...');
  
  const morningRecommendations = await generatePersonalizedRecommendations(morningPersonId, {
    timeBlock: 'morning',
    focus: 'deep-work',
    energy: 'high',
    urgency: 'normal',
    actionType: 'jira_operation'
  });
  
  const eveningRecommendations = await generatePersonalizedRecommendations(eveningPersonId, {
    timeBlock: 'evening',
    focus: 'deep-work',
    energy: 'high',
    urgency: 'normal',
    actionType: 'jira_operation'
  });
  
  const nightOwlRecommendations = await generatePersonalizedRecommendations(nightOwlId, {
    timeBlock: 'evening',
    focus: 'deep-work',
    energy: 'high',
    urgency: 'normal',
    actionType: 'jira_operation'
  });
  
  testResults.recommendations = {
    morningPerson: morningRecommendations.recommendations.length,
    eveningPerson: eveningRecommendations.recommendations.length,
    nightOwl: nightOwlRecommendations.recommendations.length
  };
  
  logger.info('Recommendation counts:', testResults.recommendations);
  
  // Summary
  const allPassed = testResults.morningPerson.success && 
                   testResults.eveningPerson.success && 
                   testResults.nightOwl.success;
  
  logger.info('📊 Circadian Pattern Test Summary:', {
    morningPerson: testResults.morningPerson.success ? '✅ PASS' : '❌ FAIL',
    eveningPerson: testResults.eveningPerson.success ? '✅ PASS' : '❌ FAIL',
    nightOwl: testResults.nightOwl.success ? '✅ PASS' : '❌ FAIL',
    overall: allPassed ? '🎉 ALL PASSED' : '❌ SOME FAILED'
  });
  
  return {
    success: allPassed,
    results: testResults
  };
};

/**
 * Main test runner
 */
const runCircadianTests = async () => {
  logger.info('🚀 Starting S.I.R.I.U.S. Circadian Rhythm Testing Suite');
  
  const results = await testCircadianPatterns();
  
  if (results.success) {
    logger.info('🎉 All Circadian Rhythm Tests Passed! S.I.R.I.U.S. can accurately detect user circadian patterns.');
  } else {
    logger.error('❌ Some Circadian Rhythm Tests Failed. Check the logs for details.');
  }
  
  return results;
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCircadianTests()
    .then(results => {
      console.log('Circadian test execution completed:', results);
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Circadian test execution failed:', error);
      process.exit(1);
    });
}

export { runCircadianTests, testCircadianPatterns }; 