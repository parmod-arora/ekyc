### 2.2 Mobile Session Lifecycle (Must Have)
● ✅ Guarded routes (unauthenticated cannot access Home/Onboarding)
● ✅ If token expired/401:
○ Attempt refresh once
○ Retry original request once
○ If refresh fails → logout + redirect to Login with clear UX message
● ✅ Avoid infi nite retry loops

### 2.3 Testing (Must Have)
Write at least:
● ✅ API tests for submit validation error shape (fi eldErrors)
● ✅ Mobile unit tests for auth/session state transitions OR a focused test for refresh-then-retry behavior