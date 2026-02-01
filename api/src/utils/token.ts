import crypto from 'crypto';

const ACCESS_TOKEN_LENGTH = 32;
const REFRESH_TOKEN_LENGTH = 32;
const ACCESS_TOKEN_EXPIRY_HOURS = 1;
const REFRESH_TOKEN_EXPIRY_HOURS = 24 * 7; // 7 days

/**
 * Generate a random token
 */
function generateToken(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate access token
 */
export function generateAccessToken(): string {
  return `access_${generateToken(ACCESS_TOKEN_LENGTH)}`;
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(): string {
  return `refresh_${generateToken(REFRESH_TOKEN_LENGTH)}`;
}

/**
 * Calculate token expiry date
 */
export function calculateExpiry(hours: number): string {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry.toISOString();
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Get access token expiry
 */
export function getAccessTokenExpiry(): string {
  return calculateExpiry(ACCESS_TOKEN_EXPIRY_HOURS);
}

/**
 * Get refresh token expiry
 */
export function getRefreshTokenExpiry(): string {
  return calculateExpiry(REFRESH_TOKEN_EXPIRY_HOURS);
}
