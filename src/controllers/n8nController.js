/**
 * n8n Controller
 * 
 * Handles n8n workflow operations for S.I.R.I.U.S.
 * Manages AI-driven workflow execution and creation
 */

import n8nService from '../services/n8nIntegrationService.js';
import logger from '../utils/logger.js';

/**
 * Execute n8n workflow
 * POST /api/n8n/workflows/:workflowId/execute
 */
export const executeWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const context = req.body;
    
    logger.info(`Executing n8n workflow: ${workflowId}`, { context });
    
    const result = await n8nService.executeWorkflow(workflowId, context);
    
    res.json({
      success: true,
      message: 'n8n workflow executed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error executing n8n workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute n8n workflow'
    });
  }
};

/**
 * Create new n8n workflow
 * POST /api/n8n/workflows
 */
export const createWorkflow = async (req, res) => {
  try {
    const workflowDefinition = req.body;
    
    logger.info('Creating n8n workflow from S.I.R.I.U.S.', { workflowDefinition });
    
    const result = await n8nService.createWorkflow(workflowDefinition);
    
    res.status(201).json({
      success: true,
      message: 'n8n workflow created successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error creating n8n workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create n8n workflow'
    });
  }
};

/**
 * Get available n8n integrations
 * GET /api/n8n/integrations
 */
export const getIntegrations = async (req, res) => {
  try {
    logger.info('Fetching n8n integrations');
    
    const result = await n8nService.getIntegrations();
    
    res.json({
      success: true,
      message: 'n8n integrations retrieved successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error fetching n8n integrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch n8n integrations'
    });
  }
};

/**
 * Get execution status
 * GET /api/n8n/executions/:executionId
 */
export const getExecutionStatus = async (req, res) => {
  try {
    const { executionId } = req.params;
    
    logger.info(`Checking execution status: ${executionId}`);
    
    const result = await n8nService.getExecutionStatus(executionId);
    
    res.json({
      success: true,
      message: 'Execution status retrieved successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error checking execution status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check execution status'
    });
  }
};

/**
 * Test n8n connection
 * GET /api/n8n/test
 */
export const testConnection = async (req, res) => {
  try {
    logger.info('Testing n8n connection');
    
    const isConnected = await n8nService.testConnection();
    
    res.json({
      success: true,
      message: isConnected ? 'n8n connection successful' : 'n8n connection failed',
      data: {
        connected: isConnected,
        baseUrl: n8nService.baseUrl
      }
    });
  } catch (error) {
    logger.error('Error testing n8n connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test n8n connection'
    });
  }
};

/**
 * Get workflow statistics
 * GET /api/n8n/stats
 */
export const getWorkflowStats = async (req, res) => {
  try {
    logger.info('Fetching n8n workflow statistics');
    
    const result = await n8nService.getWorkflowStats();
    
    res.json({
      success: true,
      message: 'Workflow statistics retrieved successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error fetching workflow statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow statistics'
    });
  }
};

/**
 * Generate workflow from S.I.R.I.U.S. task
 * POST /api/n8n/generate
 */
export const generateWorkflow = async (req, res) => {
  try {
    const task = req.body;
    
    logger.info('Generating n8n workflow from S.I.R.I.U.S. task', { task });
    
    const workflowDefinition = n8nService.generateWorkflowFromTask(task);
    
    res.json({
      success: true,
      message: 'n8n workflow generated successfully',
      data: workflowDefinition
    });
  } catch (error) {
    logger.error('Error generating n8n workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate n8n workflow'
    });
  }
};

/**
 * Create and execute workflow from task
 * POST /api/n8n/auto-execute
 */
export const autoExecuteWorkflow = async (req, res) => {
  try {
    const task = req.body;
    
    logger.info('Auto-executing n8n workflow from S.I.R.I.U.S. task', { task });
    
    // Generate workflow from task
    const workflowDefinition = n8nService.generateWorkflowFromTask(task);
    
    // Create workflow in n8n
    const createResult = await n8nService.createWorkflow(workflowDefinition);
    
    // Execute the workflow
    const executeResult = await n8nService.executeWorkflow(createResult.workflowId, {
      task,
      decision: 'AI-generated workflow execution',
      confidence: task.confidence || 0.8,
      learning: 'Automated workflow creation and execution'
    });
    
    res.json({
      success: true,
      message: 'n8n workflow auto-executed successfully',
      data: {
        workflow: createResult,
        execution: executeResult
      }
    });
  } catch (error) {
    logger.error('Error auto-executing n8n workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-execute n8n workflow'
    });
  }
}; 