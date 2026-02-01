import { Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { formatValidationError } from '../utils/validation';
import { ApiError } from '../types';
import { createLogger } from '../utils/logger';
import { RequestWithCorrelation } from './correlationId';
import { AuthRequest } from './auth';

export interface ErrorRequest extends RequestWithCorrelation, AuthRequest {}

/**
 * Global error handler middleware
 * Ensures all errors follow the consistent API error format
 */
export function errorHandler(
  err: Error | ZodError,
  req: ErrorRequest,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req.correlationId || 'unknown';
  const userId = req.userId || 'anonymous';
  const logger = createLogger({ correlationId, userId });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const apiError = formatValidationError(err);
    logger.warn('Validation error', {
      path: req.path,
      method: req.method,
      errors: err.errors,
    });
    res.status(400).json({ error: apiError });
    return;
  }

  // Handle known API errors
  if (err.name === 'ApiError') {
    const apiError = err as unknown as { error: ApiError };
    logger.warn('API error', {
      path: req.path,
      method: req.method,
      error: apiError.error,
    });
    res.status(400).json(apiError);
    return;
  }

  // Handle unknown errors (don't leak stack traces)
  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
    },
  });
}
