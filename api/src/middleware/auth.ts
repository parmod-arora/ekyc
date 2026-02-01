import { Request, Response, NextFunction } from 'express';
import { store } from '../store/inMemoryStore';
import { isTokenExpired } from '../utils/token';

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
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
      return;
    }

    if (isTokenExpired(session.expiresAt)) {
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

    next();
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
      },
    });
  }
}
