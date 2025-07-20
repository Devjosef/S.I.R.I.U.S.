/**
 * Google Workspace Service - Document and Drive Integration
 * 
 * Handles Google Docs, Sheets, and Drive integration for
 * document management and collaboration.
 * 
 * Lines: 600
 */

import { google } from 'googleapis';
import config from '../config/index.js';

// Initialize Google APIs
const docs = google.docs('v1');
const sheets = google.sheets('v4');
const drive = google.drive('v3');

/**
 * Get Google API client
 * @returns {Object} - Authenticated Google client
 */
const getGoogleClient = () => {
  // Use API key for read-only access
  return {
    key: config.GOOGLE.API_KEY
  };
};

/**
 * Make authenticated Google API request
 * @param {string} service - Service name (docs, sheets, drive)
 * @param {string} method - API method
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} - API response
 */
const googleRequest = async (service, method, params = {}) => {
  try {
    const client = getGoogleClient();
    const api = google[service]('v1');
    
    const response = await api[method]({
      key: client.key,
      ...params
    });
    
    return response.data;
  } catch (error) {
    console.error(`Google ${service} API request failed:`, error);
    throw error;
  }
};

/**
 * Get Google Drive files
 * @param {string} userId - User identifier
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} - List of files
 */
export const getDriveFiles = async (userId, filters = {}) => {
  try {
    // Import the OAuth client
    const { getOAuthClient } = await import('../routes/oauthRoutes.js');
    const oauth2Client = getOAuthClient(userId);
    
    if (!oauth2Client) {
      console.log('No OAuth client found, using mock data');
      return getMockDriveFiles();
    }
    
    const query = filters.query || '';
    const pageSize = filters.pageSize || 20;
    
    const response = await drive.files.list({
      auth: oauth2Client,
      pageSize,
      q: query,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime,size,parents,webViewLink,webContentLink)',
      orderBy: 'modifiedTime desc'
    });
    
    return (response.data.files || []).map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      created: file.createdTime,
      modified: file.modifiedTime,
      size: file.size,
      parents: file.parents || [],
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      type: getFileType(file.mimeType)
    }));
    
  } catch (error) {
    console.error('Error fetching Google Drive files:', error);
    return getMockDriveFiles();
  }
};

/**
 * Get recent Google Docs
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of recent documents
 */
export const getRecentDocs = async (userId) => {
  try {
    // Import the OAuth client
    const { getOAuthClient } = await import('../routes/oauthRoutes.js');
    const oauth2Client = getOAuthClient(userId);
    
    if (!oauth2Client) {
      console.log('No OAuth client found, using mock data');
      return getMockDocs();
    }
    
    const response = await drive.files.list({
      auth: oauth2Client,
      pageSize: 10,
      q: "mimeType='application/vnd.google-apps.document'",
      fields: 'files(id,name,createdTime,modifiedTime,webViewLink)',
      orderBy: 'modifiedTime desc'
    });
    
    return (response.data.files || []).map(doc => ({
      id: doc.id,
      name: doc.name,
      created: doc.createdTime,
      modified: doc.modifiedTime,
      webViewLink: doc.webViewLink,
      type: 'document'
    }));
    
  } catch (error) {
    console.error('Error fetching recent Google Docs:', error);
    return getMockDocs();
  }
};

/**
 * Get recent Google Sheets
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of recent spreadsheets
 */
export const getRecentSheets = async (userId) => {
  try {
    // Import the OAuth client
    const { getOAuthClient } = await import('../routes/oauthRoutes.js');
    const oauth2Client = getOAuthClient(userId);
    
    if (!oauth2Client) {
      console.log('No OAuth client found, using mock data');
      return getMockSheets();
    }
    
    const response = await drive.files.list({
      auth: oauth2Client,
      pageSize: 10,
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id,name,createdTime,modifiedTime,webViewLink)',
      orderBy: 'modifiedTime desc'
    });
    
    return (response.data.files || []).map(sheet => ({
      id: sheet.id,
      name: sheet.name,
      created: sheet.createdTime,
      modified: sheet.modifiedTime,
      webViewLink: sheet.webViewLink,
      type: 'spreadsheet'
    }));
    
  } catch (error) {
    console.error('Error fetching recent Google Sheets:', error);
    return getMockSheets();
  }
};

