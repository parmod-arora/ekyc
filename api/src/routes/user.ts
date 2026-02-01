import { Router, Response } from 'express';
import { store } from '../store/inMemoryStore';
import { AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /v1/me
 * Get current authenticated user
 */
router.get('/me', (req: AuthRequest, res: Response) => {
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

  const user = store.getUserById(userId);
  if (!user) {
    res.status(404).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    });
    return;
  }

  res.status(200).json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
  });
});

export default router;
