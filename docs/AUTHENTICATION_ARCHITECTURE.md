# EDUNEXT - Authentication Architecture

## Overview

This document describes the authentication and authorization architecture implemented in FASE 35 for EDUNEXT.

## Architecture Components

### 1. Password Security

#### Argon2id Hashing
- Uses `passlib` with Argon2id algorithm
- Parameters: time_cost=3, memory_cost=65536, parallelism=4, hash_len=32, salt_size=16
- Fallback to bcrypt if Argon2 unavailable

#### Password Policy
- Minimum 15 characters (12 for students, 16 for admins)
- Maximum 128 characters
- Blocks common passwords (100 most common)
- Blocks repeating characters (>3)
- Blocks sequential characters (abc, 123)
- Optional character variety requirements (configurable per role)

### 2. Session Management

#### AuthSession Model
- Server-side session storage in PostgreSQL
- Fields: user_id, institution_id, status, expires_at, revoked_at, user_agent, ip_address
- Statuses: active, expired, revoked, logged_out
- Automatic expiration and revocation support

#### Access Tokens (JWT)
- Short-lived (default 15 minutes)
- Contains: sub, sid, inst, roles, perms, iat, nbf, exp, jti, type
- Signed with HS256
- Validated on every protected request

#### Refresh Tokens
- Long-lived (default 30 days)
- Stored as SHA256 hash in database
- Rotated on each use (token rotation)
- Delivered via HttpOnly Secure cookie
- Reuse detection with session revocation

### 3. CSRF Protection
- Double-submit cookie pattern
- Signed CSRF tokens in cookies
- Verified via X-CSRF-Token header
- Required for state-changing operations

### 4. Rate Limiting
- In-memory rate limiter (Redis recommended for production)
- Login: 5 attempts per 5 minutes per IP+identifier
- Refresh: 10 attempts per minute per session
- Configurable limits

### 5. RBAC Authorization

#### Role Model
- System roles: student, monitor, admin
- Extensible with custom roles
- Permissions stored as array and via RolePermission relationship

#### Permission Model
- Code, name, description, resource, action, scope
- Scopes: institution, assigned, own

#### UserRole Assignment
- Links users to roles within institutions
- Supports expiration dates
- Tracked by assigner

#### Authorization Service
- Resolves effective permissions from roles
- Checks resource-level access
- Deny-by-default policy

### 6. Multi-Institutional Isolation
- Users belong to institutions
- Sessions scoped to institution
- Authorization checks include institution context
- Prevents cross-institution access

### 7. Security Events
- Comprehensive audit logging
- Event types: login, logout, token operations, password changes, permission denials
- Severity levels: info, warning, error, critical
- Indexed for querying

## Database Schema

### New Tables (FASE 35)
1. `user_credentials` - Password hashes and credential status
2. `auth_sessions` - Server-side session management
3. `refresh_tokens` - Refresh token storage with rotation
4. `security_events` - Audit trail
5. `administrator_profiles` - Admin profile data

### Enum Types
- `credentialstatus`: active, expired, locked, revoked
- `sessionstatus`: active, expired, revoked, logged_out
- `refreshtokenstatus`: valid, used, revoked, expired, replaced
- `securityeventtype`: 20 event types
- `securityeventseverity`: info, warning, error, critical

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Authenticate and create session
- `POST /api/v1/auth/refresh` - Rotate refresh token, get new access token
- `POST /api/v1/auth/logout` - Revoke current session
- `POST /api/v1/auth/logout-all` - Revoke all sessions (requires password)
- `GET /api/v1/auth/me` - Get current user info
- `GET /api/v1/auth/sessions` - List active sessions
- `GET /api/v1/auth/csrf` - Get CSRF token
- `POST /api/v1/auth/change-password` - Change password (revokes sessions)

### Cookie Configuration
- Refresh token: HttpOnly, Secure, SameSite=Lax, Path=/api/v1/auth/refresh
- CSRF token: HttpOnly, Secure, SameSite=Lax, Path=/

