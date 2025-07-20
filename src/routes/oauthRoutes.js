/**
 * OAuth Routes - Authentication Endpoints
 * 
 * Handles OAuth authentication flows for Google Workspace
 * and other platform integrations.
 * 
 * Lines: 120
 */

// Express routing and validation
import { Router } from 'express';
import { body, query } from 'express-validator';

// Validation middleware
import validate from '../middleware/validator.js';

const router = Router();

/**
 * Google OAuth authorization URL
 * GET /api/oauth/google/authorize
 */
router.get('/google/authorize', [
  query('redirect_uri').notEmpty().withMessage('redirect_uri is required'),
  validate
], (req, res) => {
  try {
    const { redirect_uri } = req.query;
    
    // Google OAuth scopes for S.I.R.I.U.S. integrations
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly'
    ];
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirect_uri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    res.json({
      success: true,
      message: 'Google OAuth authorization URL generated',
      data: {
        authUrl,
        scopes
      }
    });
    
  } catch (error) {
    console.error('Error generating Google OAuth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate OAuth URL',
      details: error.message
    });
  }
});

/**
 * Google OAuth callback
 * POST /api/oauth/google/callback
 */
router.post('/google/callback', [
  body('code').notEmpty().withMessage('Authorization code is required'),
  body('redirect_uri').notEmpty().withMessage('redirect_uri is required'),
  validate
], async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`OAuth token exchange failed: ${tokenResponse.status}`);
    }
    
    const tokens = await tokenResponse.json();
    
    res.json({
      success: true,
      message: 'OAuth authentication successful',
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type
      }
    });
    
  } catch (error) {
    console.error('Error processing OAuth callback:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth authentication failed',
      details: error.message
    });
  }
});

/**
 * Refresh Google OAuth token
 * POST /api/oauth/google/refresh
 */
router.post('/google/refresh', [
  body('refresh_token').notEmpty().withMessage('Refresh token is required'),
  validate
], async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token,
        grant_type: 'refresh_token'
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token refresh failed: ${tokenResponse.status}`);
    }
    
    const tokens = await tokenResponse.json();
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        access_token: tokens.access_token,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type
      }
    });
    
  } catch (error) {
    console.error('Error refreshing OAuth token:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      details: error.message
    });
  }
});

/**
 * Revoke Google OAuth token
 * POST /api/oauth/google/revoke
 */
router.post('/google/revoke', [
  body('token').notEmpty().withMessage('Token is required'),
  validate
], async (req, res) => {
  try {
    const { token } = req.body;
    
    const revokeResponse = await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token
      })
    });
    
    if (!revokeResponse.ok) {
      throw new Error(`Token revocation failed: ${revokeResponse.status}`);
    }
    
    res.json({
      success: true,
      message: 'Token revoked successfully'
    });
    
  } catch (error) {
    console.error('Error revoking OAuth token:', error);
    res.status(500).json({
      success: false,
      error: 'Token revocation failed',
      details: error.message
    });
  }
});

export default router;