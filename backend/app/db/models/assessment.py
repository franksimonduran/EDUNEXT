"""Assessment models."""

import enum
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, Integer, Float, UniqueConstraint, func, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class AssessmentType(str, enum.Enum):
    """Assessment type."""
    DIAGNOSTIC = "diagnostic"
    FORMATIVE = "formative"
    SUMMATIVE = "summative"
    PRACTICE = "practice"
    EXAM = "exam"


class AssessmentStatus(str, enum.Enum):
    """Assessment status."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class AssessmentQuestionType(str, enum.Enum):
    """Assessment question type."""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"
    FILL_BLANK = "fill_blank"
    MATCHING = "matching"
    ORDERING = "ordering"
    DRAG_DROP = "drag_drop"


class Assessment(TimestampedUUIDModel):
    """Assessment model."""
    
    __tablename__ = "assessments"
    
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
    period_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("academic_periods.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assessment_type: Mapped[AssessmentType] = mapped_column(
        Enum(AssessmentType, values_callable=lambda x: [e.value for e in x]),
        default=AssessmentType.FORMATIVE,
        nullable=False,
    )
    status: Mapped[AssessmentStatus] = mapped_column(
        Enum(AssessmentStatus, values_callable=lambda x: [e.value for e in x]),
        default=AssessmentStatus.DRAFT,
        nullable=False,
    )
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    
    # Configuration
    time_limit_minutes: Mapped[Optional[int]] = mapped_column(nullable=True)
    max_attempts: Mapped[int] = mapped_column(default=1, nullable=False)
    passing_score: Mapped[Optional[float]] = mapped_column(nullable=True)
    show_results_immediately: Mapped[bool] = mapped_column(default=True, nullable=False)
    show_correct_answers: Mapped[bool] = mapped_column(default=False, nullable=False)
    shuffle_questions: Mapped[bool] = mapped_column(default=False, nullable=False)
    shuffle_options: Mapped[bool] = mapped_column(default=False, nullable=False)
    
    # Dates
    available_from: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    available_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    tags: Mapped[list] = mapped_column(ARRAY(String(50)), default=list, nullable=False)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    settings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="assessments")
    unit = relationship("Unit", back_populates="assessments")
    period = relationship("AcademicPeriod", back_populates="assessments")
    questions = relationship("AssessmentQuestion", back_populates="assessment", order_by="AssessmentQuestion.sequence")
    attempts = relationship("AssessmentAttempt", back_populates="assessment")
    
    __table_args__ = (
        UniqueConstraint("course_id", "title", "version", name="uq_assessment_course_version"),
    )
    
    def __repr__(self) -> str:
        return f"<Assessment(id={self.id}, title={self.title}, course_id={self.course_id})>"


class AssessmentQuestion(TimestampedUUIDModel):
    """Assessment question model."""
    
    __tablename__ = "assessment_questions"
    
    assessment_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
    )
    lesson_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("lessons.id", ondelete="SET NULL"),
        nullable=True,
    )
    question_type: Mapped[AssessmentQuestionType] = mapped_column(
        Enum(AssessmentQuestionType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    sequence: Mapped[int] = mapped_column(default=0, nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Configuration
    points: Mapped[float] = mapped_column(default=1.0, nullable=False)
    penalty: Mapped[float] = mapped_column(default=0.0, nullable=False)
    time_limit_seconds: Mapped[Optional[int]] = mapped_column(nullable=True)
    difficulty_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    tags: Mapped[list] = mapped_column(ARRAY(String(50)), default=list, nullable=False)
    
    # Question content (varies by type)
    options: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    correct_answer: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    
    # Metadata
    is_required: Mapped[bool] = mapped_column(default=True, nullable=False)
    difficulty: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    estimated_time_seconds: Mapped[Optional[int]] = mapped_column(nullable=True)
    settings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="questions")
    lesson = relationship("Lesson", back_populates="assessment_questions")
    responses = relationship("AssessmentResponse", back_populates="question")
    
    def __repr__(self) -> str:
        return f"<AssessmentQuestion(id={self.id}, assessment_id={self.assessment_id}, type={self.question_type})>"


class AssessmentAttempt(TimestampedUUIDModel):
    """Student attempt at an assessment."""
    
    __tablename__ = "assessment_attempts"
    
    assessment_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    attempt_number: Mapped[int] = mapped_column(default=1, nullable=False)
    
    status: Mapped[str] = mapped_column(String(20), default="in_progress", nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    time_spent_seconds: Mapped[Optional[int]] = mapped_column(nullable=True)
    
    # Scores
    raw_score: Mapped[Optional[float]] = mapped_column(nullable=True)
    max_score: Mapped[Optional[float]] = mapped_column(nullable=True)
    percentage_score: Mapped[Optional[float]] = mapped_column(nullable=True)
    passed: Mapped[Optional[bool]] = mapped_column(nullable=True)
    
    # Grading
    graded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    graded_by: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("monitor_profiles.id"), nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Metadata
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    metadata_: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="attempts")
    student = relationship("StudentProfile", back_populates="assessment_attempts")
    responses = relationship("AssessmentResponse", back_populates="attempt", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<AssessmentAttempt(id={self.id}, assessment_id={self.assessment_id}, student_id={self.student_id})>"


class AssessmentResponse(TimestampedUUIDModel):
    """Student's response to an assessment question."""
    
    __tablename__ = "assessment_responses"
    
    attempt_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("assessment_attempts.id", ondelete="CASCADE"),
        nullable=False,
    )
    question_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("assessment_questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    response_data: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    is_correct: Mapped[Optional[bool]] = mapped_column(nullable=True)
    points_earned: Mapped[Optional[float]] = mapped_column(nullable=True)
    max_points: Mapped[Optional[float]] = mapped_column(nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    time_spent_seconds: Mapped[Optional[int]] = mapped_column(nullable=True)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    attempt = relationship("AssessmentAttempt", back_populates="responses")
    question = relationship("AssessmentQuestion", back_populates="responses")
    
    def __repr__(self) -> str:
        return f"<AssessmentResponse(attempt_id={self.attempt_id}, question_id={self.question_id})>"


class AssessmentResult(TimestampedUUIDModel):
    """Aggregated assessment result."""
    
    __tablename__ = "assessment_results"
    
    assessment_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    attempt_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("assessment_attempts.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Scores
    raw_score: Mapped[float] = mapped_column(default=0.0, nullable=False)
    max_score: Mapped[float] = mapped_column(default=0.0, nullable=False)
    percentage: Mapped[float] = mapped_column(default=0.0, nullable=False)
    passed: Mapped[bool] = mapped_column(default=False, nullable=False)
    
    # Breakdown
    score_by_question: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    grade: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    
    # Metadata
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("monitor_profiles.id"), nullable=True)
    
    # Relationships
    assessment = relationship("Assessment")
    student = relationship("StudentProfile")
    attempt = relationship("AssessmentAttempt")
    
    def __repr__(self) -> str:
        return f"<AssessmentResult(id={self.id}, assessment_id={self.assessment_id}, percentage={self.percentage})>"