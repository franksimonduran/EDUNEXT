"""Reinforcement plan models."""

import enum
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, Integer, JSON, UniqueConstraint, func, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class ReinforcementType(str, enum.Enum):
    """Reinforcement type."""
    REMEDIAL = "remedial"
    ENRICHMENT = "enrichment"
    EXTENSION = "extension"
    PRACTICE = "practice"


class ReinforcementStatus(str, enum.Enum):
    """Reinforcement status."""
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ReinforcementPlan(TimestampedUUIDModel):
    """Reinforcement plan for students needing additional support."""
    
    __tablename__ = "reinforcement_plans"
    
    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    unit_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("units.id", ondelete="SET NULL"),
        nullable=True,
    )
    lesson_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("lessons.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reinforcement_type: Mapped[ReinforcementType] = mapped_column(
        Enum(ReinforcementType, values_callable=lambda x: [e.value for e in x]),
        default=ReinforcementType.REMEDIAL,
        nullable=False,
    )
    status: Mapped[ReinforcementStatus] = mapped_column(
        Enum(ReinforcementStatus, values_callable=lambda x: [e.value for e in x]),
        default=ReinforcementStatus.DRAFT,
        nullable=False,
    )
    
    # Content
    objectives: Mapped[list[str]] = mapped_column(ARRAY(String(255)), default=list, nullable=False)
    activities: Mapped[list[Dict[str, Any]]] = mapped_column(JSONB, default=list, nullable=False)
    resources: Mapped[list[str]] = mapped_column(ARRAY(UUID(as_uuid=False)), default=list, nullable=False)
    
    # Scheduling
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    frequency: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(nullable=True)
    frequency_per_week: Mapped[Optional[int]] = mapped_column(nullable=True)
    
    # Assignment
    assigned_by: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("monitor_profiles.id", ondelete="SET NULL"),
        nullable=False,
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Status
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_by: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), nullable=True)
    
    # Progress tracking
    progress_percentage: Mapped[float] = mapped_column(default=0.0, nullable=False)
    completed_activities: Mapped[list[str]] = mapped_column(ARRAY(UUID(as_uuid=False)), default=list, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Relationships
    student = relationship("StudentProfile")
    course = relationship("Course")
    unit = relationship("Unit")
    lesson = relationship("Lesson")
    assigner = relationship("MonitorProfile", foreign_keys=[assigned_by])
    
    def __repr__(self) -> str:
        return f"<ReinforcementPlan(id={self.id}, student_id={self.student_id}, title={self.title})>"