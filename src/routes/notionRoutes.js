/**
 * Notion Routes
 * 
 * Web endpoints for S.I.R.I.U.S.'s Notion integration -
 * fetching pages, databases, and content from Notion workspaces
 */

import { Router } from 'express';
import * as notionService from '../services/notionService.js';
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Get user's Notion databases
 * GET /api/notion/databases?userId=string
 */
router.get('/databases', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const databases = await notionService.getDatabases(userId);
    
    res.json({
      success: true,
      message: 'Databases retrieved successfully',
      data: {
        databases,
        count: databases.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching Notion databases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch databases',
      details: error.message
    });
  }
});

/**
 * Get pages from a specific database
 * GET /api/notion/databases/:databaseId/pages
 */
router.get('/databases/:databaseId/pages', async (req, res) => {
  try {
    const { databaseId } = req.params;
    
    if (!databaseId) {
      return res.status(400).json({
        success: false,
        error: 'databaseId is required'
      });
    }

    const pages = await notionService.getPagesFromDatabase(databaseId);
    
    res.json({
      success: true,
      message: 'Pages retrieved successfully',
      data: {
        pages,
        count: pages.length,
        databaseId
      }
    });
    
  } catch (error) {
    console.error('Error fetching Notion pages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pages',
      details: error.message
    });
  }
});

/**
 * Get all pages from user's Notion workspace
 * GET /api/notion/pages?userId=string
 */
router.get('/pages', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const pages = await notionService.getAllPages(userId);
    
    res.json({
      success: true,
      message: 'Pages retrieved successfully',
      data: {
        pages,
        count: pages.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching Notion pages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pages',
      details: error.message
    });
  }
});

/**
 * Get content of a specific page
 * GET /api/notion/pages/:pageId/content
 */
router.get('/pages/:pageId/content', async (req, res) => {
  try {
    const { pageId } = req.params;
    
    if (!pageId) {
      return res.status(400).json({
        success: false,
        error: 'pageId is required'
      });
    }

    const content = await notionService.getPageContent(pageId);
    
    res.json({
      success: true,
      message: 'Page content retrieved successfully',
      data: {
        pageId,
        content: content.content,
        blocks: content.blocks,
        contentLength: content.content.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching Notion page content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch page content',
      details: error.message
    });
  }
});

/**
 * Create a new page in a database
 * POST /api/notion/pages
 */
router.post('/pages', async (req, res) => {
  try {
    const { userId, pageData } = req.body;
    
    if (!userId || !pageData) {
      return res.status(400).json({
        success: false,
        error: 'userId and pageData are required'
      });
    }

    const newPage = await notionService.createPage(userId, pageData);
    
    res.json({
      success: true,
      message: 'Page created successfully',
      data: newPage
    });
    
  } catch (error) {
    console.error('Error creating Notion page:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create page',
      details: error.message
    });
  }
});

/**
 * Update an existing page
 * PATCH /api/notion/pages/:pageId
 */
router.patch('/pages/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { userId, pageData } = req.body;
    
    if (!userId || !pageData) {
      return res.status(400).json({
        success: false,
        error: 'userId and pageData are required'
      });
    }

    const updatedPage = await notionService.updatePage(userId, pageId, pageData);
    
    res.json({
      success: true,
      message: 'Page updated successfully',
      data: updatedPage
    });
    
  } catch (error) {
    console.error('Error updating Notion page:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update page',
      details: error.message
    });
  }
});

/**
 * Delete a page (archive it)
 * DELETE /api/notion/pages/:pageId
 */
router.delete('/pages/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const result = await notionService.deletePage(userId, pageId);
    
    res.json({
      success: true,
      message: 'Page deleted successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error deleting Notion page:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete page',
      details: error.message
    });
  }
});

/**
 * Test Notion connection
 * GET /api/notion/test
 */
router.get('/test', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Test both databases and pages
    const databases = await notionService.getDatabases(userId);
    const pages = await notionService.getAllPages(userId);
    
    res.json({
      success: true,
      message: 'Notion connection test successful',
      data: {
        connection: 'successful',
        databases: {
          count: databases.length,
          items: databases.slice(0, 3) // Show first 3
        },
        pages: {
          count: pages.length,
          items: pages.slice(0, 3) // Show first 3
        }
      }
    });
    
  } catch (error) {
    console.error('Error testing Notion connection:', error);
    res.status(500).json({
      success: false,
      error: 'Notion connection test failed',
      details: error.message
    });
  }
});

export default router; 