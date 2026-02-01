import { Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import { RequestWithCorrelation } from './correlationId';
import { AuthRequest } from './auth';

export interface LoggedRequest extends RequestWithCorrelation, AuthRequest {}

/**
 * Request logging middleware
 * Logs all incoming requests with correlation ID, user ID, method, path, and response time
 */
export function requestLogger(
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const correlationId = req.correlationId || 'unknown';
  const userId = req.userId || 'anonymous';

  const logger = createLogger({ correlationId, userId });

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    url: req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (body: unknown) {
    const duration = Date.now() - startTime;
    const logData: Record<string, unknown> = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };

    // Log response
    if (res.statusCode >= 400) {
      logger.error('Request completed with error', logData);
    } else {
      logger.info('Request completed successfully', logData);
    }

    return originalSend.call(this, body);
  };

  next();
}

