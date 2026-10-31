"""Practice Engine models for educational practices, exercises, attempts, and games."""

import enum
from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, Integer, func
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class PracticeStatus(str, enum.Enum):
    """Practice status following editorial workflow."""
    DRAFT = "draft"
    READY_FOR_REVIEW = "ready_for_review"
    IN_REVIEW = "in_review"
    CHANGES_REQUESTED = "changes_requested"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class PracticeType(str, enum.Enum):
    """Types of educational practices."""
    REVIEW = "review"
    COMPREHENSION = "comprehension"
    CALCULATION = "calculation"
    VOCABULARY = "vocabulary"
    ORDERING = "ordering"
    UNIT_REVIEW = "unit_review"
    REINFORCEMENT = "reinforcement"
    CHALLENGE = "challenge"


class PracticeDifficulty(str, enum.Enum):
    """Difficulty levels for practices."""
    INITIAL = "initial"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ExerciseType(str, enum.Enum):
    """Types of exercises that can be auto-scored."""
    SINGLE_CHOICE = "single_choice"
    TRUE_FALSE = "true_false"
    MULTIPLE_CHOICE = "multiple_choice"
    MATCHING = "matching"
    ORDERING = "ordering"
    NUMERIC = "numeric"
    FILL_BLANK = "fill_blank"
    CLASSIFICATION = "classification"
    OPEN_RESPONSE = "open_response"


class AttemptStatus(str, enum.Enum):
    """Practice attempt status."""
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    AUTO_REVIEWED = "auto_reviewed"
    NEEDS_MANUAL_REVIEW = "needs_manual_review"
    REVIEWED = "reviewed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class GameType(str, enum.Enum):
    """Types of educational games."""
    MATCHING = "matching"
    ORDERING = "ordering"
    MEMORY = "memory"
    CLASSIFICATION = "classification"
    WORD_COMPLETION = "word_completion"
    QUICK_CHALLENGE = "quick_challenge"
    IMAGE_WORD_ASSOCIATION = "image_word_association"


class GameSessionStatus(str, enum.Enum):
    """Game session status."""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class Practice(TimestampedUUIDModel):
    """Practice/activity model representing an educational practice."""

    __tablename__ = "practices"

    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
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
    practice_type: Mapped[PracticeType] = mapped_column(
        default=PracticeType.REVIEW,
        nullable=False,
    )
    difficulty: Mapped[PracticeDifficulty] = mapped_column(
        default=PracticeDifficulty.INTERMEDIATE,
        nullable=False,
    )
    status: Mapped[PracticeStatus] = mapped_column(
        default=PracticeStatus.DRAFT,
        nullable=False,
    )
    
    # Configuration
    max_attempts: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    time_limit_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    shuffle_questions: Mapped[bool] = mapped_column(default=False, nullable=False)
    shuffle_options: Mapped[bool] = mapped_column(default=False, nullable=False)
    show_solutions_after: Mapped[str] = mapped_column(String(20), default="attempt", nullable=False)
    allow_partial_progress: Mapped[bool] = mapped_column(default=True, nullable=False)
    show_hints: Mapped[bool] = mapped_column(default=True, nullable=False)
    
    # Scoring
    max_score: Mapped[int] = mapped_column(default=100, nullable=False)
    passing_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    partial_scoring: Mapped[bool] = mapped_column(default=True, nullable=False)
    
    # Metadata
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(50)), default=list, nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
    )

    # Relationships
    institution = relationship("Institution", back_populates="practices")
    course = relationship("Course", back_populates="practices")
    unit = relationship("Unit", back_populates="practices")
    lesson = relationship("Lesson", back_populates="practices")
    versions = relationship("PracticeVersion", back_populates="practice", order_by="PracticeVersion.version_number")
    exercises = relationship("Exercise", back_populates="practice", order_by="Exercise.sequence")
    attempts = relationship("PracticeAttempt", back_populates="practice")
    games = relationship("EducationalGame", back_populates="practice")

    __table_args__ = (
        UniqueConstraint("institution_id", "course_id", "title", name="uq_practice_course_title"),
    )

    def __repr__(self) -> str:
        return f"<Practice(id={self.id}, title={self.title}, type={self.practice_type})>"


