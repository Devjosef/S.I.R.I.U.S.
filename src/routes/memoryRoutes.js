/**
 * Memory Routes
 * 
 * API endpoints for S.I.R.I.U.S.'s memory system
 * - Get user memory and preferences
 * - Learn from interactions
 * - Update preferences
 */

import { Router } from 'express';
import { MemoryService } from '../services/memoryService.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const memoryService = new MemoryService();
const logger = createLogger('memory-routes');

/**
 * Get user memory and preferences
 * GET /api/memory/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const memory = await memoryService.loadMemory(userId);
    
    res.json({
      success: true,
      data: {
        userId: memory.userId,
        preferences: memory.preferences,
        patterns: memory.patterns,
        learnedBehaviors: memory.learnedBehaviors,
        lastUpdated: memory.timestamp
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting user memory');
    res.status(500).json({
      success: false,
      error: 'Failed to get user memory',
      message: error.message
    });
  }
});

/**
 * Learn from an interaction
 * POST /api/memory/:userId/learn
 */
router.post('/:userId/learn', async (req, res) => {
  try {
    const { userId } = req.params;
    const { interaction } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!interaction || !interaction.type) {
      return res.status(400).json({
        success: false,
        error: 'Interaction object with type is required'
      });
    }

    const success = await memoryService.learnFromInteraction(userId, interaction);
    
    if (success) {
      res.json({
        success: true,
        message: 'Learned from interaction successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to learn from interaction'
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'Error learning from interaction');
    res.status(500).json({
      success: false,
      error: 'Failed to learn from interaction',
      message: error.message
    });
  }
});

/**
 * Update user preferences
 * PUT /api/memory/:userId/preferences
 */
router.put('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'Preferences object is required'
      });
    }

    const memory = await memoryService.loadMemory(userId);
    memory.preferences = { ...memory.preferences, ...preferences };
    
    const success = await memoryService.saveMemory(memory);
    
    if (success) {
      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: {
          preferences: memory.preferences
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'Error updating preferences');
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      message: error.message
    });
  }
});

/**
 * Remember a specific behavior
 * POST /api/memory/:userId/remember
 */
router.post('/:userId/remember', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, key, value } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!category || !key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Category, key, and value are required'
      });
    }

    const success = await memoryService.rememberBehavior(userId, category, key, value);
    
    if (success) {
      res.json({
        success: true,
        message: 'Behavior remembered successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to remember behavior'
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'Error remembering behavior');
    res.status(500).json({
      success: false,
      error: 'Failed to remember behavior',
      message: error.message
    });
  }
});

export default router; 