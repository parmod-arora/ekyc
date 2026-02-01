import { Router, Response } from 'express';
import { store } from '../store/inMemoryStore';
import { AuthRequest } from '../middleware/auth';
import { RequestWithCorrelation } from '../middleware/correlationId';
import { createLogger } from '../utils/logger';

const router = Router();

/**
 * GET /v1/verification/status
 * Get current verification status for authenticated user
 */
router.get('/status', (req: AuthRequest & RequestWithCorrelation, res: Response) => {
  const userId = req.userId;
  const correlationId = req.correlationId || 'unknown';
  const logger = createLogger({ correlationId, userId: userId || 'anonymous' });

  if (!userId) {
    logger.warn('Get verification status failed - not authenticated');
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      },
    });
    return;
  }

  const status = store.getVerificationStatus(userId);
  
  logger.info('Verification status retrieved', {
    userId,
    status: status.status,
  });

  res.status(200).json(status);
});

export default router;
