import { Router, Response } from 'express';
import { z } from 'zod';
import { store } from '../store/inMemoryStore';
import { submitOnboardingSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';
import { RequestWithCorrelation } from '../middleware/correlationId';
import { SubmitOnboardingResponse } from '../types';
import { createLogger } from '../utils/logger';

const router = Router();

/**
 * POST /v1/onboarding/submit
 * Submit onboarding draft for verification
 */
router.post('/submit', (req: AuthRequest & RequestWithCorrelation, res: Response) => {
  const userId = req.userId;
  const correlationId = req.correlationId || 'unknown';
  const logger = createLogger({ correlationId, userId: userId || 'anonymous' });

  try {
    if (!userId) {
      logger.warn('Onboarding submit failed - not authenticated');
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    // Validate request
    const validated = submitOnboardingSchema.parse(req.body);
    const { draft } = validated;

    logger.info('Onboarding submission started', {
      userId,
      documentType: draft.document.documentType,
    });

    // Save draft (optional - for resume functionality)
    store.saveOnboardingDraft(userId, draft);

    // Generate submission ID
    const submissionId = store.generateSubmissionId();

    // Set verification status to IN_PROGRESS
    const verificationStatus = {
      status: 'IN_PROGRESS' as const,
      updatedAt: new Date().toISOString(),
      details: {
        reasons: [],
      },
    };
    store.setVerificationStatus(userId, verificationStatus);

    logger.info('Onboarding submission completed', {
      userId,
      submissionId,
      status: 'IN_PROGRESS',
    });

    // Return response
    const response: SubmitOnboardingResponse = {
      submissionId,
      status: 'RECEIVED',
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
