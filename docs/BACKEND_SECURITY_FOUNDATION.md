# Backend Security Foundation

## Overview

This document describes the security foundations implemented in the EDUNEXT backend. Security is a core concern given the platform's focus on minors' educational data.

## Security Principles

### Defense in Depth
Multiple layers of security controls at different levels:
- Network (CORS, trusted origins)
- Application (input validation, output encoding)
- Data (encryption at rest, future)
- Transport (TLS in production)

### Principle of Least Privilege
- Minimum necessary permissions
- Role-based access (future)
- Service-to-service authentication (future)

### Secure by Default
- Secure defaults for all configurations
- Explicit opt-in for relaxed security
- Fail-safe defaults

## Implemented Security Controls

### Input Validation
- **Pydantic Models**: All inputs validated via Pydantic schemas
- **Type Safety**: Strict typing with automatic validation
- **Input Sanitization**: No raw HTML/JS execution
- **Size Limits**: Request size limits via middleware

### Output Encoding
- **JSON Responses**: Automatic JSON encoding
- **No HTML Injection**: No server-side template rendering of user data
- **Content-Type Headers**: Proper Content-Type headers

### CORS Policy
- Configurable allowed origins
- No wildcard with credentials
- Preflight request handling
- Configurable methods/headers

### Error Handling
- **No Stack Traces**: Production errors return generic messages
- **Structured Errors**: Consistent error format
- **No Information Leakage**: No stack traces in responses
- **Audit Logging**: Security events logged server-side

### Request Security
- **Request Size Limits**: Configurable via middleware
- **Request ID Tracking**: Unique ID per request for tracing
- **Rate Limiting**: Planned for future implementation

### Headers Security
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### CORS Configuration
```python
allow_origins = settings.cors_origins_list  # Configurable, no wildcard with credentials
allow_credentials = True
allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
allow_headers = ["*"]
```

## Authentication & Authorization (Future)

### Planned Implementation
- **JWT Tokens**: RS256 signed, short-lived access tokens
- **Refresh Tokens**: Long-lived, rotating, revocable
- **Role-Based Access Control**: Student/Monitor/Admin
- **Resource-Based Permissions**: Per-resource permissions

### Current State
- No authentication implemented
- All endpoints public (demonstration mode)
- Clear documentation of what requires auth

## Data Protection

### Data Minimization
- Only collect necessary data
- No PII in logs
- Automatic data expiration (planned)

### Encryption
- **In Transit**: TLS 1.2+ enforced in production
- **At Rest**: PostgreSQL TDE (future)
- **Field-Level**: Sensitive fields encrypted (future)

### Data Retention
- Automated cleanup of expired drafts (planned)
- Audit log retention: 90 days (configurable)
- No permanent storage of sensitive ephemeral data

## Frontend Security Integration

### Content Security Policy (Future)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

### Subresource Integrity
- All external resources with SRI hashes (planned)

### Subdomain Isolation
- API on separate subdomain (planned)
- Cookie domain restrictions

## Error Handling Security

### Error Response Format
```json
{
  "code": "ERROR_CODE",
  "message": "User-friendly message",
  "details": {}
}
```

### What We Don't Expose
- Stack traces
- Database schema
- Internal file paths
- Configuration values
- Third-party service details

### Logging Security
- No PII in logs
- Request IDs for correlation
- Sanitized error messages
- Structured JSON logging

## Dependency Security

### Dependency Management
- Regular `pip-audit` scans
- Pinned versions in `pyproject.toml`
- Automated security updates via Dependabot

### Approved Dependencies
| Package | Purpose | Security Notes |
|---------|---------|----------------|
| fastapi | Web framework | Active maintenance |
| pydantic | Validation | Strong typing |
| uvicorn | ASGI server | Production ready |
| pydantic-settings | Config | Type-safe |
| python-dotenv | Env loading | Dev only |

## Audit & Compliance

### Data Protection
- **GDPR Considerations**: Right to deletion, data portability
- **COPPA Compliance**: No data collection from under 13 without consent
- **FERPA**: Educational records protection

### Audit Trail
- All admin actions logged
- Data access logged
- Config changes tracked

## Incident Response

### Security Incident Process
1. Detect (monitoring/alerts)
2. Contain (disable affected component)
3. Investigate (logs, traces)
4. Remediate (patch, rotate keys)
5. Document (postmortem)

### Contact
Security issues: security@athron.edu (future)

## Compliance Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| HTTPS Enforcement | Planned | Requires reverse proxy |
| HSTS | Planned | Requires TLS termination |
| CSP | Planned | Frontend implementation |
| Input Validation | ✅ Done | Pydantic models |
| Output Encoding | ✅ Done | JSON responses |
| CORS Policy | ✅ Configured | Configurable origins |
| Error Handling | ✅ Done | No info leakage |
| Secret Management | ✅ Config | Env vars only |
| Dependency Scanning | Planned | pip-audit integration |
| Security Headers | Partial | Basic headers |
| Rate Limiting | Planned | Future middleware |

## Future Security Enhancements

### Phase 1 (Next)
- Rate limiting middleware
- Request size limits
- API key authentication
- Basic JWT implementation

### Phase 2
- PostgreSQL integration
- JWT authentication
- Role-based access control
- Audit logging

### Phase 3
- Multi-factor authentication
- OAuth2/OIDC integration
- Advanced audit logging
- Automated security scanning

## Security Contacts

- **Development Team**: dev@athron.edu
- **Security Issues**: security@athron.edu (future)
- **Data Protection Officer**: dpo@athron.edu (future)

---

*Last Updated: 2024*
*Version: 0.1.0*