/**
 * Context Engine - User Pattern Analysis
 * 
 * Analyzes user context, patterns, and provides intelligent summaries
 * and recommendations based on current state.
 * 
 * Lines: 420
 */

// AI and digest services
import { generateIntelligentSummary } from './ollamaService.js';
import dailyDigestService from './dailyDigestService.js';

/**
 * Your current situation and what's happening around you
 */
export class ContextSummary {
  constructor() {
    this.timestamp = new Date();
    this.currentTimeBlock = this.getCurrentTimeBlock();
    this.urgency = 'low'; // low, medium, high, critical
    this.focus = 'general'; // meeting, deep-work, break, travel
    this.energy = 'medium'; // low, medium, high
    this.context = {
      calendar: [],
      todos: [],
      emails: [],
      notifications: [],
      location: null,
      activeApps: []
    };
    this.insights = [];
    this.actions = [];
  }

  /**
   * Figure out what time of day it is and what you should be doing
   */
  getCurrentTimeBlock() {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 9) return 'morning-startup';
    if (hour >= 9 && hour < 12) return 'morning-focus';
    if (hour >= 12 && hour < 14) return 'lunch-break';
    if (hour >= 14 && hour < 17) return 'afternoon-focus';
    if (hour >= 17 && hour < 19) return 'evening-wrapup';
    if (hour >= 19 && hour < 22) return 'evening-personal';
    return 'night-rest';
  }
}

/**
 * The main context engine that understands your situation
 */
export class ContextEngine {
  constructor() {
    this.userPreferences = {
      workHours: { start: 9, end: 17 },
      focusBlocks: ['morning-focus', 'afternoon-focus'],
      breakTimes: ['lunch-break', 'evening-wrapup'],
      noMeetingTimes: ['evening-personal', 'night-rest'],
      preferredMeetingDuration: 30,
      emailCheckFrequency: 15 // minutes
    };
    
    this.memory = {
      patterns: {},
      preferences: {},
      interactions: []
    };
  }

  /**
   * Analyze your current situation and provide smart insights
   * @param {string} userId - Who you are
   * @returns {Promise<ContextSummary>} - Your current situation
   */
  async analyzeContext(userId) {
    try {
      const context = new ContextSummary();
      
      // Gather data from all sources
      const [calendar, todos, emails] = await Promise.all([
        dailyDigestService.getCalendarEvents(userId),
        dailyDigestService.getTodos(userId),
        dailyDigestService.getEmailHighlights(userId)
      ]);
      
      context.context.calendar = calendar;
      context.context.todos = todos;
      context.context.emails = emails;
      
      // Analyze urgency and focus
      context.urgency = this.analyzeUrgency(context);
      context.focus = this.analyzeFocus(context);
      context.energy = this.analyzeEnergy(context);
      
      // Generate intelligent insights
      context.insights = await this.generateInsights(context);
      context.actions = this.suggestActions(context);
      
      // Learn from this analysis
      this.learnFromContext(context);
      context.userId = userId; // <-- Always include userId in context
      return context;
    } catch (error) {
      console.error('Error analyzing context:', error);
      const fallback = new ContextSummary();
      fallback.userId = userId; // <-- Add userId to fallback as well
      return fallback;
    }
  }

  /**
   * Figure out how urgent your current situation is
   * @param {ContextSummary} context - Your current situation
   * @returns {string} - Urgency level
   */
  analyzeUrgency(context) {
    const { calendar, todos, emails } = context.context;
    
    let urgencyScore = 0;
    
    // Check for urgent todos
    const urgentTodos = todos.filter(todo => todo.priority === 'high');
    urgencyScore += urgentTodos.length * 2;
    
    // Check for overdue items
    const overdueTodos = todos.filter(todo => {
      const dueDate = new Date(todo.dueDate);
      return dueDate < new Date();
    });
    urgencyScore += overdueTodos.length * 3;
    
    // Check for high-priority emails
    const urgentEmails = emails.filter(email => email.priority === 'high');
    urgencyScore += urgentEmails.length;
    
    // Check for upcoming meetings
    const upcomingMeetings = calendar.filter(event => {
      const eventTime = new Date(event.start);
      const now = new Date();
      const timeDiff = eventTime - now;
      return timeDiff > 0 && timeDiff < 30 * 60 * 1000; // Within 30 minutes
    });
    urgencyScore += upcomingMeetings.length;
    
    if (urgencyScore >= 5) return 'critical';
    if (urgencyScore >= 3) return 'high';
    if (urgencyScore >= 1) return 'medium';
    return 'low';
  }

  /**
   * Figure out what you should be focusing on
   * @param {ContextSummary} context - Your current situation
   * @returns {string} - Focus area
   */
  analyzeFocus(context) {
    const { calendar, todos } = context.context;
    const { currentTimeBlock } = context;
    
    // Check if you have meetings coming up
    const upcomingMeetings = calendar.filter(event => {
      const eventTime = new Date(event.start);
      const now = new Date();
      const timeDiff = eventTime - now;
      return timeDiff > 0 && timeDiff < 60 * 60 * 1000; // Within 1 hour
    });
    
    if (upcomingMeetings.length > 0) {
      return 'meeting-prep';
    }
    
    // Check if you have urgent work
    const urgentTodos = todos.filter(todo => todo.priority === 'high');
    if (urgentTodos.length > 0) {
      return 'deep-work';
    }
    
    // Check time of day
    if (this.userPreferences.focusBlocks.includes(currentTimeBlock)) {
      return 'deep-work';
    }
    
    if (this.userPreferences.breakTimes.includes(currentTimeBlock)) {
      return 'break';
    }
    
    return 'general';
  }

