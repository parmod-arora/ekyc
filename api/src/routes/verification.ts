import { Router, Response } from 'express';
import { store } from '../store/inMemoryStore';
import { AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /v1/verification/status
 * Get current verification status for authenticated user
 */
router.get('/status', (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      },
    });
    return;
  }

  const status = store.getVerificationStatus(userId);
  res.status(200).json(status);
});

export default router;
