# eKYC Backend API

A TypeScript + Express.js backend service for eKYC (electronic Know Your Customer) onboarding flow.

## Features

- ✅ RESTful API with consistent error handling
- ✅ JWT-like token-based authentication with refresh tokens
- ✅ Session management with expiry
- ✅ Request validation using Zod
- ✅ Comprehensive test coverage
- ✅ In-memory data store (for development/testing)
- ✅ TypeScript for type safety

## Project Structure

```
api/
├── src/
│   ├── index.ts                 # Main application entry point
│   ├── types/                   # TypeScript type definitions
│   ├── store/                   # In-memory data store
│   ├── routes/                  # API route handlers
│   │   ├── auth.ts              # Authentication routes
│   │   ├── user.ts              # User routes
│   │   ├── onboarding.ts        # Onboarding routes
│   │   └── verification.ts      # Verification routes
│   ├── middleware/              # Express middleware
│   │   ├── auth.ts              # Authentication middleware
│   │   └── errorHandler.ts      # Error handling middleware
│   └── utils/                   # Utility functions
│       ├── token.ts             # Token generation utilities
│       └── validation.ts        # Zod validation schemas
├── http-scripts.http            # HTTP scripts for manual testing
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Installation

```bash
cd api
npm install
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Endpoints

### Base URL
`http://localhost:3000`

### Authentication Endpoints

#### POST /v1/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "jane.doe@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "USR-001",
    "email": "jane.doe@example.com",
    "fullName": "Jane Doe"
  },
  "session": {
    "accessToken": "access_...",
    "refreshToken": "refresh_...",
    "expiresAt": "2026-01-16T10:30:00.000Z"
  }
}
```

#### POST /v1/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "refresh_..."
}
```

**Response (200):**
```json
{
  "session": {
    "accessToken": "access_...",
    "refreshToken": "refresh_...",
    "expiresAt": "2026-01-16T10:30:00.000Z"
  }
}
```

### User Endpoints

#### GET /v1/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "USR-001",
  "email": "jane.doe@example.com",
  "fullName": "Jane Doe"
}
```

### Onboarding Endpoints

#### POST /v1/onboarding/submit
Submit onboarding draft for verification.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "draft": {
    "profile": {
      "fullName": "Jane Doe",
      "dateOfBirth": "1990-05-15",
      "nationality": "US"
    },
    "document": {
      "documentType": "PASSPORT",
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
}
```

**Response (200):**
```json
{
  "submissionId": "SUB-123",
  "status": "RECEIVED"
}
```

### Verification Endpoints

#### GET /v1/verification/status
Get current verification status.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "status": "IN_PROGRESS",
  "updatedAt": "2026-01-16T10:35:00.000Z",
  "details": {
    "reasons": []
  }
}
```

## Error Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "fieldErrors": {
        "field.path": "Error message for this field"
      }
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed (400)
- `UNAUTHORIZED` - Missing or invalid authentication (401)
- `TOKEN_EXPIRED` - Access token has expired (401)
- `INVALID_CREDENTIALS` - Invalid email or password (401)
- `INVALID_REFRESH_TOKEN` - Invalid or expired refresh token (401)
- `USER_NOT_FOUND` - User not found (404)
- `INTERNAL_ERROR` - Internal server error (500)

## Manual Testing

Use the `http-scripts.http` file with REST Client extension in VS Code or similar tools.

1. Install REST Client extension in VS Code
2. Open `http-scripts.http`
3. Run requests by clicking "Send Request" above each request
4. Copy tokens from login response and update variables at the top of the file

## Sample User

A sample user is automatically created on server startup:

- **Email:** `jane.doe@example.com`
- **Password:** `password123`

## Session Management

- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Expired access tokens return `TOKEN_EXPIRED` error
- Use refresh token endpoint to get new access token

## Data Models

### User
```typescript
{
  id: string;
  email: string;
  fullName: string;
  password: string; // Hashed in production
}
```

### Session
```typescript
{
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO 8601
  userId: string;
}
```

### Onboarding Draft
```typescript
{
  profile: {
    fullName: string;
    dateOfBirth: string; // YYYY-MM-DD
    nationality: string;
  };
  document: {
    documentType: "PASSPORT" | "DRIVER_LICENSE" | "NATIONAL_ID";
    documentNumber: string;
  };
  address: {
    addressLine1: string;
    city: string;
    country: string;
  };
  consents: {
    termsAccepted: boolean;
  };
}
```

### Verification Status
```typescript
{
  status: "NOT_STARTED" | "IN_PROGRESS" | "APPROVED" | "REJECTED" | "MANUAL_REVIEW";
  updatedAt: string; // ISO 8601
  details: {
    reasons: string[];
  };
}
```

## Best Practices Implemented

1. **Type Safety** - Full TypeScript coverage
2. **Validation** - Zod schemas for request validation
3. **Error Handling** - Consistent error format across all endpoints
4. **Security** - Token-based authentication, no stack traces in errors
5. **Testing** - Comprehensive test suite with good coverage
6. **Code Organization** - Clear separation of concerns
7. **Documentation** - Well-documented code and API

## License

ISC
