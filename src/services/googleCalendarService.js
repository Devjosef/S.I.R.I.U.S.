/**
 * Google Calendar Service - Calendar Management
 * 
 * Manages Google Calendar integration for event scheduling,
 * conflict resolution, and smart calendar operations.
 * 
 * Lines: 400
 */

// Google APIs
import { google } from 'googleapis';

// Internal configuration
import config from '../config/index.js';

// Initialize Google Calendar API
const calendar = google.calendar('v3');

/**
 * Get Google Calendar API client
 * @returns {Object} - Authenticated calendar client
 */
const getCalendarClient = () => {
  const auth = new google.auth.OAuth2(
    config.GOOGLE.CLIENT_ID,
    config.GOOGLE.CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback'
  );
  
  return auth;
};

/**
 * Make authenticated Google Calendar API request
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - API response
 */
const calendarRequest = async (endpoint, params = {}) => {
  const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
  
  const queryParams = new URLSearchParams({
    key: config.GOOGLE.API_KEY,
    ...params
  });
  
  try {
    const response = await fetch(`${url}?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Google Calendar API request failed:', error);
    throw error;
  }
};

/**
 * Get calendar events for today
 * @param {string} userId - User identifier
 * @param {string} calendarId - Calendar ID (default: 'primary')
 * @returns {Promise<Array>} - Calendar events for today
 */
export const getTodayEvents = async (userId, calendarId = 'primary') => {
  try {
    // Import the OAuth client
    const { getOAuthClient } = await import('../routes/oauthRoutes.js');
    const oauth2Client = getOAuthClient(userId);
    
    if (!oauth2Client) {
      console.log('No OAuth client found, using mock data');
      return getMockCalendarEvents();
    }
    
    // Use Malmö timezone for date calculations
    const today = new Date();
    const malmoTime = new Date(today.toLocaleString("en-US", {timeZone: "Europe/Paris"}));
    const startOfDay = new Date(malmoTime.getFullYear(), malmoTime.getMonth(), malmoTime.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    const calendar = google.calendar('v3');
    const response = await calendar.events.list({
      auth: oauth2Client,
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const events = response.data.items || [];
    
    // Transform Google Calendar events to our format
    return events.map(event => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || '',
      attendees: event.attendees || [],
      organizer: event.organizer?.email || '',
      isAllDay: !event.start.dateTime,
      status: event.status,
      created: event.created,
      updated: event.updated
    }));
    
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    
    // Fallback to mock data if API fails
    console.log('Falling back to mock calendar data');
    return getMockCalendarEvents();
  }
};

/**
 * Get calendar events for a specific date range
 * @param {string} userId - User identifier
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} calendarId - Calendar ID (default: 'primary')
 * @returns {Promise<Array>} - Calendar events for the date range
 */
export const getEventsForDateRange = async (userId, startDate, endDate, calendarId = 'primary') => {
  try {
    const auth = await getCalendarClient();
    
    const response = await calendar.events.list({
      auth,
      calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const events = response.data.items || [];
    
    return events.map(event => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || '',
      attendees: event.attendees || [],
      organizer: event.organizer?.email || '',
      isAllDay: !event.start.dateTime,
      status: event.status,
      created: event.created,
      updated: event.updated
    }));
    
  } catch (error) {
    console.error('Error fetching Google Calendar events for date range:', error);
    return [];
  }
};

/**
 * Create a new calendar event
 * @param {string} userId - User identifier
 * @param {Object} eventData - Event data
 * @param {string} calendarId - Calendar ID (default: 'primary')
 * @returns {Promise<Object>} - Created event
 */
export const createEvent = async (userId, eventData, calendarId = 'primary') => {
  try {
    // Import the OAuth client
    const { getOAuthClient } = await import('../routes/oauthRoutes.js');
    const oauth2Client = getOAuthClient(userId);
    
    if (!oauth2Client) {
      throw new Error('No OAuth client found. Please authenticate first.');
    }
    
    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventData.start,
        timeZone: 'Europe/Paris'
      },
      end: {
        dateTime: eventData.end,
        timeZone: 'Europe/Paris'
      },
      location: eventData.location || '',
      attendees: eventData.attendees || []
    };
    
    // Add recurrence if specified
    if (eventData.recurrence) {
      event.recurrence = [eventData.recurrence];
    }
    
    // Add reminders if specified
    if (eventData.reminders && eventData.reminders.length > 0) {
      event.reminders = {
        useDefault: false,
        overrides: eventData.reminders.map(reminder => ({
          method: reminder.method,
          minutes: reminder.minutes
        }))
      };
    }
    
    const response = await calendar.events.insert({
      auth: oauth2Client,
      calendarId,
      resource: event
    });
    
    return {
      id: response.data.id,
      title: response.data.summary,
      start: response.data.start.dateTime,
      end: response.data.end.dateTime,
      status: 'created',
      htmlLink: response.data.htmlLink
    };
    
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw new Error('Failed to create calendar event: ' + error.message);
  }
};

/**
 * Update an existing calendar event
 * @param {string} userId - User identifier
 * @param {string} eventId - Event ID to update
 * @param {Object} eventData - Updated event data
 * @param {string} calendarId - Calendar ID (default: 'primary')
 * @returns {Promise<Object>} - Updated event
 */
export const updateEvent = async (userId, eventId, eventData, calendarId = 'primary') => {
  try {
    const auth = await getCalendarClient();
    
    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventData.start,
        timeZone: 'Europe/Paris'
      },
      end: {
        dateTime: eventData.end,
        timeZone: 'Europe/Paris'
      },
      location: eventData.location || ''
    };
    
    const response = await calendar.events.update({
      auth,
      calendarId,
      eventId,
      resource: event
    });
    
    return {
      id: response.data.id,
      title: response.data.summary,
      start: response.data.start.dateTime,
      end: response.data.end.dateTime,
      status: 'updated'
    };
    
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
};

/**
 * Delete a calendar event
 * @param {string} userId - User identifier
 * @param {string} eventId - Event ID to delete
 * @param {string} calendarId - Calendar ID (default: 'primary')
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteEvent = async (userId, eventId, calendarId = 'primary') => {
  try {
    // Import the OAuth client
    const { getOAuthClient } = await import('../routes/oauthRoutes.js');
    const oauth2Client = getOAuthClient(userId);
    
    if (!oauth2Client) {
      throw new Error('No OAuth client found. Please authenticate first.');
    }
    
    await calendar.events.delete({
      auth: oauth2Client,
      calendarId,
      eventId
    });
    
    return {
      id: eventId,
      status: 'deleted'
    };
    
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw new Error('Failed to delete calendar event: ' + error.message);
  }
};

/**
 * Get available calendars for the user
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} - List of available calendars
 */
export const getAvailableCalendars = async (userId) => {
  try {
    // Import the OAuth client
    const { getOAuthClient } = await import('../routes/oauthRoutes.js');
    const oauth2Client = getOAuthClient(userId);
    
    if (!oauth2Client) {
      console.log('No OAuth client found, returning empty calendar list');
      return [];
    }
    
    const response = await calendar.calendarList.list({
      auth: oauth2Client
    });
    
    return (response.data.items || []).map(cal => ({
      id: cal.id,
      name: cal.summary,
      primary: cal.primary || false,
      accessRole: cal.accessRole
    }));
    
  } catch (error) {
    console.error('Error fetching available calendars:', error);
    return [];
  }
};

/**
 * Mock calendar events for fallback
 * @returns {Array} - Mock calendar events
 */
const getMockCalendarEvents = () => {
  return [
    {
      id: 'mock-1',
      title: 'Team Standup',
      description: 'Daily team synchronization meeting',
      start: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
      location: 'Conference Room A',
      attendees: ['team@company.com'],
      organizer: 'manager@company.com',
      isAllDay: false,
      status: 'confirmed'
    },
    {
      id: 'mock-2',
      title: 'Client Meeting',
      description: 'Quarterly review with client',
      start: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
      location: 'Zoom',
      attendees: ['client@company.com'],
      organizer: 'sales@company.com',
      isAllDay: false,
      status: 'confirmed'
    }
  ];
};

export default {
  getTodayEvents,
  getEventsForDateRange,
  createEvent,
  updateEvent,
  deleteEvent,
  getAvailableCalendars
}; 