/**
 * Get document content
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} - Document content
 */
export const getDocumentContent = async (documentId) => {
  try {
    const response = await googleRequest('docs', 'documents.get', {
      documentId
    });
    
    return {
      id: response.documentId,
      title: response.title,
      content: extractDocumentContent(response.body.content),
      created: response.documentId,
      modified: response.documentId
    };
    
  } catch (error) {
    console.error('Error fetching Google Doc content:', error);
    return {
      id: documentId,
      title: 'Document not accessible',
      content: 'Content not available',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
  }
};

/**
 * Get spreadsheet data
 * @param {string} spreadsheetId - Spreadsheet ID
 * @param {string} range - Range (e.g., 'Sheet1!A1:D10')
 * @returns {Promise<Object>} - Spreadsheet data
 */
export const getSpreadsheetData = async (spreadsheetId, range = 'Sheet1!A1:Z1000') => {
  try {
    const response = await googleRequest('sheets', 'spreadsheets.values.get', {
      spreadsheetId,
      range
    });
    
    return {
      id: spreadsheetId,
      range: response.range,
      values: response.values || [],
      majorDimension: response.majorDimension
    };
    
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    return {
      id: spreadsheetId,
      range,
      values: [],
      majorDimension: 'ROWS'
    };
  }
};

/**
 * Create a new Google Doc
 * @param {string} userId - User identifier
 * @param {Object} docData - Document data
 * @returns {Promise<Object>} - Created document
 */
export const createDocument = async (userId, docData) => {
  try {
    const response = await googleRequest('docs', 'documents.create', {
      requestBody: {
        title: docData.title || 'Untitled Document'
      }
    });
    
    // Add initial content if provided
    if (docData.content) {
      await googleRequest('docs', 'documents.batchUpdate', {
        documentId: response.documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: {
                  index: 1
                },
                text: docData.content
              }
            }
          ]
        }
      });
    }
    
    return {
      id: response.documentId,
      title: response.title,
      webViewLink: `https://docs.google.com/document/d/${response.documentId}/edit`,
      created: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    throw new Error('Failed to create Google Doc');
  }
};

/**
 * Create a new Google Sheet
 * @param {string} userId - User identifier
 * @param {Object} sheetData - Sheet data
 * @returns {Promise<Object>} - Created spreadsheet
 */
export const createSpreadsheet = async (userId, sheetData) => {
  try {
    const response = await googleRequest('sheets', 'spreadsheets.create', {
      requestBody: {
        properties: {
          title: sheetData.title || 'Untitled Spreadsheet'
        },
        sheets: [
          {
            properties: {
              title: sheetData.sheetName || 'Sheet1'
            }
          }
        ]
      }
    });
    
    // Add initial data if provided
    if (sheetData.data && sheetData.data.length > 0) {
      await googleRequest('sheets', 'spreadsheets.values.update', {
        spreadsheetId: response.spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: sheetData.data
        }
      });
    }
    
    return {
      id: response.spreadsheetId,
      title: response.properties.title,
      webViewLink: `https://docs.google.com/spreadsheets/d/${response.spreadsheetId}/edit`,
      created: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw new Error('Failed to create Google Sheet');
  }
};

/**
 * Update document content
 * @param {string} documentId - Document ID
 * @param {string} content - New content
 * @returns {Promise<Object>} - Update result
 */
