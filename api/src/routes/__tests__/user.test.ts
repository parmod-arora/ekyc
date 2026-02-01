import request from 'supertest';
import app from '../../index';
import { store } from '../../store/inMemoryStore';
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpiry,
} from '../../utils/token';

describe('User Routes', () => {
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

  describe('GET /v1/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/v1/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('fullName', 'Test User');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without authorization header', async () => {
      const response = await request(app).get('/v1/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/v1/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with expired token', async () => {
      // Create an expired session
      const expiredToken = generateAccessToken();
      store.createSession({
        accessToken: expiredToken,
        refreshToken: generateRefreshToken(),
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
        userId,
      });

      const response = await request(app)
        .get('/v1/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });
});
