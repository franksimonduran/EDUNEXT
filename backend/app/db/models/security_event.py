"""Security event model for audit logging."""

import enum
from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, Enum, Integer, func, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TimestampedUUIDModel


class SecurityEventType(str, enum.Enum):
    """Security event types."""
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    LOGOUT_ALL = "logout_all"
    TOKEN_REFRESH = "token_refresh"
    TOKEN_REFRESH_FAILED = "token_refresh_failed"
    TOKEN_REUSE_DETECTED = "token_reuse_detected"
    PASSWORD_CHANGED = "password_changed"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    PASSWORD_RESET_COMPLETED = "password_reset_completed"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    ACCOUNT_STATUS_CHANGED = "account_status_changed"
    SESSION_REVOKED = "session_revoked"
    SESSION_EXPIRED = "session_expired"
    PERMISSION_DENIED = "permission_denied"
    ROLE_ASSIGNED = "role_assigned"
    ROLE_REVOKED = "role_revoked"
    INSTITUTION_CONTEXT_CHANGED = "institution_context_changed"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"


class SecurityEventSeverity(str, enum.Enum):
    """Security event severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class SecurityEvent(TimestampedUUIDModel):
    """Security event for audit trail."""
    
    __tablename__ = "security_events"
    
    event_type: Mapped[SecurityEventType] = mapped_column(
        Enum(SecurityEventType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    severity: Mapped[SecurityEventSeverity] = mapped_column(
        Enum(SecurityEventSeverity, values_callable=lambda x: [e.value for e in x]),
        default=SecurityEventSeverity.INFO,
        nullable=False,
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    institution_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    session_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("auth_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True
    )
    
    __table_args__ = (
        Index("ix_security_events_user_occurred", "user_id", "occurred_at"),
        Index("ix_security_events_inst_occurred", "institution_id", "occurred_at"),
        Index("ix_security_events_type_occurred", "event_type", "occurred_at"),
    )
    
    def __repr__(self) -> str:
        return f"<SecurityEvent(id={self.id}, type={self.event_type}, user_id={self.user_id})>"