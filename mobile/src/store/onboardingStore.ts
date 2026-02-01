// Onboarding state store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  OnboardingDraft,
  OnboardingStep,
  SubmissionState,
} from '../types';
import { apiService } from '../services/api';
import { onboardingStorage } from '../utils/storage';

interface OnboardingState {
  draft: OnboardingDraft | null;
  currentStep: OnboardingStep;
  submissionState: SubmissionState;
  submissionError: string | null;
  hasStartedOnboarding: boolean; // Separate flag to track if user has started onboarding

  // Actions
  initializeDraft: () => Promise<void>;
  updateDraft: (updates: Partial<OnboardingDraft>) => void;
  setStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  submit: () => Promise<void>;
  clearDraft: () => Promise<void>;
  clearSubmissionError: () => void;
  markOnboardingStarted: () => void;
  clearOnboardingStarted: () => void;
}

const defaultDraft: OnboardingDraft = {
  profile: {
    fullName: '',
    dateOfBirth: '',
    nationality: '',
  },
  document: {
    documentType: 'PASSPORT',
    documentNumber: '',
  },
  address: {
    addressLine1: '',
    city: '',
    country: '',
  },
  consents: {
    termsAccepted: false,
  },
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      draft: null,
      currentStep: 1,
      submissionState: 'idle',
      submissionError: null,
      hasStartedOnboarding: false,

      initializeDraft: async () => {
        try {
          // Try to load from storage
          const draftStr = await onboardingStorage.loadDraft();
          const step = await onboardingStorage.loadStep();

          if (draftStr) {
            const draft = JSON.parse(draftStr) as OnboardingDraft;
            set({
              draft,
              currentStep: (step as OnboardingStep) || 1,
            });
          } else {
            // Initialize with default draft
            set({ draft: defaultDraft, currentStep: 1 });
          }
        } catch (error) {
          // If loading fails, use default
          set({ draft: defaultDraft, currentStep: 1 });
        }
      },

      updateDraft: (updates: Partial<OnboardingDraft>) => {
        const { draft } = get();
        if (!draft) {
          set({ draft: { ...defaultDraft, ...updates } });
          return;
        }

        const updatedDraft: OnboardingDraft = {
          profile: { ...defaultDraft.profile, ...draft.profile, ...updates.profile },
          document: { ...defaultDraft.document, ...draft.document, ...updates.document },
          address: { ...defaultDraft.address, ...draft.address, ...updates.address },
          consents: { ...defaultDraft.consents, ...draft.consents, ...updates.consents },
        };

        set({ draft: updatedDraft });

        // Persist to storage
        onboardingStorage.saveDraft(JSON.stringify(updatedDraft));
      },

      setStep: (step: OnboardingStep) => {
        set({ currentStep: step });
        onboardingStorage.saveStep(step);
      },

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 5) {
          const next = (currentStep + 1) as OnboardingStep;
          get().setStep(next);
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          const prev = (currentStep - 1) as OnboardingStep;
          get().setStep(prev);
        }
      },

      submit: async () => {
        const { draft } = get();
        if (!draft) {
          set({
            submissionState: 'error',
            submissionError: 'No draft to submit',
          });
          return;
        }

        try {
          set({ submissionState: 'submitting', submissionError: null });
          await apiService.submitOnboarding({ draft });
          set({ submissionState: 'success' });
          
          // Clear draft on successful submission
          await get().clearDraft();
        } catch (error: any) {
          // 401 errors are handled by the centralized API interceptor (refresh-then-retry)
          // If we get here after retry, it means either:
          // - Refresh failed (user will be logged out and redirected)
          // - It's a different error (validation, etc.)
          const errorMessage =
            error.response?.data?.error?.message || 'Submission failed';
          set({
            submissionState: 'error',
            submissionError: errorMessage,
          });
          throw error;
        }
      },

      clearDraft: async () => {
        await onboardingStorage.clear();
        set({
          draft: null,
          currentStep: 1,
          submissionState: 'idle',
          submissionError: null,
        });
      },

      clearSubmissionError: () => {
        set({ submissionError: null });
      },

      markOnboardingStarted: () => {
        set({ hasStartedOnboarding: true });
      },

      clearOnboardingStarted: () => {
        set({ hasStartedOnboarding: false });
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        draft: state.draft,
        currentStep: state.currentStep,
        hasStartedOnboarding: state.hasStartedOnboarding,
        // Don't persist submission state
      }),
    }
  )
);
