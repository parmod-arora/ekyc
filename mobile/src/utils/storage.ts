// Secure storage utilities

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'session';
const THEME_KEY = 'theme';
const ONBOARDING_DRAFT_KEY = 'onboarding_draft';
const ONBOARDING_STEP_KEY = 'onboarding_step';

// Session storage (secure)
export const sessionStorage = {
  async save(session: string): Promise<void> {
    await SecureStore.setItemAsync(SESSION_KEY, session);
  },

  async load(): Promise<string | null> {
    return await SecureStore.getItemAsync(SESSION_KEY);
  },

  async remove(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};

// Theme storage (not sensitive, can use AsyncStorage)
export const themeStorage = {
  async save(theme: string): Promise<void> {
    await AsyncStorage.setItem(THEME_KEY, theme);
  },

  async load(): Promise<string | null> {
    return await AsyncStorage.getItem(THEME_KEY);
  },

  async remove(): Promise<void> {
    await AsyncStorage.removeItem(THEME_KEY);
  },
};

// Onboarding draft storage (not sensitive, can use AsyncStorage)
export const onboardingStorage = {
  async saveDraft(draft: string): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_DRAFT_KEY, draft);
  },

  async loadDraft(): Promise<string | null> {
    return await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY);
  },

  async removeDraft(): Promise<void> {
    await AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY);
  },

  async saveStep(step: number): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_STEP_KEY, step.toString());
  },

  async loadStep(): Promise<number | null> {
    const step = await AsyncStorage.getItem(ONBOARDING_STEP_KEY);
    return step ? parseInt(step, 10) : null;
  },

  async removeStep(): Promise<void> {
    await AsyncStorage.removeItem(ONBOARDING_STEP_KEY);
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([ONBOARDING_DRAFT_KEY, ONBOARDING_STEP_KEY]);
  },
};
