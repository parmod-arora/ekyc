import { store } from '../inMemoryStore';
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpiry,
} from '../../utils/token';

describe('InMemoryStore', () => {
  beforeEach(() => {
    store.reset();
  });

  describe('User operations', () => {
    it('should create and retrieve user', () => {
      const user = store.createUser({
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123',
      });

      expect(user.id).toMatch(/^USR-\d+$/);
      expect(user.email).toBe('test@example.com');

      const retrieved = store.getUserById(user.id);
      expect(retrieved).toEqual(user);
    });

    it('should find user by email', () => {
      const user = store.createUser({
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123',
      });

      const found = store.getUserByEmail('test@example.com');
      expect(found).toEqual(user);
    });

    it('should return undefined for non-existent user', () => {
      expect(store.getUserById('USR-999')).toBeUndefined();
      expect(store.getUserByEmail('nonexistent@example.com')).toBeUndefined();
    });
  });

  describe('Session operations', () => {
    it('should create and retrieve session', () => {
      const userId = 'USR-001';
      const session = {
        accessToken: generateAccessToken(),
        refreshToken: generateRefreshToken(),
        expiresAt: getAccessTokenExpiry(),
        userId,
      };

      store.createSession(session);

      const retrieved = store.getSessionByAccessToken(session.accessToken);
      expect(retrieved).toEqual(session);
    });

    it('should find session by refresh token', () => {
      const userId = 'USR-001';
      const session = {
        accessToken: generateAccessToken(),
        refreshToken: generateRefreshToken(),
        expiresAt: getAccessTokenExpiry(),
        userId,
      };

      store.createSession(session);

      const retrieved = store.getSessionByRefreshToken(session.refreshToken);
      expect(retrieved).toEqual(session);
    });

    it('should delete session', () => {
      const userId = 'USR-001';
      const session = {
        accessToken: generateAccessToken(),
        refreshToken: generateRefreshToken(),
        expiresAt: getAccessTokenExpiry(),
        userId,
      };

      store.createSession(session);
      store.deleteSession(session.accessToken);

      expect(store.getSessionByAccessToken(session.accessToken)).toBeUndefined();
      expect(
        store.getSessionByRefreshToken(session.refreshToken)
      ).toBeUndefined();
    });

    it('should update session', () => {
      const userId = 'USR-001';
      const oldSession = {
        accessToken: generateAccessToken(),
        refreshToken: generateRefreshToken(),
        expiresAt: getAccessTokenExpiry(),
        userId,
      };

      store.createSession(oldSession);

      const newSession = {
        accessToken: generateAccessToken(),
        refreshToken: generateRefreshToken(),
        expiresAt: getAccessTokenExpiry(),
        userId,
      };

      store.updateSession(oldSession.accessToken, newSession);

      expect(store.getSessionByAccessToken(oldSession.accessToken)).toBeUndefined();
      expect(store.getSessionByAccessToken(newSession.accessToken)).toEqual(
        newSession
      );
    });
  });

  describe('Onboarding operations', () => {
    it('should save and retrieve onboarding draft', () => {
      const userId = 'USR-001';
      const draft = {
        profile: {
          fullName: 'Jane Doe',
          dateOfBirth: '1990-05-15',
          nationality: 'US',
        },
        document: {
          documentType: 'PASSPORT' as const,
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

      store.saveOnboardingDraft(userId, draft);
      const retrieved = store.getOnboardingDraft(userId);

      expect(retrieved).toEqual(draft);
    });
  });

  describe('Verification status operations', () => {
    it('should return default status for new user', () => {
      const userId = 'USR-001';
      const status = store.getVerificationStatus(userId);

      expect(status.status).toBe('NOT_STARTED');
      expect(status).toHaveProperty('updatedAt');
      expect(status).toHaveProperty('details');
    });

    it('should set and retrieve verification status', () => {
      const userId = 'USR-001';
      const status = {
        status: 'IN_PROGRESS' as const,
        updatedAt: new Date().toISOString(),
        details: {
          reasons: [],
        },
      };

      store.setVerificationStatus(userId, status);
      const retrieved = store.getVerificationStatus(userId);

      expect(retrieved.status).toBe('IN_PROGRESS');
    });
  });

  describe('Utility functions', () => {
    it('should generate unique submission IDs', () => {
      const id1 = store.generateSubmissionId();
      const id2 = store.generateSubmissionId();

      expect(id1).toMatch(/^SUB-\d+$/);
      expect(id2).toMatch(/^SUB-\d+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
