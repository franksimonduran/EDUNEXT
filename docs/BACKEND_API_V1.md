# EDUNEXT Backend API v1

## Overview

The EDUNEXT Backend API v1 provides a RESTful interface for the EDUNEXT educational platform. All endpoints are prefixed with `/api/v1`.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

Protected endpoints require `Authorization: Bearer <access_token>`. Access tokens are short-lived; refresh uses the HttpOnly refresh cookie and requires the `X-CSRF-Token` header. See `docs/AUTHENTICATION_ARCHITECTURE.md` for the full flow.

## Endpoints

### Health Checks

#### Liveness Probe
```
GET /api/v1/health/live
```

Returns a simple status indicating the service is running.

**Response:**
```json
{
  "status": "alive",
  "service": "athron-edu-backend"
}
```

**Status Codes:**
- `200 OK` - Service is running

---

#### Readiness Probe
```
GET /api/v1/health/ready
```

Returns status indicating if the service is ready to accept traffic.

**Response:**
```json
{
  "status": "ready",
  "service": "athron-edu-backend"
}
```

**Status Codes:**
- `200 OK` - Service is ready

### Metadata

#### API Metadata
```
GET /api/v1/meta
```

Returns public metadata about the API.

**Response:**
```json
{
  "name": "EDUNEXT Backend",
  "version": "0.1.0",
  "description": "Backend API for EDUNEXT educational platform",
  "api_version": "v1",
  "docs_url": "/docs"
}
```

#### API Version
```
GET /api/v1/meta/version
```

Returns version information.

**Response:**
```json
{
  "version": "0.1.0",
  "api_version": "v1"
}
```

### System Status

#### System Status
```
GET /api/v1/system/status
```

Returns the status of all system components.

**Response:**
```json
{
  "api": "available",
  "database": "not_integrated",
  "athron_ai": "not_integrated",
  "sync": "not_integrated",
  "auth": "not_integrated"
}
```

**Service States:**
- `available` - Fully operational
- `not_integrated` - Not yet implemented/integrated
- `unavailable` - Service unavailable
- `unknown` - Status unknown

### Academic Organization (Phase 37)

All academic endpoints are institution-scoped. List endpoints accept `page`, `page_size` and `search` where applicable and return `{items, total, page, page_size, pages}`.

| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/v1/academic-years` | List/create academic years |
| GET/PATCH | `/api/v1/academic-years/{year_id}` | Read/update an academic year |
| GET/POST | `/api/v1/academic-periods` | List/create periods |
| GET/PATCH | `/api/v1/academic-periods/{period_id}` | Read/update a period |
| GET | `/api/v1/grades` | Read the shared grade catalog |
| GET/POST | `/api/v1/sections` | List/create sections |
| GET/PATCH | `/api/v1/sections/{section_id}` | Read/update a section |
| GET/POST | `/api/v1/classrooms` | List/create classrooms |
| GET/PATCH | `/api/v1/classrooms/{classroom_id}` | Read/update a classroom |
| POST | `/api/v1/classrooms/{classroom_id}/archive` | Archive a classroom |
| GET | `/api/v1/classrooms/{classroom_id}/students` | List classroom students |
| GET | `/api/v1/monitors/me/classrooms` | List the monitor's classrooms |
| GET/POST | `/api/v1/enrollments` | List/create enrollments |
| GET/PATCH | `/api/v1/enrollments/{enrollment_id}` | Read/update an enrollment |
| POST | `/api/v1/enrollments/{enrollment_id}/withdraw` | Withdraw a student |
| POST | `/api/v1/enrollments/{enrollment_id}/complete` | Complete an enrollment |
| POST | `/api/v1/enrollments/{enrollment_id}/transfer` | Transfer to another classroom |
| GET | `/api/v1/academic-movements` | Read academic movement history |
| GET/POST | `/api/v1/teacher-assignments` | List/create teacher assignments |
| GET/PATCH | `/api/v1/teacher-assignments/{assignment_id}` | Read/update an assignment |
| POST | `/api/v1/teacher-assignments/{assignment_id}/revoke` | Revoke an assignment |

`POST /enrollments` and `POST /enrollments/{id}/transfer` accept an `Idempotency-Key` header. The key is valid for 24 hours per institution, user and operation; reusing it with a different payload returns `409 Conflict`.

See `docs/phase37.md` for business rules and the permission matrix.

## Error Responses

Application errors follow this format:

```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

FastAPI's built-in request validation returns `422` with its standard `detail` array.

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 422 | Input validation failed |
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Access forbidden |
| INTERNAL_ERROR | 500 | Internal server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |
| NOT_IMPLEMENTED | 501 | Feature not implemented |

## Rate Limiting

Authentication endpoints are rate limited. Other endpoint-specific limits may be added in future versions.

## Pagination

List endpoints use `page` (default `1`), `page_size` (default `20`, maximum `100`) and optional `search`. Responses contain `items`, `total`, `page`, `page_size` and `pages`.

## Versioning

API versioning is handled via URL prefix: `/api/v1/`

Future versions will use `/api/v2/`, `/api/v3/`, etc.

## CORS

CORS is configured to allow origins from the frontend development servers. Configure via `CORS_ORIGINS` environment variable.

## OpenAPI Documentation

Interactive API documentation available at:
- Swagger UI: `/docs`
- ReDoc: `/redoc`

Only available in development mode (`DEBUG=true`).