class PracticeVersion(TimestampedUUIDModel):
    """Immutable version of a practice for attempt tracking."""

    __tablename__ = "practice_versions"

    practice_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("practices.id", ondelete="CASCADE"),
        nullable=False,
    )
    version_number: Mapped[int] = mapped_column(default=1, nullable=False)
    status: Mapped[PracticeStatus] = mapped_column(
        default=PracticeStatus.DRAFT,
        nullable=False,
    )
    
    # Snapshot of the practice at this version
    snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    
    # Configuration snapshot
    config_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    
    # Exercises snapshot
    exercises_snapshot: Mapped[list[dict]] = mapped_column(JSONB, default=list, nullable=False)
    
    # Metadata
    author_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), nullable=True)
    change_summary: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # Relationships
    practice = relationship("Practice", back_populates="versions")
    attempts = relationship("PracticeAttempt", back_populates="version")
    exercises = relationship("Exercise", back_populates="version")

    __table_args__ = (
        UniqueConstraint("practice_id", "version_number", name="uq_practice_version"),
    )

    def __repr__(self) -> str:
        return f"<PracticeVersion(id={self.id}, practice_id={self.practice_id}, version={self.version_number})>"


class Exercise(TimestampedUUIDModel):
    """Exercise/question within a practice version."""

    __tablename__ = "exercises"

    practice_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("practices.id", ondelete="CASCADE"),
        nullable=False,
    )
    version_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("practice_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    exercise_type: Mapped[ExerciseType] = mapped_column(nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    sequence: Mapped[int] = mapped_column(default=0, nullable=False)
    points: Mapped[int] = mapped_column(default=1, nullable=False)
    
    # Scoring configuration
    scoring_rule: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    feedback_config: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    hints: Mapped[list[str]] = mapped_column(ARRAY(String(500)), default=list, nullable=False)
    
    # Metadata
    difficulty: Mapped[Optional[PracticeDifficulty]] = mapped_column(nullable=True)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(50)), default=list, nullable=False)
    learning_objective: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Resources
    resource_ids: Mapped[list[str]] = mapped_column(ARRAY(UUID(as_uuid=False)), default=list, nullable=False)
    
    # Relationships
    practice = relationship("Practice", back_populates="exercises")
    version = relationship("PracticeVersion", back_populates="exercises")
    options = relationship("ExerciseOption", back_populates="exercise", order_by="ExerciseOption.sequence")
    responses = relationship("PracticeResponse", back_populates="exercise")

    __table_args__ = (
        UniqueConstraint("version_id", "sequence", name="uq_exercise_version_sequence"),
    )

    def __repr__(self) -> str:
        return f"<Exercise(id={self.id}, type={self.exercise_type}, sequence={self.sequence})>"


class ExerciseOption(TimestampedUUIDModel):
    """Options for choice-based exercises."""

    __tablename__ = "exercise_options"

    exercise_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("exercises.id", ondelete="CASCADE"),
        nullable=False,
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    sequence: Mapped[int] = mapped_column(default=0, nullable=False)
    is_correct: Mapped[bool] = mapped_column(default=False, nullable=False)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # Relationships
    exercise = relationship("Exercise", back_populates="options")

    def __repr__(self) -> str:
        return f"<ExerciseOption(id={self.id}, exercise_id={self.exercise_id}, correct={self.is_correct})>"


