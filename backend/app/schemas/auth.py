"""Authentication schemas for request/response validation."""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# Login schemas
class LoginRequest(BaseModel):
    """Login request payload."""
    identifier: str = Field(..., min_length=1, max_length=255, description="Username, email, or student code")
    password: str = Field(..., min_length=1, max_length=128, description="Password")
    remember_me: bool = Field(default=False, description="Extend session duration")


class LoginResponse(BaseModel):
    """Login response payload."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token lifetime in seconds")
    csrf_token: str = Field(..., description="CSRF token for state-changing requests")
    user: "UserPublic" = Field(..., description="Authenticated user info")
    institution: "InstitutionPublic" = Field(..., description="Active institution context")


# Token schemas
class TokenRefreshRequest(BaseModel):
    """Token refresh request (uses cookie, but CSRF token in header)."""
    csrf_token: Optional[str] = Field(None, description="CSRF token from cookie/header")


class TokenRefreshResponse(BaseModel):
    """Token refresh response."""
    access_token: str = Field(..., description="New JWT access token")
    token_type: str = Field(default="bearer")
    expires_in: int = Field(..., description="Access token lifetime in seconds")
    csrf_token: str = Field(..., description="Rotated CSRF token for state-changing requests")


class LogoutRequest(BaseModel):
    """Logout request (CSRF protected)."""
    csrf_token: Optional[str] = Field(None, description="CSRF token")


class LogoutAllRequest(BaseModel):
    """Logout all sessions request (requires password confirmation)."""
    password: str = Field(..., min_length=1, max_length=128, description="Current password for confirmation")
    csrf_token: Optional[str] = Field(None, description="CSRF token")


# User schemas
class UserPublic(BaseModel):
    """Public user information."""
    id: UUID
    username: Optional[str] = None
    display_name: str
    email: Optional[EmailStr] = None
    status: str
    roles: List[str] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class InstitutionPublic(BaseModel):
    """Public institution information."""
    id: UUID
    name: str
    code: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class CurrentUserResponse(BaseModel):
    """Current authenticated user response."""
    user: UserPublic
    institution: InstitutionPublic
    roles: List[str]
    permissions: List[str]
    session_id: UUID
    session_expires_at: datetime


# Password change schemas
class PasswordChangeRequest(BaseModel):
    """Password change request."""
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=15, max_length=128)
    csrf_token: Optional[str] = Field(None)


class PasswordChangeResponse(BaseModel):
    """Password change response."""
    message: str = "Password changed successfully"
    sessions_revoked: bool = True


# Password reset schemas
class PasswordResetRequest(BaseModel):
    """Password reset request."""
    identifier: str = Field(..., min_length=1, max_length=255, description="Email or username")
    csrf_token: Optional[str] = Field(None)


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation."""
    token: str = Field(..., min_length=1, max_length=255)
    new_password: str = Field(..., min_length=15, max_length=128)
    csrf_token: Optional[str] = Field(None)


# Session schemas
class SessionInfo(BaseModel):
    """Session information."""
    id: UUID
    institution_id: UUID
    institution_name: str
    status: str
    created_at: datetime
    last_seen_at: datetime
    expires_at: datetime
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    is_current: bool = False
    model_config = ConfigDict(from_attributes=True)


class SessionsResponse(BaseModel):
    """Active sessions response."""
    sessions: List[SessionInfo]


# CSRF schemas
class CSRFResponse(BaseModel):
    """CSRF token response."""
    csrf_token: str
    csrf_cookie_name: str
    csrf_header_name: str


# Error schemas
class AuthErrorResponse(BaseModel):
    """Authentication error response."""
    error: str
    error_description: Optional[str] = None
    error_code: Optional[str] = None


# Rate limit info
class RateLimitInfo(BaseModel):
    """Rate limit information."""
    limit: int
    remaining: int
    reset_at: datetime
