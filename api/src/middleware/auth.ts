import { Request, Response, NextFunction } from 'express';
import { store } from '../store/inMemoryStore';
import { isTokenExpired } from '../utils/token';
import { createLogger } from '../utils/logger';
import { RequestWithCorrelation } from './correlationId';

export interface AuthRequest extends Request {
  userId?: string;
  session?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
}

/**
 * Authentication middleware
 * Validates the access token and attaches user info to request
 */
export function authenticate(
  req: AuthRequest & RequestWithCorrelation,
  res: Response,
  next: NextFunction
): void {
  const correlationId = req.correlationId || 'unknown';
  const logger = createLogger({ correlationId });

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed - missing or invalid authorization header', {
        path: req.path,
        method: req.method,
      });
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
      return;
    }

    const accessToken = authHeader.substring(7);
    const session = store.getSessionByAccessToken(accessToken);

    if (!session) {
      logger.warn('Authentication failed - invalid access token', {
        path: req.path,
        method: req.method,
      });
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
      return;
    }

    if (isTokenExpired(session.expiresAt)) {
      logger.warn('Authentication failed - token expired', {
        path: req.path,
        method: req.method,
        userId: session.userId,
      });
      res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        },
      });
      return;
    }

    // Attach user info to request
    req.userId = session.userId;
    req.session = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    };

    logger.debug('Authentication successful', {
      userId: session.userId,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.error('Authentication error', {
      path: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
      },
    });
  }
}
