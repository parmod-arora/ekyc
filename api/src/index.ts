import express, { Express } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import onboardingRoutes from './routes/onboarding';
import verificationRoutes from './routes/verification';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { correlationIdMiddleware } from './middleware/correlationId';
import { requestLogger } from './middleware/requestLogger';
import { store } from './store/inMemoryStore';
import logger from './utils/logger';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware (must be early in the chain)
app.use(correlationIdMiddleware);
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Public routes
app.use('/v1/auth', authRoutes);

// Protected routes
app.use('/v1/me', authenticate, userRoutes);
app.use('/v1/onboarding', authenticate, onboardingRoutes);
app.use('/v1/verification', authenticate, verificationRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Initialize with sample data
function initializeSampleData(): void {
  // Create a sample user for testing
  const sampleUser = store.createUser({
    email: 'jane.doe@example.com',
    fullName: 'Jane Doe',
    password: 'password123',
  });

  logger.info('Sample user created', {
    userId: sampleUser.id,
    email: sampleUser.email,
  });
}

// Start server
if (require.main === module) {
  initializeSampleData();
  app.listen(PORT, () => {
    logger.info('Server started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
    });
  });
}

export default app;
