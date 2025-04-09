/**
 * Legacy support utilities for maintaining backward compatibility
 * with older API endpoints while transitioning to the new structure.
 */

import { ValidationError } from '../middleware/errorHandler.js';

/**
 * Creates a wrapper for legacy routes to map them to new routes
 * with appropriate warnings about deprecation
 * 
 * @param {Object} options Configuration options
 * @param {string} options.legacyPath The original API path
 * @param {string} options.newPath The new API path
 * @param {Function} options.handler The handler function for the new endpoint
 * @param {string} options.version Version when the endpoint will be removed
 * @returns {Function} Express middleware function
 */
export const createLegacyRouteWrapper = (options) => {
  const { legacyPath, newPath, handler, version = 'v2.0.0' } = options;
  
  return async (req, res, next) => {
    try {
      // Log deprecation warning
      console.warn(`[DEPRECATED] The endpoint ${legacyPath} is deprecated and will be removed in version ${version}. Please use ${newPath} instead.`);
      
      // Add deprecation header
      res.setHeader('X-Deprecated', `true`);
      res.setHeader('X-Deprecated-Replace', `${newPath}`);
      
      // Call the handler
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Maps old request format to new format
 * 
 * @param {Object} legacyMapping Mapping of old fields to new fields
 * @returns {Function} Express middleware function
 */
export const mapLegacyRequest = (legacyMapping) => {
  return (req, res, next) => {
    try {
      // Create a backup of the original body
      req.originalBody = { ...req.body };
      
      // Map old fields to new fields
      Object.entries(legacyMapping).forEach(([oldField, newField]) => {
        if (req.body[oldField] !== undefined) {
          req.body[newField] = req.body[oldField];
        }
      });
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  createLegacyRouteWrapper,
  mapLegacyRequest
}; 