"""Auth session model for server-side session management."""

import enum
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Enum, Integer, func
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class SessionStatus(str, enum.Enum):
    """Session status."""
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    LOGGED_OUT = "logged_out"


class AuthSession(TimestampedUUIDModel):
    """Authentication session model."""
    
    __tablename__ = "auth_sessions"
    
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, values_callable=lambda x: [e.value for e in x]),
        default=SessionStatus.ACTIVE,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revoke_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    session_version: Mapped[int] = mapped_column(default=1, nullable=False)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    created_by_method: Mapped[str] = mapped_column(String(50), default="password", nullable=False)
    
    # Relationships
    user = relationship("User")
    institution = relationship("Institution")
    refresh_tokens = relationship("RefreshToken", back_populates="session", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<AuthSession(id={self.id}, user_id={self.user_id}, status={self.status})>"
    
    @property
    def is_active(self) -> bool:
        """Check if session is currently active."""
        now = datetime.now(timezone.utc)
        return (
            self.status == SessionStatus.ACTIVE
            and self.expires_at > now
            and self.revoked_at is None
        )
    
    @property
    def is_expired(self) -> bool:
        """Check if session has expired."""
        return datetime.now(timezone.utc) >= self.expires_at