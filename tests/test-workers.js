/**
 * Worker Threads Test
 * 
 * Tests the worker thread functionality for CPU-intensive tasks.
 */

import workerManager from '../src/utils/workerManager.js';
import config from '../src/config/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test CPU-intensive task
const fibonacciTest = async (n) => {
  console.log(`\n🧮 Testing Fibonacci calculation (n=${n})`);
  
  // Calculate Fibonacci in the main thread
  console.time('Main thread');
  const mainResult = fibonacci(n);
  console.timeEnd('Main thread');
  console.log(`Main thread result: ${mainResult}`);
  
  // Calculate Fibonacci in a worker thread
  console.time('Worker thread');
  try {
    const workerResult = await workerManager.runInWorker(
      'fibonacci',
      { n },
      // Fallback function if worker fails
      (data) => fibonacci(data.n)
    );
    console.timeEnd('Worker thread');
    console.log(`Worker thread result: ${workerResult}`);
    
    // Verify results match
    console.log(`Results match: ${mainResult === workerResult}`);
  } catch (error) {
    console.timeEnd('Worker thread');
    console.error('Worker error:', error);
  }
};

// CPU-intensive recursive Fibonacci calculation (intentionally inefficient)
const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

// Test multiple concurrent workers
const concurrencyTest = async (count) => {
  console.log(`\n🔄 Testing ${count} concurrent worker tasks`);
  
  const tasks = [];
  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    const task = workerManager.runInWorker(
      'fibonacci',
      { n: 30 + (i % 5) }, // Vary the workload slightly
      // Fallback function if worker fails
      (data) => fibonacci(data.n)
    );
    tasks.push(task);
  }
  
  try {
    const results = await Promise.all(tasks);
    const endTime = Date.now();
    console.log(`✅ All ${count} tasks completed in ${endTime - startTime}ms`);
    console.log(`Average time per task: ${((endTime - startTime) / count).toFixed(2)}ms`);
  } catch (error) {
    console.error('Concurrency test error:', error);
  }
};

// Test worker manager status
const statusTest = () => {
  console.log('\n📊 Worker Manager Status');
  console.log(`Enabled: ${workerManager.areWorkersAvailable()}`);
  console.log(`Stats:`, workerManager.getWorkerStats());
};

// Main test function
const runTests = async () => {
  console.log('\n🧪 TESTING WORKER THREADS\n');
  console.log(`Environment: ${config.ENV.PRODUCTION ? 'production' : config.ENV.TEST ? 'test' : 'development'}`);
  console.log(`Platform: ${config.ENV.REPLIT ? 'Replit' : 'Local'}`);
  console.log(`CPU cores: ${os.cpus().length}`);
  console.log(`Memory: ${Math.round(os.totalmem() / (1024 * 1024))} MB`);
  console.log(`Worker threads enabled: ${config.WORKERS.ENABLED}`);
  console.log(`Max worker threads: ${config.WORKERS.MAX_THREADS}`);
  console.log('-------------------------------------------');
  
  // Run status test
  statusTest();
  
  // Run Fibonacci calculation test
  await fibonacciTest(35);
  
  // Run concurrency test with different numbers of tasks
  await concurrencyTest(5);
  
  // Run status test again to see changes
  statusTest();
  
  console.log('\n✅ Worker thread tests completed');
};

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
}); 