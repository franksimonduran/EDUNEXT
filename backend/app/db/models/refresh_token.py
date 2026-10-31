"""Refresh token model for secure token rotation."""

import enum
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class RefreshTokenStatus(str, enum.Enum):
    """Refresh token status."""
    VALID = "valid"
    USED = "used"
    REVOKED = "revoked"
    EXPIRED = "expired"
    REPLACED = "replaced"


class RefreshToken(TimestampedUUIDModel):
    """Refresh token model with rotation support."""
    
    __tablename__ = "refresh_tokens"
    
    session_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("auth_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[RefreshTokenStatus] = mapped_column(
        Enum(RefreshTokenStatus, values_callable=lambda x: [e.value for e in x]),
        default=RefreshTokenStatus.VALID,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revoke_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    replaced_by_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("refresh_tokens.id", ondelete="SET NULL"),
        nullable=True
    )
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    
    # Relationships
    session = relationship("AuthSession", back_populates="refresh_tokens")
    replaced_by = relationship("RefreshToken", remote_side="RefreshToken.id", backref="replaced_token")
    
    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id}, session_id={self.session_id}, status={self.status})>"
    
    @property
    def is_valid(self) -> bool:
        """Check if refresh token is currently valid."""
        now = datetime.now(timezone.utc)
        return (
            self.status == RefreshTokenStatus.VALID
            and self.expires_at > now
            and self.used_at is None
            and self.revoked_at is None
        )
    
    @property
    def is_expired(self) -> bool:
        """Check if refresh token has expired."""
        return datetime.now(timezone.utc) >= self.expires_at