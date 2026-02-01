// Shared types matching API contracts

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO 8601 date string
}

export interface OnboardingProfile {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD format
  nationality: string;
}

export interface OnboardingDocument {
  documentType: 'PASSPORT' | 'DRIVER_LICENSE' | 'NATIONAL_ID';
  documentNumber: string;
}

export interface OnboardingAddress {
  addressLine1: string;
  city: string;
  country: string;
}

export interface OnboardingConsents {
  termsAccepted: boolean;
}

export interface OnboardingDraft {
  profile: OnboardingProfile;
  document: OnboardingDocument;
  address: OnboardingAddress;
  consents: OnboardingConsents;
}

export type VerificationStatusType =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'MANUAL_REVIEW';

export interface VerificationStatus {
  status: VerificationStatusType;
  updatedAt: string; // ISO 8601 date string
  details: {
    reasons: string[];
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string>;
    };
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  session: Session;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  session: Session;
}

export interface SubmitOnboardingRequest {
  draft: OnboardingDraft;
}

export interface SubmitOnboardingResponse {
  submissionId: string;
  status: string;
}

export type AuthStatus = 'logged_out' | 'logging_in' | 'logged_in' | 'refreshing' | 'expired';

export type Theme = 'light' | 'dark';

export type SubmissionState = 'idle' | 'submitting' | 'success' | 'error';

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;
