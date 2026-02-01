// API configuration
// For iOS Simulator: use localhost
// For Android Emulator: use 10.0.2.2
// For physical devices: use your computer's IP address (e.g., http://192.168.1.100:3000)

import { Platform } from 'react-native';

export const API_BASE_URL = __DEV__
  ? Platform.OS === 'ios'
    ? 'http://localhost:3000'
    : 'http://10.0.2.2:3000' // Android emulator
  : 'http://localhost:3000'; // Update for production

export const API_ENDPOINTS = {
  LOGIN: '/v1/auth/login',
  REFRESH: '/v1/auth/refresh',
  ME: '/v1/me',
  SUBMIT_ONBOARDING: '/v1/onboarding/submit',
  VERIFICATION_STATUS: '/v1/verification/status',
} as const;
