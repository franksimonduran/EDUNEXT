"""Content Review, Publication, and Manifest models for editorial workflow."""

import enum
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class ContentReviewStatus(str, enum.Enum):
    """Content review status."""
    PENDING = "pending"
    IN_REVIEW = "in_review"
    CHANGES_REQUESTED = "changes_requested"
    APPROVED = "approved"
    REJECTED = "rejected"


class ContentReviewDecision(str, enum.Enum):
    """Content review decision."""
    APPROVE = "approve"
    REQUEST_CHANGES = "request_changes"
    REJECT = "reject"


class ContentPublicationStatus(str, enum.Enum):
    """Content publication status."""
    DRAFT = "draft"
    PENDING_PUBLICATION = "pending_publication"
    PUBLISHED = "published"
    WITHDRAWN = "withdrawn"
    SUPERSEDED = "superseded"
    ARCHIVED = "archived"


class ContentVisibility(str, enum.Enum):
    """Content visibility scope."""
    INSTITUTION = "institution"
    SHARED = "shared"
    PUBLIC = "public"


class ContentReview(TimestampedUUIDModel):
    """Content review for pedagogical validation."""

    __tablename__ = "content_reviews"

    content_version_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("content_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    reviewer_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[ContentReviewStatus] = mapped_column(
        default=ContentReviewStatus.PENDING,
        nullable=False,
    )
    decision: Mapped[Optional[ContentReviewDecision]] = mapped_column(nullable=True)
    observations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pedagogical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    technical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)

    # Relationships
    content_version = relationship("ContentVersion", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_user_id])
    institution = relationship("Institution")

    def __repr__(self) -> str:
        return f"<ContentReview(id={self.id}, version_id={self.content_version_id}, status={self.status})>"


class ContentPublication(TimestampedUUIDModel):
    """Content publication record."""

    __tablename__ = "content_publications"

    content_version_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("content_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    published_by_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    review_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("content_reviews.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[ContentPublicationStatus] = mapped_column(
        default=ContentPublicationStatus.DRAFT,
        nullable=False,
    )
    visibility: Mapped[ContentVisibility] = mapped_column(
        default=ContentVisibility.INSTITUTION,
        nullable=False,
    )
    shared_institution_ids: Mapped[list[str]] = mapped_column(
        ARRAY(UUID(as_uuid=False)),
        default=list,
        nullable=False,
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    withdrawn_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    withdrawal_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    publication_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    content_version = relationship("ContentVersion", back_populates="publications")
    institution = relationship("Institution")
    published_by = relationship("User", foreign_keys=[published_by_user_id])
    review = relationship("ContentReview", foreign_keys=[review_id])

    __table_args__ = (
        UniqueConstraint("content_version_id", name="uq_content_version_publication"),
    )

    def __repr__(self) -> str:
        return f"<ContentPublication(id={self.id}, version_id={self.content_version_id}, status={self.status})>"


class ContentManifest(TimestampedUUIDModel):
    """Content manifest for offline synchronization."""

    __tablename__ = "content_manifests"

    course_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    grade_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("grades.id", ondelete="CASCADE"),
        nullable=False,
    )
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    manifest_version: Mapped[int] = mapped_column(default=1, nullable=False)
    content_version_ids: Mapped[list[str]] = mapped_column(
        ARRAY(UUID(as_uuid=False)),
        default=list,
        nullable=False,
    )
    resource_ids: Mapped[list[str]] = mapped_column(
        ARRAY(UUID(as_uuid=False)),
        default=list,
        nullable=False,
    )
    checksums: Mapped[dict[str, str]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )
    required_resources: Mapped[list[str]] = mapped_column(
        ARRAY(UUID(as_uuid=False)),
        default=list,
        nullable=False,
    )
    total_size_bytes: Mapped[int] = mapped_column(default=0, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Relationships
    course = relationship("Course")
    grade = relationship("Grade")
    institution = relationship("Institution")

    __table_args__ = (
        UniqueConstraint("course_id", "grade_id", "version", name="uq_manifest_course_grade_version"),
    )

    def __repr__(self) -> str:
        return f"<ContentManifest(id={self.id}, course_id={self.course_id}, version={self.version})>"