class PracticeAttempt(TimestampedUUIDModel):
    """Student attempt at a practice."""

    __tablename__ = "practice_attempts"

    practice_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("practices.id", ondelete="CASCADE"),
        nullable=False,
    )
    version_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("practice_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_profile_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    enrollment_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("enrollments.id", ondelete="SET NULL"),
        nullable=True,
    )
    attempt_number: Mapped[int] = mapped_column(default=1, nullable=False)
    status: Mapped[AttemptStatus] = mapped_column(
        default=AttemptStatus.IN_PROGRESS,
        nullable=False,
    )
    
    # Progress tracking
    current_exercise_index: Mapped[int] = mapped_column(default=0, nullable=False)
    exercises_answered: Mapped[int] = mapped_column(default=0, nullable=False)
    
    # Scoring
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_possible_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    percentage: Mapped[Optional[float]] = mapped_column(nullable=True)
    exercises_correct: Mapped[int] = mapped_column(default=0, nullable=False)
    exercises_incorrect: Mapped[int] = mapped_column(default=0, nullable=False)
    exercises_pending_review: Mapped[int] = mapped_column(default=0, nullable=False)
    
    # Timing
    started_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    time_spent_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Offline support
    is_offline: Mapped[bool] = mapped_column(default=False, nullable=False)
    sync_status: Mapped[str] = mapped_column(String(20), default="synced", nullable=False)
    local_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Relationships
    practice = relationship("Practice", back_populates="attempts")
    version = relationship("PracticeVersion", back_populates="attempts")
    student_profile = relationship("StudentProfile", back_populates="practice_attempts")
    institution = relationship("Institution")
    enrollment = relationship("Enrollment")
    responses = relationship("PracticeResponse", back_populates="attempt", cascade="all, delete-orphan")
    result = relationship("PracticeResult", back_populates="attempt", uselist=False)

    __table_args__ = (
        UniqueConstraint("student_profile_id", "version_id", "attempt_number", name="uq_attempt_student_version_number"),
    )

    def __repr__(self) -> str:
        return f"<PracticeAttempt(id={self.id}, student={self.student_profile_id}, version={self.version_id}, status={self.status})>"


class PracticeResponse(TimestampedUUIDModel):
    """Student response to an exercise within an attempt."""

    __tablename__ = "practice_responses"

    attempt_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("practice_attempts.id", ondelete="CASCADE"),
        nullable=False,
    )
    exercise_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("exercises.id", ondelete="CASCADE"),
        nullable=False,
    )
    answer_data: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    response_status: Mapped[str] = mapped_column(String(20), default="saved", nullable=False)
    
    # Auto-scoring results (populated after submission)
    is_correct: Mapped[Optional[bool]] = mapped_column(nullable=True)
    points_earned: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_points: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    auto_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scoring_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Manual review (for open responses)
    needs_review: Mapped[bool] = mapped_column(default=False, nullable=False)
    reviewed_by: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), nullable=True)
    reviewer_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewer_points: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # Timing
    saved_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    time_spent_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Relationships
    attempt = relationship("PracticeAttempt", back_populates="responses")
    exercise = relationship("Exercise", back_populates="responses")

    __table_args__ = (
        UniqueConstraint("attempt_id", "exercise_id", name="uq_response_attempt_exercise"),
    )

    def __repr__(self) -> str:
        return f"<PracticeResponse(id={self.id}, attempt={self.attempt_id}, exercise={self.exercise_id})>"


class PracticeResult(TimestampedUUIDModel):
    """Final formative result of a practice attempt."""

    __tablename__ = "practice_results"

    attempt_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("practice_attempts.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_profile_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    practice_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("practices.id", ondelete="CASCADE"),
        nullable=False,
    )
    version_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("practice_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Scoring
    score: Mapped[int] = mapped_column(default=0, nullable=False)
    max_score: Mapped[int] = mapped_column(default=0, nullable=False)
    percentage: Mapped[float] = mapped_column(default=0.0, nullable=False)
    passed: Mapped[Optional[bool]] = mapped_column(nullable=True)
    
    # Exercise breakdown
    total_exercises: Mapped[int] = mapped_column(default=0, nullable=False)
    correct_exercises: Mapped[int] = mapped_column(default=0, nullable=False)
    incorrect_exercises: Mapped[int] = mapped_column(default=0, nullable=False)
    pending_review_exercises: Mapped[int] = mapped_column(default=0, nullable=False)
    
    # Feedback status
    feedback_status: Mapped[str] = mapped_column(String(20), default="auto", nullable=False)
    auto_feedback_generated: Mapped[bool] = mapped_column(default=False, nullable=False)
    manual_feedback_added: Mapped[bool] = mapped_column(default=False, nullable=False)
    
    # Timing
    finalized_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # Relationships
    attempt = relationship("PracticeAttempt", back_populates="result")
    student_profile = relationship("StudentProfile")
    practice = relationship("Practice")
    version = relationship("PracticeVersion")
    institution = relationship("Institution")
    feedback_items = relationship("PracticeFeedback", back_populates="result", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<PracticeResult(id={self.id}, attempt={self.attempt_id}, score={self.score}/{self.max_score})>"


class PracticeFeedback(TimestampedUUIDModel):
    """Feedback items for practice results."""

    __tablename__ = "practice_feedback"

    result_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("practice_results.id", ondelete="CASCADE"),
        nullable=False,
    )
    exercise_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("exercises.id", ondelete="SET NULL"),
        nullable=True,
    )
    feedback_type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_positive: Mapped[bool] = mapped_column(default=True, nullable=False)
    resources_recommended: Mapped[list[str]] = mapped_column(ARRAY(UUID(as_uuid=False)), default=list, nullable=False)
    lessons_recommended: Mapped[list[str]] = mapped_column(ARRAY(UUID(as_uuid=False)), default=list, nullable=False)

    # Relationships
    result = relationship("PracticeResult", back_populates="feedback_items")
    exercise = relationship("Exercise")

    def __repr__(self) -> str:
        return f"<PracticeFeedback(id={self.id}, result={self.result_id}, type={self.feedback_type})>"


