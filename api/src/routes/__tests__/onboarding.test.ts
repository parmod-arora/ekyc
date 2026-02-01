import request from 'supertest';
import app from '../../index';
import { store } from '../../store/inMemoryStore';
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpiry,
} from '../../utils/token';

describe('Onboarding Routes', () => {
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

  describe('POST /v1/onboarding/submit', () => {
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

    it('should submit onboarding successfully', async () => {
      const response = await request(app)
        .post('/v1/onboarding/submit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          draft: validDraft,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('submissionId');
      expect(response.body).toHaveProperty('status', 'RECEIVED');
      expect(response.body.submissionId).toMatch(/^SUB-\d+$/);

      // Verify verification status was set
      const status = store.getVerificationStatus(userId);
      expect(status.status).toBe('IN_PROGRESS');
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .post('/v1/onboarding/submit')
        .send({
          draft: validDraft,
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 with missing profile', async () => {
      const response = await request(app)
        .post('/v1/onboarding/submit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          draft: {
            document: validDraft.document,
            address: validDraft.address,
            consents: validDraft.consents,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.fieldErrors).toBeDefined();
      expect(response.body.error.details.fieldErrors['draft.profile']).toBeDefined();
    });

    it('should return 400 with invalid date format', async () => {
      const response = await request(app)
        .post('/v1/onboarding/submit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          draft: {
            ...validDraft,
            profile: {
              ...validDraft.profile,
              dateOfBirth: '15-05-1990', // Wrong format
            },
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 with invalid document type', async () => {
      const response = await request(app)
        .post('/v1/onboarding/submit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          draft: {
            ...validDraft,
            document: {
              documentType: 'INVALID_TYPE',
              documentNumber: 'P12345678',
            },
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 with terms not accepted', async () => {
      const response = await request(app)
        .post('/v1/onboarding/submit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          draft: {
            ...validDraft,
            consents: {
              termsAccepted: false,
            },
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 with missing required fields', async () => {
      const response = await request(app)
        .post('/v1/onboarding/submit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          draft: {
            profile: {
              fullName: 'Jane Doe',
              // Missing dateOfBirth and nationality
            },
            document: validDraft.document,
            address: validDraft.address,
            consents: validDraft.consents,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 with fieldErrors shape containing specific field paths and messages', async () => {
      const response = await request(app)
        .post('/v1/onboarding/submit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          draft: {
            profile: {
              fullName: 'Jane Doe',
              // Missing dateOfBirth and nationality
            },
            document: {
              documentType: 'INVALID_TYPE',
              // Missing documentNumber
            },
            address: {
              // Missing addressLine1, city, country
            },
            consents: {
              termsAccepted: false,
            },
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBeDefined();
      expect(response.body.error.details).toBeDefined();
      expect(response.body.error.details.fieldErrors).toBeDefined();
      expect(typeof response.body.error.details.fieldErrors).toBe('object');

      const fieldErrors = response.body.error.details.fieldErrors;
      
      // Verify fieldErrors is an object with string keys and string values
      expect(Object.keys(fieldErrors).length).toBeGreaterThan(0);
      Object.keys(fieldErrors).forEach((fieldPath) => {
        expect(typeof fieldPath).toBe('string');
        expect(typeof fieldErrors[fieldPath]).toBe('string');
        expect(fieldErrors[fieldPath].length).toBeGreaterThan(0);
      });

      // Verify specific field paths exist (using dot notation for nested fields)
      const fieldPaths = Object.keys(fieldErrors);
      
      // Should have errors for missing/invalid fields
      // Check for profile fields
      const profileFields = fieldPaths.filter((path) => path.startsWith('draft.profile.'));
      expect(profileFields.length).toBeGreaterThan(0);
      
      // Verify field paths use dot notation for nested fields
      profileFields.forEach((path) => {
        expect(path).toMatch(/^draft\.profile\./);
      });
    });
  });
});
