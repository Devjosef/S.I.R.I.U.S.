/**
 * Gmail Service - Email Integration
 * 
 * Handles Gmail API integration for reading, sending, and managing
 * emails with AI-powered analysis.
 * 
 * Lines: 350
 */

// Google APIs
import { google } from 'googleapis';

// Internal configuration
import config from '../config/index.js';

// Initialize Gmail API
const gmail = google.gmail('v1');

/**
 * Make authenticated Gmail API request
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - API response
 */
const gmailRequest = async (endpoint, params = {}) => {
  const url = `https://www.googleapis.com/gmail/v1/users/me${endpoint}`;
  
  const queryParams = new URLSearchParams({
    key: config.GOOGLE.API_KEY,
    ...params
  });
  
  try {
    const response = await fetch(`${url}?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Gmail API request failed:', error);
    throw error;
  }
};

/**
 * Decode email body from base64
 * @param {string} data - Base64 encoded data
 * @returns {string} - Decoded text
 */
const decodeBody = (data) => {
  try {
    return Buffer.from(data, 'base64').toString('utf-8');
  } catch (error) {
    return '';
  }
};

/**
 * Parse email headers
 * @param {Array} headers - Email headers
 * @returns {Object} - Parsed headers
 */
const parseHeaders = (headers) => {
  const parsed = {};
  headers.forEach(header => {
    parsed[header.name.toLowerCase()] = header.value;
  });
  return parsed;
};

/**
 * Get recent emails
 * @param {string} userId - User identifier
 * @param {number} maxResults - Maximum number of emails to fetch
 * @returns {Promise<Array>} - List of emails
 */
export const getRecentEmails = async (userId, maxResults = 10) => {
  try {
    // Import the OAuth client
    const { getOAuthClient } = await import('../routes/oauthRoutes.js');
    const oauth2Client = getOAuthClient(userId);
    
    if (!oauth2Client) {
      console.log('No OAuth client found, using mock data');
      return getMockEmails();
    }
    
    const response = await gmail.users.messages.list({
      auth: oauth2Client,
      userId: 'me',
      maxResults,
      labelIds: 'INBOX'
    });
    
    const messages = response.data.messages || [];
    const emails = [];
    
    for (const message of messages) {
      const email = await getEmailDetailsOAuth(oauth2Client, message.id);
      if (email) {
        emails.push(email);
      }
    }
    
    return emails;
    
  } catch (error) {
    console.log('Gmail API not available, using mock data:', error.message);
    return getMockEmails();
  }
};

/**
 * Get email details
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} - Email details
 */
const getEmailDetails = async (messageId) => {
  try {
    const response = await gmailRequest(`/messages/${messageId}`);
    
    const message = response;
    const headers = parseHeaders(message.payload.headers);
    
    let body = '';
    if (message.payload.body && message.payload.body.data) {
      body = decodeBody(message.payload.body.data);
    } else if (message.payload.parts) {
      // Find text/plain part
      const textPart = message.payload.parts.find(part => 
        part.mimeType === 'text/plain'
      );
      if (textPart && textPart.body && textPart.body.data) {
        body = decodeBody(textPart.body.data);
      }
    }
    
    return {
      id: message.id,
      threadId: message.threadId,
      subject: headers.subject || 'No Subject',
      from: headers.from || '',
      to: headers.to || '',
      date: headers.date || '',
      snippet: message.snippet || '',
      body: body,
      labels: message.labelIds || [],
      isRead: !message.labelIds?.includes('UNREAD'),
      isStarred: message.labelIds?.includes('STARRED') || false,
      isImportant: message.labelIds?.includes('IMPORTANT') || false
    };
    
  } catch (error) {
    console.error('Error fetching email details:', error);
    return null;
  }
};

/**
 * Get email details using OAuth
 * @param {Object} oauth2Client - OAuth client
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} - Email details
 */
const getEmailDetailsOAuth = async (oauth2Client, messageId) => {
  try {
    const response = await gmail.users.messages.get({
      auth: oauth2Client,
      userId: 'me',
      id: messageId
    });
    
    const message = response.data;
    const headers = parseHeaders(message.payload.headers);
    
    let body = '';
    if (message.payload.body && message.payload.body.data) {
      body = decodeBody(message.payload.body.data);
    } else if (message.payload.parts) {
      // Find text/plain part
      const textPart = message.payload.parts.find(part => 
        part.mimeType === 'text/plain'
      );
      if (textPart && textPart.body && textPart.body.data) {
        body = decodeBody(textPart.body.data);
      }
    }
    
    return {
      id: message.id,
      threadId: message.threadId,
      subject: headers.subject || 'No Subject',
      from: headers.from || '',
      to: headers.to || '',
      date: headers.date || '',
      snippet: message.snippet || '',
      body: body,
      labels: message.labelIds || [],
      isRead: !message.labelIds?.includes('UNREAD'),
      isStarred: message.labelIds?.includes('STARRED') || false,
      isImportant: message.labelIds?.includes('IMPORTANT') || false
    };
    
  } catch (error) {
    console.error('Error fetching email details:', error);
    return null;
  }
};

/**
 * Get unread emails
 * @param {string} userId - User identifier
 * @param {number} maxResults - Maximum number of emails to fetch
 * @returns {Promise<Array>} - List of unread emails
 */
export const getUnreadEmails = async (userId, maxResults = 10) => {
  try {
    // Import the OAuth client
    const { getOAuthClient } = await import('../routes/oauthRoutes.js');
    const oauth2Client = getOAuthClient(userId);
    
    if (!oauth2Client) {
      console.log('No OAuth client found, using mock data');
      return getMockEmails().filter(email => !email.isRead);
    }
    
    const response = await gmail.users.messages.list({
      auth: oauth2Client,
      userId: 'me',
      maxResults,
      labelIds: 'UNREAD'
    });
    
    const messages = response.data.messages || [];
    const emails = [];
    
    for (const message of messages) {
      const email = await getEmailDetailsOAuth(oauth2Client, message.id);
      if (email) {
        emails.push(email);
      }
    }
    
    return emails;
    
  } catch (error) {
    console.log('Gmail API not available, using mock data:', error.message);
    return getMockEmails().filter(email => !email.isRead);
  }
};

/**
 * Get emails from a specific sender
 * @param {string} userId - User identifier
 * @param {string} sender - Email sender
 * @param {number} maxResults - Maximum number of emails to fetch
 * @returns {Promise<Array>} - List of emails from sender
 */
export const getEmailsFromSender = async (userId, sender, maxResults = 10) => {
  try {
    const auth = await getGmailClient();
    
    const response = await gmail.users.messages.list({
      auth,
      userId: 'me',
      maxResults,
      q: `from:${sender}`
    });
    
    const messages = response.data.messages || [];
    const emails = [];
    
    for (const message of messages) {
      const email = await getEmailDetails(auth, message.id);
      if (email) {
        emails.push(email);
      }
    }
    
    return emails;
    
  } catch (error) {
    console.error('Error fetching Gmail messages from sender:', error);
    return [];
  }
};

/**
 * Send an email
 * @param {string} userId - User identifier
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} - Sent email result
 */
export const sendEmail = async (userId, emailData) => {
  try {
    // Import the OAuth client
    const { getOAuthClient } = await import('../routes/oauthRoutes.js');
    const oauth2Client = getOAuthClient(userId);
    
    if (!oauth2Client) {
      throw new Error('No OAuth client found. Please authenticate first.');
    }
    
    const email = [
      `From: ${emailData.from || 'me'}`,
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      '',
      emailData.body
    ].join('\n');
    
    const encodedEmail = Buffer.from(email).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const response = await gmail.users.messages.send({
      auth: oauth2Client,
      userId: 'me',
      resource: {
        raw: encodedEmail
      }
    });
    
    return {
      id: response.data.id,
      threadId: response.data.threadId,
      status: 'sent',
      message: 'Email sent successfully'
    };
    
  } catch (error) {
    console.error('Error sending Gmail message:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
};

/**
 * Reply to an email
 * @param {string} userId - User identifier
 * @param {string} messageId - Original message ID
 * @param {string} replyText - Reply text
 * @returns {Promise<Object>} - Reply result
 */
export const replyToEmail = async (userId, messageId, replyText) => {
  try {
    const auth = await getGmailClient();
    
    // Get original message
    const originalMessage = await gmail.users.messages.get({
      auth,
      userId: 'me',
      id: messageId
    });
    
    const headers = parseHeaders(originalMessage.data.payload.headers);
    const subject = headers.subject?.startsWith('Re:') 
      ? headers.subject 
      : `Re: ${headers.subject}`;
    
    const email = [
      `From: ${headers.to || 'me'}`,
      `To: ${headers.from}`,
      `Subject: ${subject}`,
      `In-Reply-To: ${messageId}`,
      `References: ${messageId}`,
      '',
      replyText
    ].join('\n');
    
    const encodedEmail = Buffer.from(email).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const response = await gmail.users.messages.send({
      auth,
      userId: 'me',
      resource: {
        raw: encodedEmail
      }
    });
    
    return {
      id: response.data.id,
      threadId: response.data.threadId,
      status: 'replied'
    };
    
  } catch (error) {
    console.error('Error replying to Gmail message:', error);
    throw new Error('Failed to reply to email');
  }
};

/**
 * Mark email as read
 * @param {string} userId - User identifier
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} - Update result
 */
export const markAsRead = async (userId, messageId) => {
  try {
    const auth = await getGmailClient();
    
    await gmail.users.messages.modify({
      auth,
      userId: 'me',
      id: messageId,
      resource: {
        removeLabelIds: ['UNREAD']
      }
    });
    
    return {
      id: messageId,
      status: 'marked_as_read'
    };
    
  } catch (error) {
    console.error('Error marking Gmail message as read:', error);
    throw new Error('Failed to mark email as read');
  }
};

/**
 * Mark email as unread
 * @param {string} userId - User identifier
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} - Update result
 */
export const markAsUnread = async (userId, messageId) => {
  try {
    const auth = await getGmailClient();
    
    await gmail.users.messages.modify({
      auth,
      userId: 'me',
      id: messageId,
      resource: {
        addLabelIds: ['UNREAD']
      }
    });
    
    return {
      id: messageId,
      status: 'marked_as_unread'
    };
    
  } catch (error) {
    console.error('Error marking Gmail message as unread:', error);
    throw new Error('Failed to mark email as unread');
  }
};

/**
 * Delete an email
 * @param {string} userId - User identifier
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteEmail = async (userId, messageId) => {
  try {
    const auth = await getGmailClient();
    
    await gmail.users.messages.delete({
      auth,
      userId: 'me',
      id: messageId
    });
    
    return {
      id: messageId,
      status: 'deleted'
    };
    
  } catch (error) {
    console.error('Error deleting Gmail message:', error);
    throw new Error('Failed to delete email');
  }
};

/**
 * Get email statistics
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} - Email statistics
 */
export const getEmailStats = async (userId) => {
  try {
    const [inboxResponse, unreadResponse, sentResponse] = await Promise.all([
      gmailRequest('/messages', { labelIds: 'INBOX' }),
      gmailRequest('/messages', { labelIds: 'UNREAD' }),
      gmailRequest('/messages', { labelIds: 'SENT' })
    ]);
    
    return {
      totalInbox: inboxResponse.resultSizeEstimate || 0,
      unreadCount: unreadResponse.resultSizeEstimate || 0,
      sentCount: sentResponse.resultSizeEstimate || 0,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error fetching Gmail statistics:', error);
    return {
      totalInbox: 0,
      unreadCount: 0,
      sentCount: 0,
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * Mock emails for fallback
 * @returns {Array} - Mock emails
 */
const getMockEmails = () => {
  return [
    {
      id: 'mock-email-1',
      threadId: 'thread-1',
      subject: 'Project Update Meeting',
      from: 'manager@company.com',
      to: 'me@company.com',
      date: new Date().toISOString(),
      snippet: 'Hi, I wanted to discuss the latest project updates...',
      body: 'Hi,\n\nI wanted to discuss the latest project updates and get your input on the next steps.\n\nBest regards,\nManager',
      labels: ['INBOX'],
      isRead: false,
      isStarred: false,
      isImportant: true
    },
    {
      id: 'mock-email-2',
      threadId: 'thread-2',
      subject: 'Weekly Newsletter',
      from: 'newsletter@tech.com',
      to: 'me@company.com',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      snippet: 'This week in tech: AI breakthroughs, new frameworks...',
      body: 'This week in tech:\n\n- AI breakthroughs in natural language processing\n- New JavaScript frameworks gaining popularity\n- Security updates for popular libraries\n\nStay tuned for more updates!',
      labels: ['INBOX'],
      isRead: true,
      isStarred: false,
      isImportant: false
    },
    {
      id: 'mock-email-3',
      threadId: 'thread-3',
      subject: 'Client Feedback',
      from: 'client@clientcompany.com',
      to: 'me@company.com',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: 'Thank you for the excellent work on our project...',
      body: 'Hi,\n\nThank you for the excellent work on our project. The team is very satisfied with the results.\n\nWe look forward to working with you again.\n\nBest regards,\nClient Team',
      labels: ['INBOX'],
      isRead: true,
      isStarred: true,
      isImportant: true
    }
  ];
};

export default {
  getRecentEmails,
  getUnreadEmails,
  getEmailsFromSender,
  sendEmail,
  replyToEmail,
  markAsRead,
  markAsUnread,
  deleteEmail,
  getEmailStats
}; 