class EducationalGame(TimestampedUUIDModel):
    """Educational game model."""

    __tablename__ = "educational_games"

    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    practice_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("practices.id", ondelete="SET NULL"),
        nullable=True,
    )
    course_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("courses.id", ondelete="SET NULL"),
        nullable=True,
    )
    game_type: Mapped[GameType] = mapped_column(nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    configuration: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    difficulty: Mapped[PracticeDifficulty] = mapped_column(default=PracticeDifficulty.INTERMEDIATE, nullable=False)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(50)), default=list, nullable=False)
    resource_ids: Mapped[list[str]] = mapped_column(ARRAY(UUID(as_uuid=False)), default=list, nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
    )

    # Relationships
    institution = relationship("Institution", back_populates="games")
    practice = relationship("Practice", back_populates="games")
    course = relationship("Course")
    sessions = relationship("GameSession", back_populates="game")

    def __repr__(self) -> str:
        return f"<EducationalGame(id={self.id}, title={self.title}, type={self.game_type})>"


class GameSession(TimestampedUUIDModel):
    """Student session playing an educational game."""

    __tablename__ = "game_sessions"

    game_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("educational_games.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_profile_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    enrollment_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("enrollments.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[GameSessionStatus] = mapped_column(
        default=GameSessionStatus.IN_PROGRESS,
        nullable=False,
    )
    
    # Game data
    session_data: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    configuration_snapshot: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    
    # Results
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    objectives_completed: Mapped[int] = mapped_column(default=0, nullable=False)
    total_objectives: Mapped[int] = mapped_column(default=0, nullable=False)
    attempts_count: Mapped[int] = mapped_column(default=0, nullable=False)
    
    # Timing
    started_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    finished_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    time_spent_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Offline support
    is_offline: Mapped[bool] = mapped_column(default=False, nullable=False)
    sync_status: Mapped[str] = mapped_column(String(20), default="synced", nullable=False)
    local_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Relationships
    game = relationship("EducationalGame", back_populates="sessions")
    student_profile = relationship("StudentProfile", back_populates="game_sessions")
    institution = relationship("Institution")
    enrollment = relationship("Enrollment")
    results = relationship("GameResult", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<GameSession(id={self.id}, game={self.game_id}, student={self.student_profile_id})>"


class GameResult(TimestampedUUIDModel):
    """Result of a game session."""

    __tablename__ = "game_results"

    session_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("game_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_profile_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    game_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("educational_games.id", ondelete="CASCADE"),
        nullable=False,
    )
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Results
    score: Mapped[int] = mapped_column(default=0, nullable=False)
    max_score: Mapped[int] = mapped_column(default=0, nullable=False)
    objectives_completed: Mapped[int] = mapped_column(default=0, nullable=False)
    total_objectives: Mapped[int] = mapped_column(default=0, nullable=False)
    completed: Mapped[bool] = mapped_column(default=False, nullable=False)
    
    # Details
    result_data: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    
    # Relationships
    session = relationship("GameSession", back_populates="results")
    student_profile = relationship("StudentProfile")
    game = relationship("EducationalGame")
    institution = relationship("Institution")

    def __repr__(self) -> str:
        return f"<GameResult(id={self.id}, session={self.session_id}, score={self.score})>"