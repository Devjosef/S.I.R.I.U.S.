import { validationResult } from 'express-validator';
import { ValidationError } from './errorHandler.js';

/**
 * Middleware that validates request using express-validator
 * Throws ValidationError if validation fails
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map(err => ({
    [err.path]: err.msg
  }));

  throw new ValidationError('Validation failed', extractedErrors);
};

export default validate; 