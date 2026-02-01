// Auth/Session state store

import { create } from 'zustand';
import type { User, Session, AuthStatus } from '../types';
import { apiService } from '../services/api';
import { sessionStorage } from '../utils/storage';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkSessionExpiry: () => boolean;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
      status: 'logged_out',
      user: null,
      session: null,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ status: 'logging_in', error: null });
          const response = await apiService.login({ email, password });
          
          // Save session to secure storage
          await sessionStorage.save(JSON.stringify(response.session));
          
          // Set auth token for API client
          apiService.setAuthToken(response.session.accessToken);

          set({
            status: 'logged_in',
            user: response.user,
            session: response.session,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.error?.message || 'Login failed';
          set({
            status: 'logged_out',
            user: null,
            session: null,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        await sessionStorage.remove();
        apiService.setAuthToken(null);
        set({
          status: 'logged_out',
          user: null,
          session: null,
          error: null,
        });
      },

      refreshSession: async () => {
        const { session } = get();
        if (!session?.refreshToken) {
          await get().logout();
          set({ status: 'expired', error: 'Your session has expired. Please login again.' });
          throw new Error('No refresh token available');
        }

        try {
          set({ status: 'refreshing' });
          const response = await apiService.refreshToken(session.refreshToken);
          
          // Save new session
          await sessionStorage.save(JSON.stringify(response.session));
          apiService.setAuthToken(response.session.accessToken);

          set({
            status: 'logged_in',
            session: response.session,
            error: null,
          });
        } catch (error: any) {
          // Refresh failed - logout will be handled by the caller (API interceptor or initialize)
          await get().logout();
          set({ status: 'expired', error: 'Your session has expired. Please login again.' });
          throw error; // Re-throw so caller can handle it
        }
      },

      checkSessionExpiry: () => {
        const { session } = get();
        if (!session) return true;

        const expiresAt = new Date(session.expiresAt);
        const now = new Date();
        const isExpired = now >= expiresAt;

        if (isExpired) {
          set({ status: 'expired' });
        }

        return isExpired;
      },

      initialize: async () => {
        try {
          // Load session from secure storage
          const sessionStr = await sessionStorage.load();
          if (!sessionStr) {
            set({ status: 'logged_out' });
            return;
          }

          const session: Session = JSON.parse(sessionStr);
          
          // Check if expired
          const expiresAt = new Date(session.expiresAt);
          const now = new Date();
          if (now >= expiresAt) {
            // Try to refresh
            set({ session, status: 'refreshing' });
            apiService.setAuthToken(session.accessToken);
            await get().refreshSession();
          } else {
            // Session is valid, fetch user
            apiService.setAuthToken(session.accessToken);
            try {
              const user = await apiService.getCurrentUser();
              set({
                status: 'logged_in',
                user,
                session,
                error: null,
              });
            } catch (error) {
              // User fetch failed, try refresh
              await get().refreshSession();
            }
          }
        } catch (error) {
          // Failed to initialize, clear session
          await sessionStorage.remove();
          set({ status: 'logged_out', user: null, session: null });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    })
);
