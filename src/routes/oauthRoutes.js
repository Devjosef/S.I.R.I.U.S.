/**
 * OAuth Routes
 * 
 * Handles Google OAuth 2.0 authentication flow
 */

import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const oauthLogger = logger.child({ component: 'oauth-routes' });

// File-based storage for OAuth tokens
const TOKENS_FILE = path.join(process.cwd(), 'data', 'oauth-tokens.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.dirname(TOKENS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Load tokens from file
const loadTokens = async () => {
  try {
    await ensureDataDir();
    const data = await fs.readFile(TOKENS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
};

// Save tokens to file
const saveTokens = async (tokens) => {
  await ensureDataDir();
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
};

// In-memory cache for performance
let userTokens = new Map();

// Load tokens on startup
(async () => {
  try {
    const tokens = await loadTokens();
    userTokens = new Map(Object.entries(tokens));
    oauthLogger.info('OAuth tokens loaded from file');
  } catch (error) {
    oauthLogger.error({ err: error }, 'Failed to load OAuth tokens');
  }
})();

/**
 * Generate OAuth URL for Google authentication
 * GET /api/oauth/google/url
 */
router.get('/google/url', (req, res) => {
  try {
    const oauth2Client = new OAuth2Client(
      config.GOOGLE.CLIENT_ID,
      config.GOOGLE.CLIENT_SECRET,
      'http://localhost:3000/api/oauth/google/callback'
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    oauthLogger.error({ err: error }, 'Failed to generate OAuth URL');
    res.status(500).json({
      success: false,
      message: 'Failed to generate OAuth URL',
      error: error.message
    });
  }
});

/**
 * Handle OAuth callback from Google
 * GET /api/oauth/google/callback
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const userId = req.query.state || 'default-user';

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    const oauth2Client = new OAuth2Client(
      config.GOOGLE.CLIENT_ID,
      config.GOOGLE.CLIENT_SECRET,
      'http://localhost:3000/api/oauth/google/callback'
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens for the user
    userTokens.set(userId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    });

    // Save tokens to file
    const tokensObj = Object.fromEntries(userTokens);
    await saveTokens(tokensObj);

    oauthLogger.info({ userId }, 'OAuth tokens stored successfully');

    res.json({
      success: true,
      message: 'Authentication successful',
      userId: userId
    });
  } catch (error) {
    oauthLogger.error({ err: error }, 'OAuth callback failed');
    res.status(500).json({
      success: false,
      message: 'OAuth callback failed',
      error: error.message
    });
  }
});

/**
 * Get OAuth client with stored tokens
 * @param {string} userId - User identifier
 * @returns {OAuth2Client|null} - OAuth client or null if not authenticated
 */
export const getOAuthClient = (userId = 'default-user') => {
  const tokens = userTokens.get(userId);
  
  if (!tokens) {
    return null;
  }

  const oauth2Client = new OAuth2Client(
    config.GOOGLE.CLIENT_ID,
    config.GOOGLE.CLIENT_SECRET,
    'http://localhost:3000/api/oauth/google/callback'
  );

  oauth2Client.setCredentials(tokens);
  return oauth2Client;
};

/**
 * Check if user is authenticated
 * GET /api/oauth/google/status
 */
router.get('/google/status', (req, res) => {
  const userId = req.query.userId || 'default-user';
  const isAuthenticated = userTokens.has(userId);

  res.json({
    success: true,
    authenticated: isAuthenticated,
    userId: userId
  });
});

export default router; 