"""Health check schemas."""

from pydantic import BaseModel


class LivenessResponse(BaseModel):
    """Liveness probe response."""

    status: str
    service: str


class ReadinessResponse(BaseModel):
    """Readiness probe response."""

    status: str
    service: str