## Frontend Integration

### Authentication Service
- Keeps access and CSRF tokens in memory with `sessionStorage` as a same-tab fallback (never `localStorage`)
- Refreshes the session on `401` and retries the original request once
- Reuses the refresh flow through the exported `apiRequest` helper
- Logout clears tokens and cookies

### Demo vs Authenticated Mode
- Demo mode uses local fictitious data
- Authenticated mode uses real API
- Clear separation prevents credential leakage

## Security Considerations

### Implemented
- ✅ Argon2id password hashing
- ✅ Short-lived JWT access tokens
- ✅ Rotating refresh tokens with reuse detection
- ✅ HttpOnly Secure cookies
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Enumeration-resistant error messages
- ✅ Server-side session revocation
- ✅ Multi-institutional isolation
- ✅ Deny-by-default authorization
- ✅ Security event logging
- ✅ No secrets in logs or responses

### Pending / Future
- ⬜ Redis-backed rate limiting for multi-instance
- ⬜ Password reset via verified email/institutional channel
- ⬜ Device fingerprinting for session anomaly detection
- ⬜ Hardware security key support (WebAuthn)
- ⬜ Comprehensive penetration testing
- ⬜ Formal security audit

## Testing

### Unit Tests (21 passing)
- Password hashing and verification
- Password policy validation
- JWT token creation/decoding
- CSRF token generation/verification
- Token hashing
- Security utilities

### Integration Tests (5 passing)
- Health endpoints
- Login/refresh/logout flows
- Unauthenticated access rejection
- CSRF endpoint

### Frontend Regression (passing)
- 16 phases of visual/functional tests
- Offline mode preservation
- No breaking changes

## Configuration

### Environment Variables
```env
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
SESSION_MAX_AGE_SECONDS=2592000
CSRF_SECRET_KEY=dev-csrf-secret-change-in-production
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

### Production Checklist
- [ ] Generate strong SECRET_KEY and CSRF_SECRET_KEY
- [ ] Set COOKIE_SECURE=true
- [ ] Configure Redis for rate limiting
- [ ] Set up email/institutional delivery for password reset
- [ ] Enable HTTPS with valid TLS certificates
- [ ] Configure monitoring for security events
- [ ] Set up log aggregation
- [ ] Run penetration tests

## Migration

### Alembic Migration
- File: `alembic/versions/001_auth_models.py`
- Creates 5 new tables with indexes and enums
- Run with: `alembic upgrade head`

### Test Users (Development)
Created via `scripts/create_initial_admin.py`:
- Admin: admin@athron.edu / Admin@123456
- Monitor: monitor@athron.edu / Monitor@123456
- Student: student@athron.edu / Student@123456

**⚠️ Change passwords in production!**

## Files Created/Modified

### Core Security
- `app/core/security.py` - JWT, password hashing, CSRF, tokens
- `app/core/password_policy.py` - Password validation rules
- `app/core/config.py` - Extended with auth settings

### Models
- `app/db/models/user_credential.py` - Credential storage
- `app/db/models/auth_session.py` - Session management
- `app/db/models/refresh_token.py` - Refresh token storage
- `app/db/models/security_event.py` - Audit logging
- `app/db/models/identity.py` - Added AdministratorProfile, credential relationship

### Services
- `app/services/auth_service.py` - Authentication business logic
- `app/services/authorization_service.py` - RBAC authorization

### Dependencies
- `app/dependencies/auth.py` - FastAPI auth dependencies

### Schemas
- `app/schemas/auth.py` - Request/response models
- `app/schemas/permission.py` - Permission constants

### Endpoints
- `app/api/v1/endpoints/auth.py` - Auth API routes

### Tests
- `tests/test_auth.py` - Comprehensive auth tests
- `tests/conftest.py` - Async test fixtures

### Scripts
- `scripts/create_initial_admin.py` - Provisioning script

### Documentation
- `docs/AUTHENTICATION_ARCHITECTURE.md` - This file