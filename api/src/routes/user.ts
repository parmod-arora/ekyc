import { Router, Response } from 'express';
import { store } from '../store/inMemoryStore';
import { AuthRequest } from '../middleware/auth';
import { RequestWithCorrelation } from '../middleware/correlationId';
import { createLogger } from '../utils/logger';

const router = Router();

/**
 * GET /v1/me
 * Get current authenticated user
 */
router.get('/', (req: AuthRequest & RequestWithCorrelation, res: Response) => {
  const userId = req.userId;
  const correlationId = req.correlationId || 'unknown';
  const logger = createLogger({ correlationId, userId: userId || 'anonymous' });

  if (!userId) {
    logger.warn('Get user failed - not authenticated');
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      },
    });
    return;
  }

  const user = store.getUserById(userId);
  if (!user) {
    logger.warn('Get user failed - user not found', { userId });
    res.status(404).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    });
    return;
  }

  logger.info('User retrieved successfully', { userId });

  res.status(200).json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
  });
});

export default router;
