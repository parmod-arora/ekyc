Background

eKYC (electronic Know Your Customer) is the process of verifying a customer’s identity remotely. You will build a mobile onboarding flow and a backend API that accepts an onboarding submission and returns a server-backed verification status.
This assessment focuses on fullstack fundamentals:
    ● Mobile state correctness (global ↔︎ local synchronization, persistence, error UX)
    ● API design and validation (consistent contracts, stable error formats)
    ● Session lifecycle (expiry, refresh, route guarding)
    ● End-to-end testing choices and production-minded architecture
Product Requirements (What You’re Building)

Build a Mobile eKYC Onboarding feature with a server-backed status.
Required Mobile Screens

1. Login
○ Email + password (simple validation)
○ Calls backend login API

2. Home
○ Shows user name (from /v1/me)
○ Shows current verifi cation status (from /v1/verification/status)
○ Entry point to start/resume onboarding

3. Onboarding (multi-step)
○ Step 1: Profi le (name, DOB, nationality)
○ Step 2: Document (document type + number)
○ Step 3: Address (address line + city + country)
○ Step 4: Consents (terms acceptance)
○ Step 5: Review & Submit

4. Settings
○ Theme toggle (light/dark)
Navigation Expectations
● Unauthenticated users can only access Login
● Authenticated users can access Home / Onboarding / Settings
● When the session expires, user must be sent back to Login (route guard), with a clear message
Suggested Repo Structure
You can choose any structure, but a monorepo is recommended:
● apps/api (Express + TypeScript)
● apps/mobile (Expo React Native + TypeScript)

JSON
Data Models (Suggested)
You may adjust names/shape, but keep the intent and behaviors.
User
{
"id": "USR-001",
"email": "jane.doe@example.com",
"fullName": "Jane Doe"
}
Session
{
"accessToken": "access_abc",
"refreshToken": "refresh_def",
"expiresAt": "2026-01-16T10:30:00.000Z"
}
Onboarding Draft (Client + Server)
{
"profile": {
"fullName": "Jane Doe",
"dateOfBirth": "1990-05-15",
"nationality": "US"
},
"document": {
"documentType": "PASSPORT",
JSON
"documentNumber": "P12345678"
},
"address": {
"addressLine1": "123 Main St",
"city": "Springfield",
"country": "US"
},
"consents": {
"termsAccepted": true
}
}
Verification Status
{
"status": "NOT_STARTED" | "IN_PROGRESS" | "APPROVED" | "REJECTED" | "MANUAL_REVIEW",
"updatedAt": "2026-01-16T10:35:00.000Z",
"details": {
"reasons": []
}
}
API Contracts (Backend)
Base URL
You can choose the base URL, but be consistent (e.g., http://localhost:3000).
Error Format (Must Be Consistent)
JSON
JSON
JSON
All non-2xx responses must follow a consistent JSON format:
{
"error": {
"code": "VALIDATION_ERROR",
"message": "Invalid input",
"details": {
"fieldErrors": {
"profile.fullName": "Required"
}
}
}
}

Rules:
● Don’t leak internals (stack traces)
● Avoid PII in error details
● Prefer stable code values (so the mobile app can handle errors reliably)

1) Login
Endpoint: POST /v1/auth/login
Request:
{
"email": "jane.doe@example.com",
"password": "password123"
}
Success (200):
{
JSON
"user": { "id": "USR-001", "email": "jane.doe@example.com", "fullName": "Jane Doe" },
"session": { "accessToken": "access_abc", "refreshToken": "refresh_def", "expiresAt": "..." }
}
Failure cases:
● Invalid credentials → 401-like error (use an error code like INVALID_CREDENTIALS)
2) Refresh Session
Endpoint: POST /v1/auth/refresh
Request:
{
"refreshToken": "refresh_def"
}
Success (200):
● Returns a new session with a later expiresAt
Failure cases:
● Invalid refresh token → 401-like error (must logout on mobile)
3) Get Current User
Endpoint: GET /v1/me
Auth: Authorization: Bearer <accessToken>
Rules:
● If access token is expired/invalid → 401-like error
● Otherwise returns the user
4) Submit Onboarding
Endpoint: POST /v1/onboarding/submit
Auth: Authorization: Bearer <accessToken>
JSON
JSON
JSON
Request:
{
"draft": { "profile": { }, "document": { }, "address": { }, "consents": { } }
}
Rules:
● Validate draft server-side (required fi elds, basic formats)
● If missing/invalid → 400-like error with fieldErrors
● If access token expired/invalid → 401-like error
● On success, the server sets verifi cation status to IN_PROGRESS (or directly MANUAL_REVIEW, your choice)
Success (200):
{
"submissionId": "SUB-123",
"status": "RECEIVED"
}

5) Get Verification Status
Endpoint: GET /v1/verification/status
Auth: Authorization: Bearer <accessToken>
Success (200):
{
"status": "IN_PROGRESS",
"updatedAt": "2026-01-16T10:35:00.000Z",
"details": { "reasons": [] }
}
### Mobile Requirements (Key Assessment Focus)

Your app must have multiple global states that interact:

1. Auth/Session state
○ status: logged_out | logging_in | logged_in | refreshing | expired
○ user + session

2. Theme state
○ theme: light | dark
○ Token-based theme values (colors/spacing) applied across app

3. Onboarding state
○ draft + currentStep
○ Submission state: idle | submitting | success | error

4. Verification status state
○ cached status from backend
○ loading/error handling
Synchronization Requirements (Global ↔︎ Local)
This is a major part of the exercise:

● Form screens may keep local input state, but the draft must stay in sync with global onboarding state.

● Draft updates must not be lost during:
○ theme change
○ navigation between steps
○ app restart (if you persist the draft)
○ session expiry / logout (draft should be preserved unless you intentionally clear it and explain why)

● Submitting should only clear the draft on successful submission.
Persistence Requirements
Persist at least:

● Theme (so it survives restart)

● Onboarding draft + current step (so the user can resume)
Session persistence is optional:
● If you persist it, use secure storage and handle expiry correctly.
● If you don’t persist it, that’s acceptable—just be consistent.