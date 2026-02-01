import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { formatValidationError } from '../utils/validation';
import { ApiError } from '../types';

/**
 * Global error handler middleware
 * Ensures all errors follow the consistent API error format
 */
export function errorHandler(
  err: Error | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const apiError = formatValidationError(err);
    res.status(400).json({ error: apiError });
    return;
  }

  // Handle known API errors
  if (err.name === 'ApiError') {
    const apiError = err as unknown as { error: ApiError };
    res.status(400).json(apiError);
    return;
  }

  // Handle unknown errors (don't leak stack traces)
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
    },
  });
}