  /**
   * Estimate your energy level based on time and activities
   * @param {ContextSummary} context - Your current situation
   * @returns {string} - Energy level
   */
  analyzeEnergy(context) {
    const { currentTimeBlock } = context;
    const hour = new Date().getHours();
    
    // Morning energy (after coffee)
    if (hour >= 9 && hour <= 11) return 'high';
    
    // Post-lunch dip
    if (hour >= 14 && hour <= 15) return 'low';
    
    // Afternoon recovery
    if (hour >= 16 && hour <= 17) return 'medium';
    
    // Evening wind-down
    if (hour >= 18) return 'low';
    
    return 'medium';
  }

  /**
   * Generate smart insights about your situation
   * @param {ContextSummary} context - Your current situation
   * @returns {Promise<Array>} - List of insights
   */
  async generateInsights(context) {
    try {
      const prompt = `
Analyze this user's current situation and provide 3-5 actionable insights:

Current Time Block: ${context.currentTimeBlock}
Urgency Level: ${context.urgency}
Focus Area: ${context.focus}
Energy Level: ${context.energy}

Calendar Events: ${context.context.calendar.length} events
- ${context.context.calendar.map(e => `${e.summary} at ${new Date(e.start).toLocaleTimeString()}`).join('\n- ')}

Todos: ${context.context.todos.length} tasks
- ${context.context.todos.map(t => `${t.title} (${t.priority} priority, due: ${new Date(t.dueDate).toLocaleDateString()})`).join('\n- ')}

Emails: ${context.context.emails.length} unread
- ${context.context.emails.map(e => `${e.subject} from ${e.sender} (${e.priority} priority)`).join('\n- ')}

Provide insights that are:
1. Specific to their current situation
2. Actionable and practical
3. Consider their energy and focus levels
4. Prioritized by urgency

Format as a simple list of insights.
`;

      const response = await generateIntelligentSummary({
        calendarEvents: context.context.calendar,
        todos: context.context.todos,
        emails: context.context.emails
      });

      return [
        response.overview,
        ...response.priorities.map(p => `Priority: ${p}`),
        ...response.suggestedActions.map(a => `Action: ${a}`)
      ];
    } catch (error) {
      console.error('Error generating insights:', error);
      return [
        'Focus on your most urgent tasks first',
        'Take breaks when your energy is low',
        'Review your schedule for the rest of the day'
      ];
    }
  }

  /**
   * Suggest actions based on your current situation
   * @param {ContextSummary} context - Your current situation
   * @returns {Array} - List of suggested actions
   */
  suggestActions(context) {
    const actions = [];
    
    // Meeting prep actions
    if (context.focus === 'meeting-prep') {
      actions.push({
        id: 'meeting-prep',
        label: 'Prepare for upcoming meeting',
        type: 'calendar',
        priority: 'high'
      });
    }
    
    // Deep work actions
    if (context.focus === 'deep-work') {
      actions.push({
        id: 'focus-mode',
        label: 'Enable focus mode',
        type: 'productivity',
        priority: 'medium'
      });
    }
    
    // Break actions
    if (context.focus === 'break') {
      actions.push({
        id: 'take-break',
        label: 'Take a short break',
        type: 'wellness',
        priority: 'low'
      });
    }
    
    // Urgent task actions
    if (context.urgency === 'high' || context.urgency === 'critical') {
      actions.push({
        id: 'urgent-tasks',
        label: 'Handle urgent tasks',
        type: 'todo',
        priority: 'high'
      });
    }
    
    return actions;
  }

  /**
   * Learn from this context analysis to improve future insights
   * @param {ContextSummary} context - Your current situation
   */
  learnFromContext(context) {
    // Store this interaction for pattern learning
    this.memory.interactions.push({
      timestamp: context.timestamp,
      timeBlock: context.currentTimeBlock,
      urgency: context.urgency,
      focus: context.focus,
      energy: context.energy,
      actions: context.actions
    });
    
    // Keep only last 100 interactions
    if (this.memory.interactions.length > 100) {
      this.memory.interactions = this.memory.interactions.slice(-100);
    }
    
    // Learn patterns
    this.learnPatterns();
  }

  /**
   * Learn patterns from your interactions
   */
  learnPatterns() {
    const patterns = {};
    
    // Analyze time block patterns
    this.memory.interactions.forEach(interaction => {
      const timeBlock = interaction.timeBlock;
      if (!patterns[timeBlock]) {
        patterns[timeBlock] = {
          count: 0,
          avgUrgency: 0,
          commonFocus: {},
          commonActions: {}
        };
      }
      
      patterns[timeBlock].count++;
      patterns[timeBlock].commonFocus[interaction.focus] = 
        (patterns[timeBlock].commonFocus[interaction.focus] || 0) + 1;
    });
    
    this.memory.patterns = patterns;
  }

  /**
   * Get your learned preferences and patterns
   * @returns {Object} - Your preferences and patterns
   */
  getPreferences() {
    return {
      userPreferences: this.userPreferences,
      learnedPatterns: this.memory.patterns,
      recentInteractions: this.memory.interactions.slice(-10)
    };
  }
}

// Create a singleton instance
const contextEngine = new ContextEngine();

export default contextEngine; 