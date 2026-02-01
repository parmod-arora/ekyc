import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { store } from '../store/inMemoryStore';
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpiry,
} from '../utils/token';
import { loginSchema, refreshSchema } from '../utils/validation';
import { LoginResponse, RefreshResponse } from '../types';

const router = Router();

/**
 * POST /v1/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    // Find user by email
    const user = store.getUserByEmail(email);
    if (!user || user.password !== password) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken();
    const refreshToken = generateRefreshToken();
    const expiresAt = getAccessTokenExpiry();

    // Create session
    const session = {
      accessToken,
      refreshToken,
      expiresAt,
      userId: user.id,
    };
    store.createSession(session);

    // Return response
    const response: LoginResponse = {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      session: {
        accessToken,
        refreshToken,
        expiresAt,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: {
            fieldErrors: Object.fromEntries(
              error.errors.map((e) => [e.path.join('.'), e.message])
            ),
          },
        },
      });
      return;
    }
    throw error;
  }
});

/**
 * POST /v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validated = refreshSchema.parse(req.body);
    const { refreshToken } = validated;

    // Find session by refresh token
    const session = store.getSessionByRefreshToken(refreshToken);
    if (!session) {
      res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
      return;
    }

    // Check if refresh token is expired (optional - you might want to check this)
    // For simplicity, we'll just generate a new session

    // Generate new tokens
    const newAccessToken = generateAccessToken();
    const newRefreshToken = generateRefreshToken();
    const newExpiresAt = getAccessTokenExpiry();

    // Update session
    const newSession = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
      userId: session.userId,
    };
    store.updateSession(session.accessToken, newSession);

    // Return response
    const response: RefreshResponse = {
      session: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: {
            fieldErrors: Object.fromEntries(
              error.errors.map((e) => [e.path.join('.'), e.message])
            ),
          },
        },
      });
      return;
    }
    throw error;
  }
});

export default router;
