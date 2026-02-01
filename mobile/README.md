# eKYC Mobile App

A React Native mobile application for electronic Know Your Customer (eKYC) onboarding built with Expo, TypeScript, and Zustand for state management.

## Features

### Core Functionality
- **Authentication**: Secure login with session management and token refresh
- **Multi-step Onboarding**: 5-step verification process (Profile, Document, Address, Consents, Review)
- **Verification Status**: Real-time status tracking with backend synchronization
- **Theme Support**: Light/Dark mode with persistent theme preferences
- **Route Guards**: Automatic session expiry handling and route protection

### Key Assessment Focus Areas

#### 1. Global State Management (Zustand)
- **Auth/Session State**: Manages login, logout, session refresh, and expiry
- **Theme State**: Light/dark mode with persistence
- **Onboarding State**: Draft management with step tracking and submission state
- **Verification State**: Cached status from backend with loading/error handling

#### 2. State Synchronization
- Form screens maintain local input state
- Draft stays synchronized with global onboarding state
- Draft persists across:
  - Theme changes
  - Navigation between steps
  - App restarts
  - Session expiry (draft preserved)

#### 3. Persistence
- **Session**: Stored in secure storage (expo-secure-store)
- **Theme**: Persisted in AsyncStorage
- **Onboarding Draft**: Persisted in AsyncStorage with current step

## Project Structure

```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab navigation layout
│   │   ├── home.tsx          # Home screen with user info and verification status
│   │   ├── onboarding.tsx    # Multi-step onboarding flow
│   │   └── settings.tsx      # Settings with theme toggle
│   ├── _layout.tsx           # Root layout with route guards
│   ├── index.tsx             # Entry point with auth redirect
│   └── login.tsx             # Login screen
├── src/
│   ├── components/           # Reusable UI components
│   ├── config/               # Configuration (API endpoints)
│   ├── services/            # API service layer
│   ├── store/               # Zustand state stores
│   ├── theme/               # Theme system (colors, spacing, typography)
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utilities (storage helpers)
└── package.json
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS, install pods (if needed):
```bash
cd ios && pod install && cd ..
```

## Running the App

### Start the development server:
```bash
npm start
```

### Run on iOS:
```bash
npm run ios
```

### Run on Android:
```bash
npm run android
```

## API Configuration

The app connects to the backend API. Update the API base URL in `src/config/api.ts`:

- **iOS Simulator**: `http://localhost:3000`
- **Android Emulator**: `http://10.0.2.2:3000`
- **Physical Devices**: Use your computer's IP address (e.g., `http://192.168.1.100:3000`)

Make sure the backend API is running on port 3000.

## Test Credentials

Use the default test user created by the backend:
- **Email**: `jane.doe@example.com`
- **Password**: `password123`

## State Management Architecture

### Auth Store (`src/store/authStore.ts`)
- Manages authentication state: `logged_out | logging_in | logged_in | refreshing | expired`
- Handles session persistence in secure storage
- Automatic session expiry checking and refresh
- Route guard integration

### Theme Store (`src/store/themeStore.ts`)
- Manages theme: `light | dark`
- Persists theme preference
- Provides theme toggle functionality

### Onboarding Store (`src/store/onboardingStore.ts`)
- Manages onboarding draft and current step
- Handles submission state: `idle | submitting | success | error`
- Persists draft and step across app restarts
- Clears draft only on successful submission

### Verification Store (`src/store/verificationStore.ts`)
- Caches verification status from backend
- Handles loading and error states
- Provides refresh functionality

## Navigation Flow

1. **Unauthenticated**: Can only access Login screen
2. **Authenticated**: Can access Home, Onboarding, and Settings
3. **Session Expired**: Automatically redirected to Login with clear message
4. **Route Guards**: Implemented in `app/_layout.tsx` with automatic checks

## Key Implementation Details

### Secure Storage
- Sessions stored using `expo-secure-store` for security
- Theme and draft stored in `AsyncStorage` (not sensitive)

### State Synchronization
- Each onboarding step component validates and updates global state
- Draft updates are immediately persisted
- Form state is local, but synced with global state on change

### Error Handling
- Consistent error format matching API contracts
- User-friendly error messages
- Automatic retry mechanisms where appropriate

## Development Notes

- All state management uses Zustand with TypeScript
- Theme system uses design tokens (colors, spacing, typography)
- Components are reusable and theme-aware
- API service layer handles all HTTP requests with proper error handling
- Route guards check session expiry every minute

## Requirements Met

✅ Mobile state correctness (global ↔ local synchronization, persistence, error UX)  
✅ API design and validation (consistent contracts, stable error formats)  
✅ Session lifecycle (expiry, refresh, route guarding)  
✅ End-to-end testing choices and production-minded architecture  
✅ Secure storage for sessions  
✅ TypeScript throughout  
✅ Zustand for state management  
