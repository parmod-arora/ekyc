import { z } from 'zod';
import { ApiError } from '../types';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const onboardingProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  nationality: z.string().min(2, 'Nationality is required').max(3, 'Nationality must be a valid country code'),
});

export const onboardingDocumentSchema = z.object({
  documentType: z.enum(['PASSPORT', 'DRIVER_LICENSE', 'NATIONAL_ID'], {
    errorMap: () => ({ message: 'Document type must be PASSPORT, DRIVER_LICENSE, or NATIONAL_ID' }),
  }),
  documentNumber: z.string().min(1, 'Document number is required'),
});

export const onboardingAddressSchema = z.object({
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(2, 'Country is required').max(3, 'Country must be a valid country code'),
});

export const onboardingConsentsSchema = z.object({
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'Terms must be accepted',
  }),
});

export const onboardingDraftSchema = z.object({
  profile: onboardingProfileSchema,
  document: onboardingDocumentSchema,
  address: onboardingAddressSchema,
  consents: onboardingConsentsSchema,
});

export const submitOnboardingSchema = z.object({
  draft: onboardingDraftSchema,
});

/**
 * Format Zod validation errors into API error format
 */
export function formatValidationError(error: z.ZodError): ApiError {
  const fieldErrors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    fieldErrors[path] = err.message;
  });

  return {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input',
    details: {
      fieldErrors,
    },
  };
}
