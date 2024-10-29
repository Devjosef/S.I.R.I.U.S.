import { Router } from 'express';
import fetch from 'node-fetch';
import { Client as NotionClient } from '@notionhq/client';
import { google } from 'googleapis';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import { storeEmbedding, queryEmbedding } from './pineconeOperations.js'; 

dotenv.config();

const router = Router();

// Define custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Endpoint to create a Trello board
router.post('/create-trello-board', [
  body('boardName').notEmpty().withMessage('Board name is required'),
  body('templateId').notEmpty().withMessage('Template ID is required'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError('Invalid input', errors.array()));
  }

  const { boardName, templateId } = req.body;
  try {
    const response = await fetch(`https://api.trello.com/1/boards/?name=${boardName}&idBoardSource=${templateId}&key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_TOKEN}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new ApiError('Failed to create Trello board', response.status);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Endpoint to create a Notion template
router.post('/create-notion-template', [
  body('templateName').notEmpty().withMessage('Template name is required'),
  body('templateContent').notEmpty().withMessage('Template content is required'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { templateName, templateContent } = req.body;
  const notion = new NotionClient({ auth: process.env.NOTION_API_KEY });
  try {
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        title: [{ text: { content: templateName } }],
      },
      children: templateContent,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Endpoint to create a Google Calendar event
router.post('/create-calendar-event', [
  body('summary').notEmpty().withMessage('Summary is required'),
  body('startDateTime').notEmpty().withMessage('Start date and time are required'),
  body('endDateTime').notEmpty().withMessage('End date and time are required'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { summary, location, description, startDateTime, endDateTime } = req.body;
  const calendar = google.calendar({ version: 'v3', auth: process.env.GOOGLE_API_KEY });
  try {
    const event = {
      summary,
      location,
      description,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
    };
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Endpoint to store an embedding in Pinecone
router.post('/store-embedding', [
  body('text').notEmpty().withMessage('Text is required'),
  body('id').notEmpty().withMessage('ID is required'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { text, id } = req.body;
  try {
    await storeEmbedding(text, { id });
    res.status(200).send('Embedding stored successfully.');
  } catch (error) {
    next(error);
  }
});

// Endpoint to query Pinecone with an embedding
router.post('/query-embedding', [
  body('text').notEmpty().withMessage('Text is required'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { text } = req.body;
  try {
    const matches = await queryEmbedding(text);
    res.status(200).json(matches);
  } catch (error) {
    next(error);
  }
});

// Centralized error handler middleware
router.use((err, _req, res, _next) => {
  console.error('Error stack:', err.stack);
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || 'Internal Server Error';
  const errorDetails = err.details || null; // Possibility to add error details if available.

  res.status(statusCode).json({
    error: errorMessage,
    ...(errorDetails && { details: errorDetails }), // Include error details if they exist.
  });
});

export default router;
