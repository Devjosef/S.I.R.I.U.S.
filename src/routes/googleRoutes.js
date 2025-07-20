/**
 * Google Routes - Google Workspace Integration Endpoints
 * 
 * Handles API endpoints for Google Calendar, Gmail, and
 * Google Workspace integrations.
 * 
 * Lines: 378
 */

// Express routing
import { Router } from 'express';

// Google service integrations
import * as googleCalendarService from '../services/googleCalendarService.js';
import * as gmailService from '../services/gmailService.js';
import * as googleWorkspaceService from '../services/googleWorkspaceService.js';

// Internal utilities
import logger from '../utils/logger.js';

const googleLogger = logger.child({ component: 'google-routes' });
const router = Router();

/**
 * Get today's calendar events
 * GET /api/google/calendar/today
 */
router.get('/calendar/today', async (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const events = await googleCalendarService.getTodayEvents(userId);
    
    res.json({
      success: true,
      message: 'Calendar events retrieved successfully',
      data: events
    });
  } catch (error) {
    googleLogger.error({ err: error }, 'Failed to get calendar events');
    res.status(500).json({
      success: false,
      message: 'Failed to get calendar events',
      error: error.message
    });
  }
});

/**
 * Get recent emails
 * GET /api/google/gmail/recent
 */
router.get('/gmail/recent', async (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const emails = await gmailService.getRecentEmails(userId);
    
    res.json({
      success: true,
      message: 'Recent emails retrieved successfully',
      data: emails
    });
  } catch (error) {
    googleLogger.error({ err: error }, 'Failed to get recent emails');
    res.status(500).json({
      success: false,
      message: 'Failed to get recent emails',
      error: error.message
    });
  }
});

/**
 * Get unread emails
 * GET /api/google/gmail/unread
 */
router.get('/gmail/unread', async (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const emails = await gmailService.getUnreadEmails(userId);
    
    res.json({
      success: true,
      message: 'Unread emails retrieved successfully',
      data: emails
    });
  } catch (error) {
    googleLogger.error({ err: error }, 'Failed to get unread emails');
    res.status(500).json({
      success: false,
      message: 'Failed to get unread emails',
      error: error.message
    });
  }
});

/**
 * Send an email
 * POST /api/google/gmail/send
 */
router.post('/gmail/send', async (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    const { to, subject, body, from } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'To, subject, and body are required'
      });
    }
    
    const emailData = {
      to,
      subject,
      body,
      from: from || 'me'
    };
    
    const result = await gmailService.sendEmail(userId, emailData);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });
  } catch (error) {
    googleLogger.error({ err: error }, 'Failed to send email');
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

/**
 * Send an email
 * POST /api/google/gmail/send
 */
router.post('/gmail/send', async (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    const { to, subject, body, from } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'To, subject, and body are required'
      });
    }
    
    const emailData = {
      to,
      subject,
      body,
      from: from || 'me'
    };
    
    const result = await gmailService.sendEmail(userId, emailData);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });
  } catch (error) {
    googleLogger.error({ err: error }, 'Failed to send email');
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

/**
 * Get recent Google Docs
 * GET /api/google/docs/recent
 */
router.get('/docs/recent', async (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const docs = await googleWorkspaceService.getRecentDocs(userId);
    
    res.json({
      success: true,
      message: 'Recent Google Docs retrieved successfully',
      data: docs
    });
  } catch (error) {
    googleLogger.error({ err: error }, 'Failed to get recent Google Docs');
    res.status(500).json({
      success: false,
      message: 'Failed to get recent Google Docs',
      error: error.message
    });
  }
});

/**
 * Get recent Google Sheets
 * GET /api/google/sheets/recent
 */
router.get('/sheets/recent', async (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const sheets = await googleWorkspaceService.getRecentSheets(userId);
    
    res.json({
      success: true,
      message: 'Recent Google Sheets retrieved successfully',
      data: sheets
    });
  } catch (error) {
    googleLogger.error({ err: error }, 'Failed to get recent Google Sheets');
    res.status(500).json({
      success: false,
      message: 'Failed to get recent Google Sheets',
      error: error.message
    });
  }
});

/**
 * Get Google Drive files
 * GET /api/google/drive/files
 */
router.get('/drive/files', async (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const filters = {
      query: req.query.query || '',
      pageSize: parseInt(req.query.pageSize) || 20
    };
    
    const files = await googleWorkspaceService.getDriveFiles(userId, filters);
    
    res.json({
      success: true,
      message: 'Google Drive files retrieved successfully',
      data: files
    });
  } catch (error) {
    googleLogger.error({ err: error }, 'Failed to get Google Drive files');
    res.status(500).json({
      success: false,
      message: 'Failed to get Google Drive files',
      error: error.message
    });
  }
});

/**
 * Search Google Drive
 * GET /api/google/drive/search
 */
router.get('/drive/search', async (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const query = req.query.q;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const results = await googleWorkspaceService.searchDrive(userId, query);
    
    res.json({
      success: true,
      message: 'Google Drive search completed successfully',
      data: results
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to search Google Drive');
    res.status(500).json({
      success: false,
      message: 'Failed to search Google Drive',
      error: error.message
    });
  }
});

/**
 * Get available calendars
 * GET /api/google/calendar/list
 */
router.get('/calendar/list', async (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const calendars = await googleCalendarService.getAvailableCalendars(userId);
    
    res.json({
      success: true,
      message: 'Available calendars retrieved successfully',
      data: calendars
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get available calendars');
    res.status(500).json({
      success: false,
      message: 'Failed to get available calendars',
      error: error.message
    });
  }
});

/**
 * Create a new calendar event
 * POST /api/google/calendar/create
 */
router.post('/calendar/create', async (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    const { summary, description, startDate, endDate, location, recurrence, reminders } = req.body;
    
    if (!summary || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Summary, startDate, and endDate are required'
      });
    }
    
    const eventData = {
      title: summary,
      description: description || '',
      start: startDate,
      end: endDate,
      location: location || '',
      attendees: [],
      recurrence: recurrence || null,
      reminders: reminders || []
    };
    
    const result = await googleCalendarService.createEvent(userId, eventData);
    
    res.json({
      success: true,
      message: 'Calendar event created successfully',
      data: result
    });
  } catch (error) {
    googleLogger.error({ err: error }, 'Failed to create calendar event');
    res.status(500).json({
      success: false,
      message: 'Failed to create calendar event',
      error: error.message
    });
  }
});

/**
 * Delete a calendar event
 * DELETE /api/google/calendar/delete/:eventId
 */
router.delete('/calendar/delete/:eventId', async (req, res) => {
  try {
    const userId = req.query.userId || 'default-user';
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }
    
    const result = await googleCalendarService.deleteEvent(userId, eventId);
    
    res.json({
      success: true,
      message: 'Calendar event deleted successfully',
      data: result
    });
  } catch (error) {
    googleLogger.error({ err: error }, 'Failed to delete calendar event');
    res.status(500).json({
      success: false,
      message: 'Failed to delete calendar event',
      error: error.message
    });
  }
});

export default router; 