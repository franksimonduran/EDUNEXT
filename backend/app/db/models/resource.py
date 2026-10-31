"""Resource models for educational resources."""

import enum
from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, Integer, UniqueConstraint, func, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class ResourceType(str, enum.Enum):
    """Resource type enumeration."""
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    DOCUMENT = "document"
    INTERACTIVE = "interactive"
    LINK = "link"
    ARCHIVE = "archive"
    OTHER = "other"


class ResourceStatus(str, enum.Enum):
    """Resource status."""
    DRAFT = "draft"
    AVAILABLE = "available"
    PROCESSING = "processing"
    FAILED = "failed"
    ARCHIVED = "archived"


class Resource(TimestampedUUIDModel):
    """Educational resource model."""
    
    __tablename__ = "resources"
    
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("courses.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resource_type: Mapped[ResourceType] = mapped_column(
        Enum(ResourceType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    media_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(nullable=True)
    storage_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    storage_provider: Mapped[str] = mapped_column(String(50), default="local", nullable=False)
    checksum: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    checksum_algorithm: Mapped[str] = mapped_column(String(20), default="sha256", nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    status: Mapped[ResourceStatus] = mapped_column(
        Enum(ResourceStatus, values_callable=lambda x: [e.value for e in x]),
        default=ResourceStatus.DRAFT,
        nullable=False,
    )
    
    # Metadata
    author_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), nullable=True)
    license: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    license_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(100)), default=list, nullable=False)
    metadata_: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Offline availability
    is_offline_available: Mapped[bool] = mapped_column(default=False, nullable=False)
    offline_size: Mapped[Optional[int]] = mapped_column(nullable=True)
    cached_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # Relationships
    institution = relationship("Institution", back_populates="resources")
    course = relationship("Course", back_populates="resources")
    lesson_resources = relationship("LessonResource", back_populates="resource")
    
    def __repr__(self) -> str:
        return f"<Resource(id={self.id}, name={self.name}, type={self.resource_type})>"


class LessonResource(TimestampedUUIDModel):
    """Association between lessons and resources with ordering."""
    
    __tablename__ = "lesson_resources"
    
    lesson_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
    )
    resource_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("resources.id", ondelete="CASCADE"),
        nullable=False,
    )
    order: Mapped[int] = mapped_column(default=0, nullable=False)
    is_required: Mapped[bool] = mapped_column(default=False, nullable=False)
    usage_context: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Relationships
    lesson = relationship("Lesson", back_populates="resources")
    resource = relationship("Resource", back_populates="lesson_resources")
    
    __table_args__ = (
        UniqueConstraint("lesson_id", "resource_id", name="uq_lesson_resource"),
    )
    
    def __repr__(self) -> str:
        return f"<LessonResource(lesson_id={self.lesson_id}, resource_id={self.resource_id})>"