export const updateDocumentContent = async (documentId, content) => {
  try {
    await googleRequest('docs', 'documents.batchUpdate', {
      documentId,
      requestBody: {
        requests: [
          {
            deleteContentRange: {
              range: {
                startIndex: 1,
                endIndex: 999999
              }
            }
          },
          {
            insertText: {
              location: {
                index: 1
              },
              text: content
            }
          }
        ]
      }
    });
    
    return {
      success: true,
      message: 'Document updated successfully',
      documentId
    };
    
  } catch (error) {
    console.error('Error updating Google Doc:', error);
    throw new Error('Failed to update Google Doc');
  }
};

/**
 * Update spreadsheet data
 * @param {string} spreadsheetId - Spreadsheet ID
 * @param {string} range - Range to update
 * @param {Array} values - Data to insert
 * @returns {Promise<Object>} - Update result
 */
export const updateSpreadsheetData = async (spreadsheetId, range, values) => {
  try {
    await googleRequest('sheets', 'spreadsheets.values.update', {
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values
      }
    });
    
    return {
      success: true,
      message: 'Spreadsheet updated successfully',
      spreadsheetId,
      range
    };
    
  } catch (error) {
    console.error('Error updating Google Sheet:', error);
    throw new Error('Failed to update Google Sheet');
  }
};

/**
 * Search Google Drive
 * @param {string} userId - User identifier
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Search results
 */
export const searchDrive = async (userId, query) => {
  try {
    const response = await googleRequest('drive', 'files.list', {
      pageSize: 20,
      q: `fullText contains '${query}'`,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink)',
      orderBy: 'modifiedTime desc'
    });
    
    return (response.files || []).map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      created: file.createdTime,
      modified: file.modifiedTime,
      webViewLink: file.webViewLink,
      type: getFileType(file.mimeType)
    }));
    
  } catch (error) {
    console.error('Error searching Google Drive:', error);
    return [];
  }
};

/**
 * Get file type from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} - File type
 */
const getFileType = (mimeType) => {
  const types = {
    'application/vnd.google-apps.document': 'document',
    'application/vnd.google-apps.spreadsheet': 'spreadsheet',
    'application/vnd.google-apps.presentation': 'presentation',
    'application/vnd.google-apps.folder': 'folder',
    'application/pdf': 'pdf',
    'image/jpeg': 'image',
    'image/png': 'image',
    'text/plain': 'text'
  };
  
  return types[mimeType] || 'file';
};

/**
 * Extract document content from Google Docs API response
 * @param {Array} content - Document content array
 * @returns {string} - Extracted text content
 */
const extractDocumentContent = (content) => {
  if (!content) return '';
  
  let text = '';
  content.forEach(element => {
    if (element.paragraph) {
      element.paragraph.elements.forEach(el => {
        if (el.textRun) {
          text += el.textRun.content;
        }
      });
    }
  });
  
  return text.trim();
};

// Mock data for fallback
const getMockDriveFiles = () => [
  {
    id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    name: 'Sample Document',
    mimeType: 'application/vnd.google-apps.document',
    created: '2024-01-15T10:00:00Z',
    modified: '2024-01-16T14:30:00Z',
    size: '1024',
    webViewLink: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    type: 'document'
  },
  {
    id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms2',
    name: 'Sample Spreadsheet',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    created: '2024-01-15T11:00:00Z',
    modified: '2024-01-15T11:00:00Z',
    size: '2048',
    webViewLink: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms2/edit',
    type: 'spreadsheet'
  }
];

const getMockDocs = () => [
  {
    id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    name: 'Project Documentation',
    created: '2024-01-15T10:00:00Z',
    modified: '2024-01-16T14:30:00Z',
    webViewLink: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    type: 'document'
  }
];

const getMockSheets = () => [
  {
    id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms2',
    name: 'Project Budget',
    created: '2024-01-15T11:00:00Z',
    modified: '2024-01-15T11:00:00Z',
    webViewLink: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms2/edit',
    type: 'spreadsheet'
  }
]; 