# Backend Environment Configuration

## Overview

This document describes all environment variables used to configure the EDUNEXT backend.

## Core Application Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `APP_NAME` | Application name | `EDUNEXT Backend` | No |
| `APP_VERSION` | Application version | `0.1.0` | No |
| `APP_ENV` | Environment (development/testing/production) | `development` | No |
| `DEBUG` | Enable debug mode | `true` | No |

## API Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_V1_PREFIX` | API version prefix | `/api/v1` | No |
| `HOST` | Server bind address | `127.0.0.1` | No |
| `PORT` | Server port | `8000` | No |

## CORS Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `http://127.0.0.1:8080,http://localhost:8080,http://127.0.0.1:8080,http://localhost:8080` | No |

**Format:** Comma-separated list of origins. Example: `http://localhost:3000,https://app.example.com`

## Security

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SECRET_KEY` | Secret key for JWT signing | `dev-secret-key-change-in-production` | **Yes (production)** |
| `ALGORITHM` | JWT algorithm | `HS256` | No |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token expiration in minutes | `30` | No |

**Important:** In production, always set a strong `SECRET_KEY`. Generate with:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Database (Future Integration)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Not set | No (future) |

**Examples:**
```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/athron_edu

# SQLite (development only)
DATABASE_URL=sqlite:///./dev.db
```

**Note:** Database integration is planned for future phases. Currently not required.

## Logging

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | `INFO` | No |

## Feature Flags

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AITHRON_AI_ENABLED` | Enable AI features | `false` | No |
| `SYNC_ENABLED` | Enable synchronization features | `false` | No |

## Development vs Production

### Development (.env)
```bash
APP_ENV=development
DEBUG=true
LOG_LEVEL=DEBUG
CORS_ORIGINS=http://127.0.0.1:8080,http://localhost:8080
SECRET_KEY=dev-secret-key
```

### Production (example)
```bash
APP_ENV=production
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=https://app.athron.edu,https://admin.athron.edu
SECRET_KEY=your-very-secure-random-key-here
DATABASE_URL=postgresql://user:pass@db:5432/athron_edu
```

## Variable Priority

Settings are loaded in this order (later overrides earlier):
1. Default values (in `config.py`)
2. `.env` file (if present)
3. Environment variables (highest priority)

## Validation

All settings are validated at startup via Pydantic. Invalid configuration will cause startup failure with clear error messages.

## Security Notes

- Never commit `.env` files to version control
- Use `.env.example` as template
- Generate unique `SECRET_KEY` for each environment
- Never commit real database credentials
- Use different secrets for each environment
- Rotate secrets periodically in production

## Environment Detection

The application detects environment via `APP_ENV`:
- `development` - Local development
- `testing` - Automated tests
- `production` - Production deployment

This affects:
- Debug mode
- Documentation availability (`/docs`, `/redoc`)
- Error detail exposure
- Logging verbosity