"""System status schemas."""

from pydantic import BaseModel


class ServiceStatus(BaseModel):
    """Status of a single service."""

    name: str
    status: str  # available, unavailable, not_integrated, unknown
    details: str | None = None


class SystemStatusResponse(BaseModel):
    """System status response."""

    api: str
    database: str
    athron_ai: str
    sync: str
    auth: str