/**
 * Tests for Auth Store - Session state transitions and refresh-then-retry behavior
 * 
 * This test suite verifies:
 * 1. Auth state transitions (logged_out -> logging_in -> logged_in)
 * 2. Refresh session behavior
 * 3. Session expiry handling
 * 4. Logout on refresh failure
 */

// Mock dependencies before imports
const mockApiService = {
  login: jest.fn(),
  refreshToken: jest.fn(),
  setAuthToken: jest.fn(),
  getCurrentUser: jest.fn(),
  submitOnboarding: jest.fn(),
  getVerificationStatus: jest.fn(),
};

const mockSessionStorage = {
  save: jest.fn(),
  remove: jest.fn(),
  load: jest.fn(),
};

jest.mock('../../services/api', () => ({
  apiService: mockApiService,
}));

jest.mock('../../utils/storage', () => ({
  sessionStorage: mockSessionStorage,
}));

import { useAuthStore } from '../authStore';

describe('Auth Store - Session State Transitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useAuthStore.setState({
      status: 'logged_out',
      user: null,
      session: null,
      error: null,
    });
  });

  describe('Login flow', () => {
    it('should transition from logged_out to logging_in to logged_in on successful login', async () => {
      const mockUser = {
        id: 'USR-001',
        email: 'test@example.com',
        fullName: 'Test User',
      };

      const mockSession = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      mockApiService.login.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });
      mockSessionStorage.save.mockResolvedValue(undefined);
      mockApiService.setAuthToken.mockImplementation(() => {});

      // Initial state
      expect(useAuthStore.getState().status).toBe('logged_out');

      // Start login
      await useAuthStore.getState().login('test@example.com', 'password123');

      // Should transition to logged_in
      const state = useAuthStore.getState();
      expect(state.status).toBe('logged_in');
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
      expect(state.error).toBeNull();
      expect(mockApiService.setAuthToken).toHaveBeenCalledWith('access_token_123');
      expect(mockSessionStorage.save).toHaveBeenCalledWith(JSON.stringify(mockSession));
    });

    it('should transition to logged_out on login failure', async () => {
      const error = {
        response: {
          data: {
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          },
        },
      };

      mockApiService.login.mockRejectedValue(error);

      await expect(
        useAuthStore.getState().login('test@example.com', 'wrongpassword')
      ).rejects.toEqual(error);

      const state = useAuthStore.getState();
      expect(state.status).toBe('logged_out');
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.error).toBe('Invalid email or password');
    });
  });

  describe('Refresh session flow', () => {
    it('should refresh session successfully and update tokens', async () => {
      const oldSession = {
        accessToken: 'old_access_token',
        refreshToken: 'valid_refresh_token',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
      };

      const newSession = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      // Set initial state with expired session
      useAuthStore.setState({
        status: 'logged_in',
        session: oldSession,
      });

      mockApiService.refreshToken.mockResolvedValue({
        session: newSession,
      });
      mockSessionStorage.save.mockResolvedValue(undefined);
      mockApiService.setAuthToken.mockImplementation(() => {});

      await useAuthStore.getState().refreshSession();

      // Should transition back to logged_in with new session
      const state = useAuthStore.getState();
      expect(state.status).toBe('logged_in');
      expect(state.session).toEqual(newSession);
      expect(state.error).toBeNull();
      expect(mockApiService.setAuthToken).toHaveBeenCalledWith('new_access_token');
      expect(mockApiService.refreshToken).toHaveBeenCalledWith('valid_refresh_token');
      expect(mockSessionStorage.save).toHaveBeenCalledWith(JSON.stringify(newSession));
    });

    it('should logout and set expired status when refresh fails', async () => {
      const oldSession = {
        accessToken: 'old_access_token',
        refreshToken: 'invalid_refresh_token',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      // Set initial state
      useAuthStore.setState({
        status: 'logged_in',
        session: oldSession,
      });

      const refreshError = {
        response: {
          status: 401,
          data: {
            error: {
              code: 'INVALID_REFRESH_TOKEN',
              message: 'Invalid refresh token',
            },
          },
        },
      };

      mockApiService.refreshToken.mockRejectedValue(refreshError);
      mockSessionStorage.remove.mockResolvedValue(undefined);
      mockApiService.setAuthToken.mockImplementation(() => {});

      await expect(useAuthStore.getState().refreshSession()).rejects.toEqual(refreshError);

      // Should logout and set expired status
      const state = useAuthStore.getState();
      expect(state.status).toBe('expired');
      expect(state.error).toBe('Your session has expired. Please login again.');
      expect(state.session).toBeNull();
      expect(mockApiService.setAuthToken).toHaveBeenCalledWith(null);
      expect(mockSessionStorage.remove).toHaveBeenCalled();
    });

    it('should logout when no refresh token is available', async () => {
      // Set state without refresh token
      useAuthStore.setState({
        status: 'logged_in',
        session: {
          accessToken: 'access_token',
          refreshToken: undefined as any,
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        },
      });

      mockSessionStorage.remove.mockResolvedValue(undefined);
      mockApiService.setAuthToken.mockImplementation(() => {});

      await expect(useAuthStore.getState().refreshSession()).rejects.toThrow(
        'No refresh token available'
      );

      const state = useAuthStore.getState();
      expect(state.status).toBe('expired');
      expect(state.error).toBe('Your session has expired. Please login again.');
      expect(mockSessionStorage.remove).toHaveBeenCalled();
    });
  });

  describe('Session expiry check', () => {
    it('should detect expired session and set expired status', () => {
      const expiredSession = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
      };

      useAuthStore.setState({
        status: 'logged_in',
        session: expiredSession,
      });

      const isExpired = useAuthStore.getState().checkSessionExpiry();

      expect(isExpired).toBe(true);
      expect(useAuthStore.getState().status).toBe('expired');
    });

    it('should return false for valid session', () => {
      const validSession = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // Valid
      };

      useAuthStore.setState({
        status: 'logged_in',
        session: validSession,
      });

      const isExpired = useAuthStore.getState().checkSessionExpiry();

      expect(isExpired).toBe(false);
      expect(useAuthStore.getState().status).toBe('logged_in');
    });

    it('should return true when no session exists', () => {
      useAuthStore.setState({
        status: 'logged_out',
        session: null,
      });

      const isExpired = useAuthStore.getState().checkSessionExpiry();

      expect(isExpired).toBe(true);
    });
  });

  describe('Logout flow', () => {
    it('should clear all auth state on logout', async () => {
      const session = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      useAuthStore.setState({
        status: 'logged_in',
        user: { id: 'USR-001', email: 'test@example.com', fullName: 'Test User' },
        session,
      });

      mockSessionStorage.remove.mockResolvedValue(undefined);
      mockApiService.setAuthToken.mockImplementation(() => {});

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.status).toBe('logged_out');
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.error).toBeNull();
      expect(mockApiService.setAuthToken).toHaveBeenCalledWith(null);
      expect(mockSessionStorage.remove).toHaveBeenCalled();
    });
  });
});
