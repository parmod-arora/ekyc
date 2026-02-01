// Verification status state store

import { create } from 'zustand';
import type { VerificationStatus } from '../types';
import { apiService } from '../services/api';

interface VerificationState {
  status: VerificationStatus | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchStatus: () => Promise<void>;
  clearError: () => void;
}

export const useVerificationStore = create<VerificationState>((set, get) => ({
  status: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchStatus: async () => {
    try {
      set({ loading: true, error: null });
      const status = await apiService.getVerificationStatus();
      set({
        status,
        loading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error: any) {
      // 401 errors are handled by the centralized API interceptor (refresh-then-retry)
      // If we get here after retry, it means either:
      // - Refresh failed (user will be logged out and redirected)
      // - It's a different error
      const errorMessage =
        error.response?.data?.error?.message || 'Failed to fetch status';
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
