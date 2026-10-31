"""Content Version model for versioning educational content."""

from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class ContentVersion(TimestampedUUIDModel):
    """Content version for versioning educational content (lessons, units, courses)."""
    
    __tablename__ = "content_versions"
    
    content_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        nullable=False,
        index=True,
    )
    content_type: Mapped[str] = mapped_column(String(50), nullable=False)
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    version_number: Mapped[int] = mapped_column(default=1, nullable=False)
    
    # Snapshot of the content at this version
    snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    
    # Metadata
    author_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        nullable=True,
    )
    change_summary: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    is_published: Mapped[bool] = mapped_column(default=False, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    validation_result: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    base_version_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("content_versions.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Relationships
    reviews: Mapped[List["ContentReview"]] = relationship(
        "ContentReview",
        back_populates="content_version",
        cascade="all, delete-orphan",
    )
    publications: Mapped[List["ContentPublication"]] = relationship(
        "ContentPublication",
        back_populates="content_version",
        cascade="all, delete-orphan",
    )
    base_version: Mapped[Optional["ContentVersion"]] = relationship(
        "ContentVersion",
        remote_side="ContentVersion.id",
        foreign_keys=[base_version_id],
    )
    
    __table_args__ = (
        UniqueConstraint("content_id", "version", name="uq_content_version"),
    )
    
    def __repr__(self) -> str:
        return f"<ContentVersion(id={self.id}, content_id={self.content_id}, version={self.version})>"