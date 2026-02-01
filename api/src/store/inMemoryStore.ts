import {
  User,
  Session,
  OnboardingDraft,
  VerificationStatus,
} from '../types';

/**
 * In-memory store for the eKYC application
 * In production, this would be replaced with a database
 */
class InMemoryStore {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map(); // accessToken -> Session
  private refreshTokens: Map<string, string> = new Map(); // refreshToken -> accessToken
  private onboardingDrafts: Map<string, OnboardingDraft> = new Map(); // userId -> Draft
  private verificationStatuses: Map<string, VerificationStatus> = new Map(); // userId -> Status
  private userIdCounter = 1;
  private submissionIdCounter = 1;

  // User operations
  createUser(user: Omit<User, 'id'>): User {
    const id = `USR-${String(this.userIdCounter++).padStart(3, '0')}`;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  // Session operations
  createSession(session: Session): void {
    this.sessions.set(session.accessToken, session);
    this.refreshTokens.set(session.refreshToken, session.accessToken);
  }

  getSessionByAccessToken(accessToken: string): Session | undefined {
    return this.sessions.get(accessToken);
  }

  getSessionByRefreshToken(refreshToken: string): Session | undefined {
    const accessToken = this.refreshTokens.get(refreshToken);
    if (!accessToken) {
      return undefined;
    }
    return this.sessions.get(accessToken);
  }

  deleteSession(accessToken: string): void {
    const session = this.sessions.get(accessToken);
    if (session) {
      this.refreshTokens.delete(session.refreshToken);
      this.sessions.delete(accessToken);
    }
  }

  updateSession(oldAccessToken: string, newSession: Session): void {
    this.deleteSession(oldAccessToken);
    this.createSession(newSession);
  }

  // Onboarding operations
  saveOnboardingDraft(userId: string, draft: OnboardingDraft): void {
    this.onboardingDrafts.set(userId, draft);
  }

  getOnboardingDraft(userId: string): OnboardingDraft | undefined {
    return this.onboardingDrafts.get(userId);
  }

  // Verification status operations
  getVerificationStatus(userId: string): VerificationStatus {
    const status = this.verificationStatuses.get(userId);
    if (status) {
      return status;
    }
    // Return default status if not found
    return {
      status: 'NOT_STARTED',
      updatedAt: new Date().toISOString(),
      details: { reasons: [] },
    };
  }

  setVerificationStatus(userId: string, status: VerificationStatus): void {
    this.verificationStatuses.set(userId, status);
  }

  // Utility
  generateSubmissionId(): string {
    return `SUB-${String(this.submissionIdCounter++).padStart(3, '0')}`;
  }

  // Cleanup expired sessions (can be called periodically)
  cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [accessToken, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt) < now) {
        this.deleteSession(accessToken);
      }
    }
  }

  // Reset store (useful for testing)
  reset(): void {
    this.users.clear();
    this.sessions.clear();
    this.refreshTokens.clear();
    this.onboardingDrafts.clear();
    this.verificationStatuses.clear();
    this.userIdCounter = 1;
    this.submissionIdCounter = 1;
  }
}

// Singleton instance
export const store = new InMemoryStore();
