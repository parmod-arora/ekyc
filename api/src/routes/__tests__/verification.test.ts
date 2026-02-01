import request from 'supertest';
import app from '../../index';
import { store } from '../../store/inMemoryStore';
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpiry,
} from '../../utils/token';

describe('Verification Routes', () => {
  let accessToken: string;
  let userId: string;

  beforeEach(() => {
    store.reset();
    // Create a test user
    const user = store.createUser({
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'password123',
    });
    userId = user.id;

    // Create a session
    accessToken = generateAccessToken();
    const refreshToken = generateRefreshToken();
    store.createSession({
      accessToken,
      refreshToken,
      expiresAt: getAccessTokenExpiry(),
      userId: user.id,
    });
  });

  describe('GET /v1/verification/status', () => {
    it('should return default NOT_STARTED status', async () => {
      const response = await request(app)
        .get('/v1/verification/status')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'NOT_STARTED');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('reasons');
      expect(Array.isArray(response.body.details.reasons)).toBe(true);
    });

    it('should return IN_PROGRESS status after submission', async () => {
      // Submit onboarding first
      const validDraft = {
        profile: {
          fullName: 'Jane Doe',
          dateOfBirth: '1990-05-15',
          nationality: 'US',
        },
        document: {
          documentType: 'PASSPORT',
          documentNumber: 'P12345678',
        },
        address: {
          addressLine1: '123 Main St',
          city: 'Springfield',
          country: 'US',
        },
        consents: {
          termsAccepted: true,
        },
      };

      await request(app)
        .post('/v1/onboarding/submit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ draft: validDraft });

      // Check status
      const response = await request(app)
        .get('/v1/verification/status')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_PROGRESS');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('details');
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app).get('/v1/verification/status');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/v1/verification/status')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
