/**
 * n8n Integration Service
 * 
 * Handles communication between S.I.R.I.U.S. and n8n workflows
 * Supports both API key and webhook-based integration
 */

import axios from 'axios';
import logger from '../utils/logger.js';

class N8nIntegrationService {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY;
    this.webhookUrl = process.env.N8N_WEBHOOK_URL;
    this.useWebhooks = !this.apiKey; // Use webhooks if no API key
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey })
      }
    });
    
    logger.info('n8n Integration Service initialized', {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      hasWebhookUrl: !!this.webhookUrl,
      useWebhooks: this.useWebhooks
    });
  }

  /**
   * Execute n8n workflow with S.I.R.I.U.S. context
   * @param {string} workflowId - n8n workflow ID
   * @param {Object} context - S.I.R.I.U.S. context data
   * @returns {Promise<Object>} - Workflow execution result
   */
  async executeWorkflow(workflowId, context) {
    try {
      logger.info(`Executing n8n workflow: ${workflowId}`, { context });
      
      if (this.useWebhooks) {
        // Use webhook-based execution for free tier
        return await this.executeWorkflowViaWebhook(workflowId, context);
      } else {
        // Use API key-based execution
        const response = await this.client.post(`/workflows/${workflowId}/trigger`, {
          context,
          timestamp: new Date().toISOString(),
          source: 'S.I.R.I.U.S.',
          aiContext: {
            decision: context.decision,
            confidence: context.confidence,
            learning: context.learning
          }
        });
        
        logger.info(`n8n workflow ${workflowId} executed successfully`, {
          executionId: response.data?.executionId,
          status: response.data?.status
        });
        
        return {
          success: true,
          executionId: response.data?.executionId,
          status: response.data?.status,
          data: response.data
        };
      }
    } catch (error) {
      logger.error('Error executing n8n workflow:', error);
      throw new Error(`Failed to execute n8n workflow: ${error.message}`);
    }
  }

  /**
   * Execute workflow via webhook (free tier alternative)
   * @param {string} workflowId - n8n workflow ID
   * @param {Object} context - S.I.R.I.U.S. context data
   * @returns {Promise<Object>} - Workflow execution result
   */
  async executeWorkflowViaWebhook(workflowId, context) {
    try {
      // For webhook execution, we need to trigger the workflow via HTTP
      const webhookUrl = `${this.baseUrl}/webhook/${workflowId}`;
      
      const response = await axios.post(webhookUrl, {
        context,
        timestamp: new Date().toISOString(),
        source: 'S.I.R.I.U.S.',
        aiContext: {
          decision: context.decision,
          confidence: context.confidence,
          learning: context.learning
        }
      });
      
      logger.info(`n8n workflow ${workflowId} executed via webhook successfully`);
      
      return {
        success: true,
        method: 'webhook',
        status: 'executed',
        data: response.data
      };
    } catch (error) {
      logger.error('Error executing n8n workflow via webhook:', error);
      throw new Error(`Failed to execute n8n workflow via webhook: ${error.message}`);
    }
  }

  /**
   * Create workflow from S.I.R.I.U.S. AI analysis
   * @param {Object} workflowDefinition - Workflow definition
   * @returns {Promise<Object>} - Created workflow
   */
  async createWorkflow(workflowDefinition) {
    try {
      logger.info('Creating n8n workflow from S.I.R.I.U.S. analysis', { workflowDefinition });
      
      if (this.useWebhooks) {
        // For free tier, return workflow definition for manual creation
        logger.info('Free tier detected - returning workflow definition for manual creation');
        return {
          success: true,
          method: 'manual_creation',
          message: 'Workflow definition ready for manual creation in n8n',
          workflowDefinition: {
            ...workflowDefinition,
            meta: {
              createdBy: 'S.I.R.I.U.S.',
              aiGenerated: true,
              timestamp: new Date().toISOString(),
              instructions: 'Copy this workflow definition and create it manually in n8n'
            }
          }
        };
      } else {
        // Use API key-based creation
        const response = await this.client.post('/workflows', {
          ...workflowDefinition,
          meta: {
            createdBy: 'S.I.R.I.U.S.',
            aiGenerated: true,
            timestamp: new Date().toISOString()
          }
        });
        
        logger.info('n8n workflow created successfully', {
          workflowId: response.data?.id,
          name: response.data?.name
        });
        
        return {
          success: true,
          workflowId: response.data?.id,
          name: response.data?.name,
          data: response.data
        };
      }
    } catch (error) {
      logger.error('Error creating n8n workflow:', error);
      throw new Error(`Failed to create n8n workflow: ${error.message}`);
    }
  }

  /**
   * Get available n8n integrations (free tier compatible)
   * @returns {Promise<Array>} - List of available integrations
   */
  async getIntegrations() {
    try {
      logger.info('Fetching n8n integrations');
      
      if (this.useWebhooks) {
        // Return common integrations for free tier
        const commonIntegrations = [
          { name: 'HTTP Request', displayName: 'HTTP Request', category: 'Core' },
          { name: 'Webhook', displayName: 'Webhook', category: 'Core' },
          { name: 'Email', displayName: 'Email', category: 'Communication' },
          { name: 'Slack', displayName: 'Slack', category: 'Communication' },
          { name: 'Google Sheets', displayName: 'Google Sheets', category: 'Productivity' },
          { name: 'Notion', displayName: 'Notion', category: 'Productivity' },
          { name: 'Trello', displayName: 'Trello', category: 'Productivity' },
          { name: 'Mailchimp', displayName: 'Mailchimp', category: 'Marketing' },
          { name: 'Facebook', displayName: 'Facebook', category: 'Social Media' },
          { name: 'Twitter', displayName: 'Twitter', category: 'Social Media' },
          { name: 'Stripe', displayName: 'Stripe', category: 'Payment' },
          { name: 'HubSpot', displayName: 'HubSpot', category: 'CRM' }
        ];
        
        return {
          success: true,
          count: commonIntegrations.length,
          integrations: commonIntegrations,
          note: 'Free tier - showing common integrations. Full list available with paid plan.'
        };
      } else {
        // Use API key-based integration fetching
        const response = await this.client.get('/nodes');
        
        const integrations = response.data?.map(node => ({
          name: node.name,
          displayName: node.displayName,
          description: node.description,
          version: node.version,
          category: node.category,
          icon: node.icon,
          inputs: node.inputs,
          outputs: node.outputs
        })) || [];
        
        logger.info(`Found ${integrations.length} n8n integrations`);
        
        return {
          success: true,
          count: integrations.length,
          integrations
        };
      }
    } catch (error) {
      logger.error('Error fetching n8n integrations:', error);
      throw new Error(`Failed to fetch n8n integrations: ${error.message}`);
    }
  }

  /**
   * Monitor workflow execution status
   * @param {string} executionId - Execution ID
   * @returns {Promise<Object>} - Execution status
   */
  async getExecutionStatus(executionId) {
    try {
      logger.info(`Checking execution status: ${executionId}`);
      
      if (this.useWebhooks) {
        // For webhook execution, return basic status
        return {
          success: true,
          executionId,
          status: 'completed',
          method: 'webhook',
          note: 'Webhook execution status tracking limited in free tier'
        };
      } else {
        // Use API key-based status checking
        const response = await this.client.get(`/executions/${executionId}`);
        
        return {
          success: true,
          executionId,
          status: response.data?.status,
          data: response.data
        };
      }
    } catch (error) {
      logger.error('Error checking execution status:', error);
      throw new Error(`Failed to check execution status: ${error.message}`);
    }
  }

  /**
   * Generate n8n workflow from S.I.R.I.U.S. AI analysis
   * @param {Object} task - Task to automate
   * @returns {Object} - n8n workflow definition
   */
  generateWorkflowFromTask(task) {
    logger.info('Generating n8n workflow from S.I.R.I.U.S. task', { task });
    
    const workflow = {
      name: `S.I.R.I.U.S. - ${task.name}`,
      nodes: [],
      connections: {},
      active: true,
      settings: {
        executionOrder: 'v1'
      },
      meta: {
        createdBy: 'S.I.R.I.U.S.',
        aiGenerated: true,
        taskType: task.type,
        confidence: task.confidence
      }
    };

    // Generate nodes based on task requirements
    const nodes = this.generateNodesFromTask(task);
    workflow.nodes = nodes;

    // Generate connections between nodes
    workflow.connections = this.generateConnections(nodes);

    return workflow;
  }

  /**
   * Generate nodes for n8n workflow
   * @param {Object} task - Task to automate
   * @returns {Array} - Array of n8n nodes
   */
  generateNodesFromTask(task) {
    const nodes = [];
    let nodeIndex = 0;

    // Add trigger node
    nodes.push({
      id: `trigger-${nodeIndex++}`,
      name: 'S.I.R.I.U.S. Trigger',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [0, 0],
      parameters: {
        httpMethod: 'POST',
        path: `sirius-${task.id}`,
        responseMode: 'responseNode',
        options: {}
      }
    });

    // Add processing nodes based on task type
    switch (task.type) {
      case 'marketing_campaign':
        nodes.push(...this.generateMarketingNodes(task, nodeIndex));
        break;
      case 'content_creation':
        nodes.push(...this.generateContentNodes(task, nodeIndex));
        break;
      case 'customer_onboarding':
        nodes.push(...this.generateOnboardingNodes(task, nodeIndex));
        break;
      case 'trello_workflow':
      case 'trello_task':
        nodes.push(...this.generateTrelloNodes(task, nodeIndex));
        break;
      case 'creative_project':
      case 'artsy_kanban':
        nodes.push(...this.generateCreativeProjectNodes(task, nodeIndex));
        break;
      default:
        nodes.push(...this.generateGenericNodes(task, nodeIndex));
    }

    return nodes;
  }

  /**
   * Generate marketing-specific nodes
   * @param {Object} task - Marketing task
   * @param {number} startIndex - Starting node index
   * @returns {Array} - Marketing nodes
   */
  generateMarketingNodes(task, startIndex) {
    const nodes = [];
    let index = startIndex;

    // Email marketing node
    if (task.platforms?.includes('email')) {
      nodes.push({
        id: `email-${index}`,
        name: 'Email Marketing',
        type: 'n8n-nodes-base.mailchimp',
        typeVersion: 1,
        position: [index * 200, 0],
        parameters: {
          operation: 'createCampaign',
          resource: 'campaign'
        }
      });
      index++;
    }

    // Social media node
    if (task.platforms?.includes('social')) {
      nodes.push({
        id: `social-${index}`,
        name: 'Social Media',
        type: 'n8n-nodes-base.facebook',
        typeVersion: 1,
        position: [index * 200, 0],
        parameters: {
          operation: 'createPost',
          resource: 'page'
        }
      });
      index++;
    }

    // Analytics node
    nodes.push({
      id: `analytics-${index}`,
      name: 'Analytics',
      type: 'n8n-nodes-base.googleAnalytics',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'getReport',
        resource: 'report'
      }
    });

    return nodes;
  }

  /**
   * Generate content creation nodes
   * @param {Object} task - Content task
   * @param {number} startIndex - Starting node index
   * @returns {Array} - Content nodes
   */
  generateContentNodes(task, startIndex) {
    const nodes = [];
    let index = startIndex;

    // Content creation node
    nodes.push({
      id: `content-${index}`,
      name: 'Content Creation',
      type: 'n8n-nodes-base.notion',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'createPage',
        resource: 'page'
      }
    });
    index++;

    // Social scheduling node
    nodes.push({
      id: `schedule-${index}`,
      name: 'Social Scheduling',
      type: 'n8n-nodes-base.buffer',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'createPost',
        resource: 'post'
      }
    });

    return nodes;
  }

  /**
   * Generate customer onboarding nodes
   * @param {Object} task - Onboarding task
   * @param {number} startIndex - Starting node index
   * @returns {Array} - Onboarding nodes
   */
  generateOnboardingNodes(task, startIndex) {
    const nodes = [];
    let index = startIndex;

    // Payment processing
    nodes.push({
      id: `payment-${index}`,
      name: 'Payment Processing',
      type: 'n8n-nodes-base.stripe',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'createPayment',
        resource: 'payment'
      }
    });
    index++;

    // CRM update
    nodes.push({
      id: `crm-${index}`,
      name: 'CRM Update',
      type: 'n8n-nodes-base.hubspot',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'createContact',
        resource: 'contact'
      }
    });
    index++;

    // Welcome email
    nodes.push({
      id: `email-${index}`,
      name: 'Welcome Email',
      type: 'n8n-nodes-base.mailchimp',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'sendEmail',
        resource: 'email'
      }
    });

    return nodes;
  }

  /**
   * Generate generic nodes for unknown task types
   * @param {Object} task - Generic task
   * @param {number} startIndex - Starting node index
   * @returns {Array} - Generic nodes
   */
  generateGenericNodes(task, startIndex) {
    return [{
      id: `generic-${startIndex}`,
      name: 'Generic Task',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 1,
      position: [startIndex * 200, 0],
      parameters: {
        method: 'POST',
        url: 'https://api.example.com/task',
        body: {
          task: task.name,
          description: task.description
        }
      }
    }];
  }

  /**
   * Generate Trello-specific nodes
   * @param {Object} task - Trello task
   * @param {number} startIndex - Starting node index
   * @returns {Array} - Trello nodes
   */
  generateTrelloNodes(task, startIndex) {
    const nodes = [];
    let index = startIndex;

    // Trello card creation node
    nodes.push({
      id: `trello-${index}`,
      name: 'Trello Card Creation',
      type: 'n8n-nodes-base.trello',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'createCard',
        resource: 'card',
        boardId: '{{$json.boardId}}',
        listId: '{{$json.listId}}',
        name: '{{$json.title}}',
        description: '{{$json.description}}'
      }
    });
    index++;

    // Email notification node
    nodes.push({
      id: `email-${index}`,
      name: 'Email Notification',
      type: 'n8n-nodes-base.emailSend',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        toEmail: '{{$json.email}}',
        subject: 'New Trello Card Created: {{$json.title}}',
        text: 'A new card has been created in Trello: {{$json.title}}'
      }
    });
    index++;

    // Slack notification node
    nodes.push({
      id: `slack-${index}`,
      name: 'Slack Notification',
      type: 'n8n-nodes-base.slack',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'postMessage',
        channel: '{{$json.slackChannel}}',
        text: '🎯 New Trello card created: {{$json.title}}'
      }
    });

    return nodes;
  }

  /**
   * Generate creative project nodes for artsy kanban
   * @param {Object} task - Creative project task
   * @param {number} startIndex - Starting node index
   * @returns {Array} - Creative project nodes
   */
  generateCreativeProjectNodes(task, startIndex) {
    const nodes = [];
    let index = startIndex;

    // Trello kanban board node
    nodes.push({
      id: `kanban-${index}`,
      name: 'Creative Kanban Board',
      type: 'n8n-nodes-base.trello',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'createCard',
        resource: 'card',
        boardId: '{{$json.boardId}}',
        listId: '{{$json.listId}}',
        name: '🎨 {{$json.projectName}}',
        description: '**Creative Project:** {{$json.description}}\n\n**Style:** {{$json.style}}\n**Deadline:** {{$json.deadline}}\n**Client:** {{$json.client}}\n\n**Inspiration:** {{$json.inspiration}}',
        labels: '{{$json.labels}}'
      }
    });
    index++;

    // Instagram inspiration node
    nodes.push({
      id: `instagram-${index}`,
      name: 'Instagram Inspiration',
      type: 'n8n-nodes-base.instagram',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'searchMedia',
        resource: 'media',
        query: '{{$json.style}} {{$json.inspiration}}',
        count: 10
      }
    });
    index++;

    // Behance portfolio node
    nodes.push({
      id: `behance-${index}`,
      name: 'Behance Portfolio',
      type: 'n8n-nodes-base.behance',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'searchProjects',
        resource: 'project',
        q: '{{$json.style}}',
        limit: 5
      }
    });
    index++;

    // Email notification with mood board
    nodes.push({
      id: `email-${index}`,
      name: 'Creative Brief Email',
      type: 'n8n-nodes-base.emailSend',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        toEmail: '{{$json.clientEmail}}',
        subject: '🎨 New Creative Project: {{$json.projectName}}',
        text: `Hi {{$json.client}},

I'm excited to start working on your creative project: **{{$json.projectName}}**

**Project Details:**
- Style: {{$json.style}}
- Description: {{$json.description}}
- Deadline: {{$json.deadline}}

**Inspiration Sources:**
- Instagram: {{$json.instagramInspiration}}
- Behance: {{$json.behanceInspiration}}

I'll be updating the kanban board as I progress through the project. You can track the status at any time!

Best regards,
Your Creative Team`
      }
    });
    index++;

    // Slack creative channel notification
    nodes.push({
      id: `slack-${index}`,
      name: 'Creative Team Slack',
      type: 'n8n-nodes-base.slack',
      typeVersion: 1,
      position: [index * 200, 0],
      parameters: {
        operation: 'postMessage',
        channel: '{{$json.slackChannel}}',
        text: `🎨 **New Creative Project Started!**

**Project:** {{$json.projectName}}
**Style:** {{$json.style}}
**Client:** {{$json.client}}
**Deadline:** {{$json.deadline}}

Check the kanban board for updates! ✨`
      }
    });

    return nodes;
  }

  /**
   * Generate connections between nodes
   * @param {Array} nodes - Array of nodes
   * @returns {Object} - Node connections
   */
  generateConnections(nodes) {
    const connections = {};
    
    for (let i = 0; i < nodes.length - 1; i++) {
      const currentNode = nodes[i];
      const nextNode = nodes[i + 1];
      
      if (!connections[currentNode.id]) {
        connections[currentNode.id] = {};
      }
      
      connections[currentNode.id].main = [
        [
          {
            node: nextNode.id,
            type: 'main',
            index: 0
          }
        ]
      ];
    }
    
    return connections;
  }

  /**
   * Test n8n connection
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      logger.info('Testing n8n connection');
      
      const response = await this.client.get('/health');
      
      const isConnected = response.status === 200;
      
      logger.info(`n8n connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      
      return isConnected;
    } catch (error) {
      logger.error('n8n connection test failed:', error);
      return false;
    }
  }

  /**
   * Get workflow statistics
   * @returns {Promise<Object>} - Workflow statistics
   */
  async getWorkflowStats() {
    try {
      logger.info('Fetching n8n workflow statistics');
      
      if (this.useWebhooks) {
        // Return basic stats for free tier
        return {
          success: true,
          stats: {
            total: 'Limited in free tier',
            active: 'Limited in free tier',
            siriusGenerated: 'Limited in free tier'
          },
          note: 'Full statistics available with paid plan'
        };
      } else {
        // Use API key-based statistics
        const response = await this.client.get('/workflows');
        
        const stats = {
          total: response.data?.length || 0,
          active: response.data?.filter(w => w.active).length || 0,
          siriusGenerated: response.data?.filter(w => w.meta?.createdBy === 'S.I.R.I.U.S.').length || 0
        };
        
        logger.info('n8n workflow statistics:', stats);
        
        return {
          success: true,
          stats
        };
      }
    } catch (error) {
      logger.error('Error fetching workflow statistics:', error);
      throw new Error(`Failed to fetch workflow statistics: ${error.message}`);
    }
  }
}

export default new N8nIntegrationService(); 