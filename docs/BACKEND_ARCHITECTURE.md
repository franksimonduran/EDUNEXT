# EDUNEXT Backend Architecture

## Overview

The EDUNEXT backend is a modular FastAPI application designed to serve as the backend for the EDUNEXT educational platform. It follows a modular architecture with clear separation of concerns.

## Architecture Overview

```
backend/
├── app/
│   ├── main.py                 # Application entry point
│   ├── api/
│   │   └── v1/
│   │       ├── router.py       # API v1 router aggregation
│   │       └── endpoints/      # API endpoints
│   │           ├── health.py   # Health check endpoints
│   │           ├── meta.py     # Metadata endpoints
│   │           └── system.py   # System status endpoints
│   ├── core/
│   │   ├── config.py           # Configuration management
│   │   ├── logging.py          # Logging configuration
│   │   ├── exceptions.py       # Custom exceptions
│   │   └── middleware.py       # Custom middleware
│   ├── api/
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/
│   ├── schemas/
│   │   ├── health.py
    │   ├── meta.py
    │   └── system.py
│   ├── services/
│   │   └── __init__.py
│   └── dependencies/
│       └── common.py
├── tests/
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_meta.py
│   ├── test_system_status.py
│   └── test_integration.py
├── pyproject.toml
├── .env.example
└── README.md
```

## Core Components

### Configuration (`app/core/config.py`)
- Uses Pydantic Settings for type-safe configuration
- Loads from `.env` file with `.env.example` as template
- Supports development, testing, and production environments
- Validates all configuration at startup

### Logging (`app/core/logging.py`)
- Structured logging with configurable levels
- Request-scoped logging with request IDs
- Configurable log levels via environment variable

### Exception Handling (`app/core/exceptions.py`)
- Custom exception hierarchy
- Structured error responses
- Proper HTTP status codes

### Middleware (`app/core/middleware.py`)
- Request ID middleware for tracing
- Request/response logging
- Process time measurement

### Configuration (`app/core/config.py`)
- Pydantic Settings for type-safe configuration
- Environment-specific configuration
- Validation of all settings at startup

### Middleware Stack
1. RequestIDMiddleware - Adds unique request ID to each request
2. RequestLoggingMiddleware - Logs request/response details
3. CORSMiddleware - Handles CORS policy

## API Structure

### Versioning
- All endpoints under `/api/v1`
- Version prefix configurable via `API_V1_PREFIX` setting

### Endpoints

#### Health Checks
- `GET /api/v1/health/live` - Liveness probe
- `GET /api/v1/health/ready` - Readiness probe

#### Metadata
- `GET /api/v1/meta` - API metadata
- `GET /api/v1/meta/version` - Version information

#### System Status
- `GET /api/v1/system/status` - System component status

## Configuration

### Environment Variables
All configuration via environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Application name | "EDUNEXT Backend" |
| `APP_VERSION` | Application version | "0.1.0" |
| `APP_ENV` | Environment (development/testing/production) | development |
| `DEBUG` | Debug mode | true |
| `API_V1_PREFIX` | API version prefix | `/api/v1` |
| `HOST` | Server host | `127.0.0.1` |
| `PORT` | Server port | `8000` |
| `CORS_ORIGINS` | Allowed CORS origins | Comma-separated list |
| `SECRET_KEY` | Secret key for JWT | (required) |
| `LOG_LEVEL` | Logging level | INFO |
| `AITHRON_AI_ENABLED` | AI features enabled | false |
| `SYNC_ENABLED` | Sync features enabled | false |

### CORS Configuration
- Configurable via `CORS_ORIGINS` environment variable
- Supports multiple origins
- Credentials allowed

## Service Status Definitions

Service states:
- `available` - Service is fully operational
- `unavailable` - Service is down or failing
- `not_integrated` - Service not yet integrated (planned)
- `unknown` - Status cannot be determined

Current service statuses:
- API: `available`
- Database: `not_integrated`
- EDUNEXT AI: `not_integrated`
- Sync: `not_integrated`
- Auth: `not_integrated`

## Error Handling

### Exception Hierarchy
- `AithronException` - Base exception
  - `ConfigurationError` - Configuration issues
  - `ValidationError` - Input validation failures
  - `NotFoundError` - Resource not found
  - `UnauthorizedError` - Authentication required
  - `ForbiddenError` - Access denied
  - `ServiceUnavailableError` - Service unavailable
  - `NotImplementedError` - Feature not implemented

### Error Response Format
```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": {}
}
```

## Testing

### Test Structure
- Unit tests in `tests/`
- Integration tests in `tests/test_integration.py`
- Fixtures in `conftest.py`

### Running Tests
```bash
pytest tests/ -v
```

### Test Coverage
- Health endpoints
- Metadata endpoints
- System status endpoints
- Configuration validation
- CORS configuration
- Error handling

## Running the Application

### Development
```bash
# Install dependencies
pip install -e ".[dev]"

# Run development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Production
```bash
# Install production dependencies
pip install -e ".[prod]"

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Future Extensions

### Database Integration (Future)
- PostgreSQL via SQLAlchemy
- Alembic migrations
- Repository pattern

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- OAuth2/OIDC integration

### EDUNEXT AI Integration
- Tutor service
- Translation service
- Pronunciation service
- Insights service

### EDUNEXT Sync
- Offline synchronization
- Conflict resolution
- Device management

## Security Considerations

- No secrets in code or repository
- CORS properly configured
- Secure headers via middleware
- Input validation via Pydantic
- Secure error messages (no internal details leaked)
- Request ID tracking for audit trail

## Monitoring & Observability

- Structured logging with request IDs
- Health check endpoints for orchestration
- Process time measurement
- Structured error logging

## Deployment Considerations

- Container-ready (Dockerfile to be added)
- Health checks for orchestration
- Graceful shutdown handling
- Configuration via environment variables
- No hardcoded secrets