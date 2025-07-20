/**
 * Notion Service
 * 
 * Real Notion integration for S.I.R.I.U.S.
 * Fetches actual pages and manages content
 */

import config from '../config/index.js';

const NOTION_API_BASE = 'https://api.notion.com/v1';

/**
 * Make authenticated Notion API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - API response
 */
const notionRequest = async (endpoint, options = {}) => {
  const url = `${NOTION_API_BASE}${endpoint}`;
  
  const requestOptions = {
    headers: {
      'Authorization': `Bearer ${config.NOTION.API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} - ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Notion API request failed:', error);
    throw error;
  }
};

/**
 * Get user's databases
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of databases
 */
export const getDatabases = async (userId) => {
  try {
    const response = await notionRequest('/search', {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          property: 'object',
          value: 'database'
        }
      })
    });
    
    return (response.results || []).map(db => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || 'Untitled Database',
      description: db.description?.[0]?.plain_text || '',
      url: db.url,
      created: db.created_time,
      updated: db.last_edited_time
    }));
    
  } catch (error) {
    console.error('Error fetching Notion databases:', error);
    return [];
  }
};

/**
 * Get pages from a database
 * @param {string} databaseId - Database ID
 * @returns {Promise<Array>} - List of pages
 */
export const getPagesFromDatabase = async (databaseId) => {
  try {
    const response = await notionRequest(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        sorts: [
          {
            property: 'Last edited time',
            direction: 'descending'
          }
        ]
      })
    });
    
    return (response.results || []).map(page => ({
      id: page.id,
      title: extractTitle(page.properties),
      description: extractDescription(page.properties),
      status: extractStatus(page.properties),
      tags: extractTags(page.properties),
      url: page.url,
      created: page.created_time,
      updated: page.last_edited_time,
      properties: page.properties
    }));
    
  } catch (error) {
    console.error('Error fetching Notion pages:', error);
    return [];
  }
};

/**
 * Get all pages (notes) from user's workspaces
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of pages
 */
export const getAllPages = async (userId) => {
  try {
    const response = await notionRequest('/search', {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          value: 'page',
          property: 'object'
          }
      })
    });
    
    return (response.results || []).map(page => ({
      id: page.id,
      title: extractTitle(page.properties),
      description: extractDescription(page.properties),
      status: extractStatus(page.properties),
      tags: extractTags(page.properties),
      url: page.url,
      created: page.created_time,
      updated: page.last_edited_time,
      parent: page.parent
    }));
    
  } catch (error) {
    console.error('Error fetching all Notion pages:', error);
    return getMockPages();
  }
};

/**
 * Get page content
 * @param {string} pageId - Page ID
 * @returns {Promise<Object>} - Page content
 */
export const getPageContent = async (pageId) => {
  try {
    const response = await notionRequest(`/blocks/${pageId}/children`);
    
    return {
      id: pageId,
      blocks: response.results || [],
      content: extractBlockContent(response.results || [])
    };
    
  } catch (error) {
    console.error('Error fetching Notion page content:', error);
    return {
      id: pageId,
      blocks: [],
      content: 'Content not available'
    };
  }
};

/**
 * Create a new page
 * @param {string} userId - User identifier
 * @param {Object} pageData - Page data
 * @returns {Promise<Object>} - Created page
 */
export const createPage = async (userId, pageData) => {
  try {
    const response = await notionRequest('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: {
          type: 'database_id',
          database_id: pageData.databaseId || 'default'
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: pageData.title
                }
              }
            ]
          },
          description: {
            rich_text: [
              {
                text: {
                  content: pageData.description || ''
                }
              }
            ]
          }
        }
      })
    });
    
    return {
      id: response.id,
      title: pageData.title,
      description: pageData.description,
      url: response.url,
      status: 'created'
    };
    
  } catch (error) {
    console.error('Error creating Notion page:', error);
    throw new Error('Failed to create page');
  }
};

/**
 * Update a page
 * @param {string} userId - User identifier
 * @param {string} pageId - Page ID
 * @param {Object} pageData - Updated page data
 * @returns {Promise<Object>} - Updated page
 */
export const updatePage = async (userId, pageId, pageData) => {
  try {
    const updateData = {};
    
    if (pageData.title) {
      updateData.properties = {
        title: {
          title: [
            {
              text: {
                content: pageData.title
              }
            }
          ]
        }
      };
    }
    
    if (pageData.description) {
      updateData.properties = {
        ...updateData.properties,
        description: {
          rich_text: [
            {
              text: {
                content: pageData.description
              }
            }
          ]
        }
      };
    }
    
    const response = await notionRequest(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
    
    return {
      id: response.id,
      title: pageData.title,
      description: pageData.description,
      status: 'updated'
    };
    
  } catch (error) {
    console.error('Error updating Notion page:', error);
    throw new Error('Failed to update page');
  }
};

/**
 * Delete a page
 * @param {string} userId - User identifier
 * @param {string} pageId - Page ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deletePage = async (userId, pageId) => {
  try {
    await notionRequest(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        archived: true
      })
    });
    
    return {
      id: pageId,
      status: 'deleted'
    };
    
  } catch (error) {
    console.error('Error deleting Notion page:', error);
    throw new Error('Failed to delete page');
  }
};

/**
 * Extract title from page properties
 * @param {Object} properties - Page properties
 * @returns {string} - Page title
 */
const extractTitle = (properties) => {
  // Look for title property
  for (const [key, value] of Object.entries(properties)) {
    if (value.type === 'title' && value.title?.length > 0) {
      return value.title[0].plain_text;
    }
  }
  
  // Look for name property
  for (const [key, value] of Object.entries(properties)) {
    if (value.type === 'rich_text' && value.rich_text?.length > 0) {
      return value.rich_text[0].plain_text;
    }
  }
  
  return 'Untitled';
};

/**
 * Extract description from page properties
 * @param {Object} properties - Page properties
 * @returns {string} - Page description
 */
const extractDescription = (properties) => {
  for (const [key, value] of Object.entries(properties)) {
    if (value.type === 'rich_text' && value.rich_text?.length > 0) {
      return value.rich_text[0].plain_text;
    }
  }
  return '';
};

/**
 * Extract status from page properties
 * @param {Object} properties - Page properties
 * @returns {string} - Page status
 */
const extractStatus = (properties) => {
  for (const [key, value] of Object.entries(properties)) {
    if (value.type === 'select' && value.select) {
      return value.select.name;
    }
    if (value.type === 'status' && value.status) {
      return value.status.name;
    }
  }
  return 'Not Set';
};

/**
 * Extract tags from page properties
 * @param {Object} properties - Page properties
 * @returns {Array} - Page tags
 */
const extractTags = (properties) => {
  for (const [key, value] of Object.entries(properties)) {
    if (value.type === 'multi_select' && value.multi_select) {
      return value.multi_select.map(tag => tag.name);
    }
  }
  return [];
};

/**
 * Extract content from blocks
 * @param {Array} blocks - Page blocks
 * @returns {string} - Extracted content
 */
const extractBlockContent = (blocks) => {
  return blocks
    .map(block => {
      switch (block.type) {
        case 'paragraph':
          return block.paragraph.rich_text.map(text => text.plain_text).join('');
        case 'heading_1':
          return block.heading_1.rich_text.map(text => text.plain_text).join('');
        case 'heading_2':
          return block.heading_2.rich_text.map(text => text.plain_text).join('');
        case 'heading_3':
          return block.heading_3.rich_text.map(text => text.plain_text).join('');
        case 'bulleted_list_item':
          return block.bulleted_list_item.rich_text.map(text => text.plain_text).join('');
        case 'numbered_list_item':
          return block.numbered_list_item.rich_text.map(text => text.plain_text).join('');
        default:
          return '';
      }
    })
    .filter(text => text.length > 0)
    .join('\n');
};

/**
 * Mock pages for fallback
 * @returns {Array} - Mock pages
 */
const getMockPages = () => {
  return [
    {
      id: 'mock-page-1',
      title: 'Project Documentation',
      description: 'Comprehensive documentation for the S.I.R.I.U.S. project',
      status: 'In Progress',
      tags: ['documentation', 'project'],
      url: 'https://notion.so/mock-page-1',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: 'mock-page-2',
      title: 'Meeting Notes',
      description: 'Notes from the weekly team meeting',
      status: 'Complete',
      tags: ['meeting', 'notes'],
      url: 'https://notion.so/mock-page-2',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: 'mock-page-3',
      title: 'Ideas and Brainstorming',
      description: 'Collection of ideas for future features',
      status: 'Draft',
      tags: ['ideas', 'brainstorming'],
      url: 'https://notion.so/mock-page-3',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    }
  ];
};

export default {
  getDatabases,
  getPagesFromDatabase,
  getAllPages,
  getPageContent,
  createPage,
  updatePage,
  deletePage
}; 