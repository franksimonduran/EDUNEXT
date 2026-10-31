"""User credential model for secure password storage."""

import enum
from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class CredentialStatus(str, enum.Enum):
    """Credential status."""
    ACTIVE = "active"
    EXPIRED = "expired"
    LOCKED = "locked"
    REVOKED = "revoked"


class UserCredential(TimestampedUUIDModel):
    """User credential model - stores password hash and metadata."""
    
    __tablename__ = "user_credentials"
    
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    password_algorithm: Mapped[str] = mapped_column(
        String(50), default="argon2id", nullable=False
    )
    password_changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    status: Mapped[CredentialStatus] = mapped_column(
        Enum(CredentialStatus, values_callable=lambda x: [e.value for e in x]),
        default=CredentialStatus.ACTIVE,
        nullable=False,
    )
    failed_attempts: Mapped[int] = mapped_column(default=0, nullable=False)
    locked_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    
    # Relationships
    user = relationship("User", back_populates="credential")
    
    def __repr__(self) -> str:
        return f"<UserCredential(user_id={self.user_id}, status={self.status})>"