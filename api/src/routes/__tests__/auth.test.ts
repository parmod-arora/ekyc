import request from 'supertest';
import app from '../../index';
import { store } from '../../store/inMemoryStore';

describe('Auth Routes', () => {
  beforeEach(() => {
    store.reset();
    // Create a test user
    store.createUser({
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'password123',
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('session');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.session).toHaveProperty('accessToken');
      expect(response.body.session).toHaveProperty('refreshToken');
      expect(response.body.session).toHaveProperty('expiresAt');
    });

    it('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 with non-existent user', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 400 with invalid email format', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.fieldErrors).toHaveProperty('email');
    });

    it('should return 400 with missing password', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.fieldErrors).toHaveProperty('password');
    });
  });

  describe('POST /v1/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // First login to get tokens
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const { refreshToken } = loginResponse.body.session;

      // Refresh the token
      const refreshResponse = await request(app)
        .post('/v1/auth/refresh')
        .send({
          refreshToken,
        });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty('session');
      expect(refreshResponse.body.session).toHaveProperty('accessToken');
      expect(refreshResponse.body.session).toHaveProperty('refreshToken');
      expect(refreshResponse.body.session).toHaveProperty('expiresAt');
      // New tokens should be different
      expect(refreshResponse.body.session.accessToken).not.toBe(
        loginResponse.body.session.accessToken
      );
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/v1/auth/refresh')
        .send({
          refreshToken: 'invalid_refresh_token',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should return 400 with missing refresh token', async () => {
      const response = await request(app)
        .post('/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
