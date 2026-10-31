"""Metadata schemas."""

from pydantic import BaseModel


class MetaResponse(BaseModel):
    """API metadata response."""

    name: str
    version: str
    description: str
    api_version: str
    docs_url: str


class VersionResponse(BaseModel):
    """Version information."""

    version: str
    api_version: str