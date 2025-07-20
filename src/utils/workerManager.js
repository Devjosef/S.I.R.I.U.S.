/**
 * Worker Manager - Thread Pool Management
 * 
 * Manages worker threads for CPU-intensive tasks, provides fallback
 * mechanisms, and handles thread lifecycle.
 * 
 * Lines: 280
 * Documentation: docs/WORKERS_AND_BACKGROUND.md
 */

// Node.js worker threads and utilities
import { Worker } from 'worker_threads';
import { join } from 'path';

// Internal configuration and utilities
import config from '../config/index.js';
import { LRUCache } from 'lru-cache';
import { createLogger } from './logger.js';

// Create component-specific logger
const logger = createLogger('worker-manager');

// Worker thread pool to reuse workers
const workerPools = new Map();

// Cache for fallback functions when workers are disabled
const fallbackCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5 // 5 minutes
});

/**
 * Check if worker threads are supported and enabled
 * @returns {boolean} - Whether worker threads can be used
 */
export const areWorkersAvailable = () => {
  try {
    // Check if workers are enabled in config
    if (!config.WORKERS.ENABLED) {
      logger.debug('Worker threads disabled in configuration');
      return false;
    }
    
    // Check if running in a browser environment (not supported)
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      logger.debug('Worker threads not available in browser environment');
      return false;
    }
    
    // Check if Worker is available
    if (typeof Worker === 'undefined') {
      logger.debug('Worker threads not available in this Node.js environment');
      return false;
    }
    
    return true;
  } catch (error) {
    logger.warn({ err: error }, 'Worker threads not available');
    return false;
  }
};

/**
 * Get or create a worker from the pool
 * @param {string} workerType - Type of worker to get
 * @returns {Worker|null} - Worker instance or null if not available
 */
export const getWorker = (workerType) => {
  if (!areWorkersAvailable()) {
    return null;
  }
  
  // Get or create worker pool for this type
  if (!workerPools.has(workerType)) {
    const maxWorkers = Math.min(
      config.WORKERS.MAX_THREADS,
      config.DEVICE.IS_MOBILE ? 2 : 4 // Limit workers on mobile
    );
    
    logger.debug({ workerType, maxWorkers }, 'Creating worker pool');
    
    workerPools.set(workerType, {
      workers: [],
      maxWorkers,
      busyWorkers: 0
    });
  }
  
  const pool = workerPools.get(workerType);
  
  // Check if we have an available worker
  for (const worker of pool.workers) {
    if (!worker.busy) {
      worker.busy = true;
      pool.busyWorkers++;
      logger.debug({ workerId: worker.id }, 'Reusing existing worker');
      return worker.instance;
    }
  }
  
  // Create a new worker if we haven't reached the limit
  if (pool.workers.length < pool.maxWorkers) {
    try {
      const workerPath = join(config.WORKERS.DIR, `${workerType}Worker.js`);
      const workerId = `${workerType}-${pool.workers.length}`;
      
      logger.debug({ workerType, workerId }, 'Creating new worker');
      
      const worker = {
        instance: new Worker(workerPath),
        busy: true,
        id: workerId
      };
      
      pool.workers.push(worker);
      pool.busyWorkers++;
      return worker.instance;
    } catch (error) {
      logger.error({ err: error, workerType }, 'Failed to create worker');
      return null;
    }
  }
  
  // All workers are busy and we've reached the limit
  logger.warn({ workerType, poolSize: pool.workers.length }, 'All workers are busy');
  return null;
};

/**
 * Release a worker back to the pool
 * @param {Worker} workerInstance - Worker instance to release
 * @param {string} workerType - Type of worker
 */
export const releaseWorker = (workerInstance, workerType) => {
  if (!workerPools.has(workerType)) return;
  
  const pool = workerPools.get(workerType);
  for (const worker of pool.workers) {
    if (worker.instance === workerInstance) {
      worker.busy = false;
      pool.busyWorkers--;
      logger.debug({ workerId: worker.id }, 'Worker released back to pool');
      break;
    }
  }
};

/**
 * Run a task in a worker thread with timeout and fallback
 * @param {string} workerType - Type of worker to use
 * @param {Object} data - Data to pass to worker
 * @param {Function} fallbackFn - Function to use if worker is unavailable
 * @returns {Promise<any>} - Result of the worker or fallback
 */
export const runInWorker = async (workerType, data, fallbackFn) => {
  // If workers aren't available, use fallback immediately
  if (!areWorkersAvailable()) {
    logger.debug({ workerType }, 'Using fallback (workers disabled)');
    return fallbackFn(data);
  }
  
  // Try to get a worker from the pool
  const worker = getWorker(workerType);
  
  if (!worker) {
    logger.debug({ workerType }, 'Using fallback (no workers available)');
    return fallbackFn(data);
  }
  
  return new Promise((resolve, reject) => {
    // Set timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      logger.warn({ workerType, timeoutMs: config.WORKERS.TIMEOUT_MS }, 'Worker timed out');
      cleanupAndRelease();
      reject(new Error(`Worker ${workerType} operation timed out`));
    }, config.WORKERS.TIMEOUT_MS);
    
    // Clean up event listeners and release worker
    const cleanupAndRelease = () => {
      clearTimeout(timeoutId);
      worker.removeAllListeners('message');
      worker.removeAllListeners('error');
      worker.removeAllListeners('exit');
      releaseWorker(worker, workerType);
    };
    
    // Handle worker events
    worker.on('message', (result) => {
      cleanupAndRelease();
      
      if (result.error) {
        logger.warn({ workerType, error: result.error }, 'Worker returned error');
        // Try fallback on worker error
        resolve(fallbackFn(data));
      } else {
        logger.debug({ workerType }, 'Worker completed successfully');
        resolve(result.data);
      }
    });
    
    worker.on('error', (err) => {
      cleanupAndRelease();
      logger.error({ err, workerType }, 'Worker error');
      // Try fallback on worker error
      resolve(fallbackFn(data));
    });
    
    worker.on('exit', (code) => {
      if (code !== 0) {
        cleanupAndRelease();
        logger.error({ workerType, exitCode: code }, 'Worker exited abnormally');
        // Try fallback on abnormal exit
        resolve(fallbackFn(data));
      }
    });
    
    // Send data to worker
    worker.postMessage(data);
  });
};

/**
 * Register a fallback function for a worker type
 * @param {string} workerType - Type of worker
 * @param {Function} fallbackFn - Fallback function
 */
export const registerFallback = (workerType, fallbackFn) => {
  fallbackCache.set(workerType, fallbackFn);
  logger.debug({ workerType }, 'Registered fallback function');
};

/**
 * Get worker pool stats
 * @returns {Object} - Worker pool statistics
 */
export const getWorkerStats = () => {
  const stats = {
    enabled: config.WORKERS.ENABLED,
    available: areWorkersAvailable(),
    maxThreads: config.WORKERS.MAX_THREADS,
    pools: {}
  };
  
  for (const [type, pool] of workerPools.entries()) {
    stats.pools[type] = {
      total: pool.workers.length,
      busy: pool.busyWorkers,
      available: pool.workers.length - pool.busyWorkers
    };
  }
  
  logger.debug({ stats }, 'Worker pool statistics');
  
  return stats;
};

export default {
  runInWorker,
  registerFallback,
  areWorkersAvailable,
  getWorkerStats
}; 