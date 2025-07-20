/**
 * Debug test for circadian rhythm analysis
 */

import { createLogger } from '../src/utils/logger.js';
import memoryService from '../src/services/memoryService.js';

const logger = createLogger('circadian-debug');

const testCircadianDebug = async () => {
  logger.info('🔍 Starting Circadian Rhythm Debug Test');
  
  const userId = 'evening-person-test';
  
  try {
    logger.info('📥 Loading memory...');
    const startTime = Date.now();
    
    const memory = await memoryService.loadMemory(userId);
    const loadTime = Date.now() - startTime;
    
    logger.info(`✅ Memory loaded in ${loadTime}ms`);
    logger.info('Memory structure:', {
      hasPatterns: !!memory.patterns,
      hasTimeBlocks: !!memory.patterns?.timeBlocks,
      hasCircadian: !!memory.patterns?.timeBlocks?.circadianRhythm
    });
    
    if (memory.patterns?.timeBlocks?.circadianRhythm) {
      const circadian = memory.patterns.timeBlocks.circadianRhythm;
      logger.info('🌅 Circadian data found:', {
        type: circadian.type,
        confidence: circadian.confidence,
        peakHours: circadian.peakHours,
        periods: Object.keys(circadian.periods || {}),
        recommendationsCount: circadian.recommendations?.length
      });
    } else {
      logger.info('❌ No circadian rhythm data found');
      
      // Check what time blocks data exists
      if (memory.patterns?.timeBlocks) {
        logger.info('Time blocks data:', {
          optimalHour: memory.patterns.timeBlocks.optimalHour,
          optimalTimeBlock: memory.patterns.timeBlocks.optimalTimeBlock,
          hourDistribution: Object.keys(memory.patterns.timeBlocks.hourDistribution || {}),
          dayDistribution: Object.keys(memory.patterns.timeBlocks.dayDistribution || {})
        });
      }
    }
    
  } catch (error) {
    logger.error('❌ Error in debug test:', error);
  }
};

// Run the debug test
testCircadianDebug()
  .then(() => {
    console.log('Debug test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Debug test failed:', error);
    process.exit(1);
  }); 