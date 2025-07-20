/**
 * Daily Digest Service
 * 
 * Your personal daily assistant - collects everything from your calendar, 
 * todos, and emails, then gives you smart insights about your day
 */

import { generateIntelligentSummary as ollamaGenerateSummary } from './ollamaService.js';
import { getTodayEvents, updateEvent } from './googleCalendarService.js';
import { getUrgentTodos, createTodo } from './trelloService.js';
import { getUnreadEmails, sendEmail } from './gmailService.js';
import { createTask } from './asanaService.js';
import config from '../config/index.js';

/**
 * Get what's on your calendar today
 * @param {string} userId - Who you are
 * @returns {Promise<Array>} - Your meetings and events for today
 */
export const getCalendarEvents = async (userId) => {
  try {
    // Use real Google Calendar API integration
    const events = await getTodayEvents(userId);
    
    // Transform to match expected format
    return events.map(event => ({
      id: event.id,
      summary: event.title,
      start: event.start,
      end: event.end,
      location: event.location,
      description: event.description
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
};

/**
 * Get your tasks that need attention today
 * @param {string} userId - Who you are
 * @returns {Promise<Array>} - Your todos that are due soon
 */
export const getTodos = async (userId) => {
  try {
    // Use real Trello API integration
    const todos = await getUrgentTodos(userId);
    
    // Transform to match expected format
    return todos.map(todo => ({
      id: todo.id,
      title: todo.title,
      dueDate: todo.dueDate,
      priority: todo.priority,
      status: todo.completed ? 'completed' : 'pending'
    }));
  } catch (error) {
    console.error('Error fetching todos:', error);
    return [];
  }
};

/**
 * Get important emails from today
 * @param {string} userId - Who you are
 * @returns {Promise<Array>} - Your unread and important emails
 */
export const getEmailHighlights = async (userId) => {
  try {
    // Use real Gmail API integration
    const emails = await getUnreadEmails(userId, 10);
    
    // Transform to match expected format
    return emails.map(email => ({
      id: email.id,
      subject: email.subject,
      sender: email.from,
      priority: email.isImportant ? 'high' : 'medium',
      unread: !email.isRead,
      receivedAt: email.date
    }));
  } catch (error) {
    console.error('Error fetching emails:', error);
    return [];
  }
};

/**
 * Turn your daily data into smart insights using AI
 * @param {Object} data - Your calendar, todos, and emails
 * @returns {Promise<Object>} - Smart summary with priorities and suggested actions
 */
export const generateIntelligentSummary = async (data) => {
  try {
    // Use Ollama for intelligent summary generation
    return await ollamaGenerateSummary(data);
  } catch (error) {
    console.error('Error generating summary with Ollama:', error);
    
    // Fallback to rule-based summary
    return {
      overview: 'Your daily summary is ready! (AI insights temporarily unavailable)',
      priorities: generateFallbackPriorities(data),
      conflicts: [],
      suggestedActions: generateFallbackActions(data)
    };
  }
};

/**
 * Create your complete daily digest
 * @param {string} userId - Who you are
 * @returns {Promise<Object>} - Your full daily summary with insights and actions
 */
export const generateDailyDigest = async (userId) => {
  try {
    // Collect everything from your apps
    const [calendarEvents, todos, emails] = await Promise.all([
      getCalendarEvents(userId),
      getTodos(userId),
      getEmailHighlights(userId)
    ]);

    // Get AI insights about your day
    const summary = await generateIntelligentSummary({
      calendarEvents,
      todos,
      emails
    });

    // Count what you have going on
    const metrics = {
      totalMeetings: calendarEvents.length,
      urgentTodos: todos.filter(todo => todo.priority === 'high').length,
      unreadEmails: emails.filter(email => email.unread).length,
      conflicts: summary.conflicts.length
    };

    return {
      timestamp: new Date().toISOString(),
      summary,
      data: {
        calendarEvents,
        todos,
        emails
      },
      metrics,
      actions: [
        {
          id: 'reschedule',
          label: 'Reschedule Meeting',
          type: 'calendar',
          available: calendarEvents.length > 0
        },
        {
          id: 'reply-email',
          label: 'Reply to Email',
          type: 'email',
          available: emails.length > 0
        },
        {
          id: 'add-todo',
          label: 'Add Todo',
          type: 'todo',
          available: true
        }
      ]
    };
  } catch (error) {
    console.error('Error generating daily digest:', error);
    throw new Error('Failed to generate daily digest');
  }
};

/**
 * Execute action based on digest data
 * @param {string} actionId - Action identifier
 * @param {Object} context - Action context
 * @returns {Promise<Object>} - Action result
 */
export const executeAction = async (actionId, context) => {
  try {
    const { userId, eventId, emailId, todoData, newTime } = context;
    
    switch (actionId) {
      case 'reschedule':
        if (!eventId || !newTime) {
          throw new Error('Event ID and new time required for rescheduling');
        }
        
        // Reschedule the meeting using Google Calendar API
        const updatedEvent = await updateEvent(userId, eventId, {
          start: newTime,
          end: new Date(new Date(newTime).getTime() + 60 * 60 * 1000) // 1 hour duration
        });
        
        return { 
          success: true, 
          message: 'Meeting rescheduled successfully',
          event: updatedEvent
        };
      
      case 'reply-email':
        if (!emailId || !context.replyText) {
          throw new Error('Email ID and reply text required');
        }
        
        // Send email reply using Gmail API
        const emailResult = await sendEmail(userId, {
          to: context.recipient,
          subject: `Re: ${context.subject}`,
          body: context.replyText,
          threadId: emailId
        });
        
        return { 
          success: true, 
          message: 'Email reply sent successfully',
          email: emailResult
        };
      
      case 'add-todo':
        if (!todoData || !todoData.title) {
          throw new Error('Todo title required');
        }
        
        // Try Trello first, fallback to Asana
        let todoResult;
        try {
          todoResult = await createTodo(userId, {
            title: todoData.title,
            description: todoData.description,
            dueDate: todoData.dueDate,
            priority: todoData.priority || 'medium'
          });
        } catch (trelloError) {
          console.warn('Trello todo creation failed, trying Asana:', trelloError.message);
          // Fallback to Asana
          todoResult = await createTask(userId, {
            name: todoData.title,
            notes: todoData.description,
            due_on: todoData.dueDate,
            projects: todoData.projectId ? [todoData.projectId] : undefined
          });
        }
        
        return { 
          success: true, 
          message: 'Todo added successfully',
          todo: todoResult
        };
      
      default:
        throw new Error(`Unknown action: ${actionId}`);
    }
  } catch (error) {
    console.error('Error executing action:', error);
    throw error;
  }
};

/**
 * Generate fallback priorities when AI is unavailable
 * @param {Object} data - Aggregated data
 * @returns {Array} - Priority list
 */
const generateFallbackPriorities = (data) => {
  const priorities = [];
  const { calendarEvents, todos, emails } = data;
  
  // Add urgent todos as priorities
  const urgentTodos = todos.filter(todo => todo.priority === 'high');
  urgentTodos.forEach(todo => {
    priorities.push(`Complete: ${todo.title}`);
  });
  
  // Add upcoming meetings
  const upcomingMeetings = calendarEvents.filter(event => {
    const eventTime = new Date(event.start);
    const now = new Date();
    return eventTime > now && eventTime < new Date(now.getTime() + 24 * 60 * 60 * 1000);
  });
  
  upcomingMeetings.forEach(meeting => {
    priorities.push(`Prepare for: ${meeting.summary}`);
  });
  
  // Add urgent emails
  const urgentEmails = emails.filter(email => email.priority === 'high');
  urgentEmails.forEach(email => {
    priorities.push(`Reply to: ${email.subject}`);
  });
  
  return priorities.slice(0, 3); // Return top 3
};

/**
 * Generate fallback actions when AI is unavailable
 * @param {Object} data - Aggregated data
 * @returns {Array} - Action list
 */
const generateFallbackActions = (data) => {
  const actions = [];
  const { calendarEvents, todos, emails } = data;
  
  if (todos.length > 0) {
    actions.push('Review your todo list');
  }
  
  if (calendarEvents.length > 0) {
    actions.push('Check your calendar for today');
  }
  
  if (emails.length > 0) {
    actions.push('Review your emails');
  }
  
  return actions;
};

export default {
  generateDailyDigest,
  executeAction,
  getCalendarEvents,
  getTodos,
  getEmailHighlights
}; 