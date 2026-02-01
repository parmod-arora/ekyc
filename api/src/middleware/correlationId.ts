import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithCorrelation extends Request {
  correlationId?: string;
}

/**
 * Middleware to generate and attach correlation ID to requests
 * Correlation ID is used to track requests across the system
 */
export function correlationIdMiddleware(
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction
): void {
  // Get correlation ID from header or generate new one
  const correlationId =
    (req.headers['x-correlation-id'] as string) || uuidv4();

  // Attach to request
  req.correlationId = correlationId;

  // Add to response header for client tracking
  res.setHeader('X-Correlation-Id', correlationId);

  next();
}
