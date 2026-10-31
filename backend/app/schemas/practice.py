"""Schemas for Practice Engine."""

import enum
from datetime import datetime
from typing import List, Literal, Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class PracticeStatus(str, enum.Enum):
    DRAFT = "draft"
    READY_FOR_REVIEW = "ready_for_review"
    IN_REVIEW = "in_review"
    CHANGES_REQUESTED = "changes_requested"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class PracticeType(str, enum.Enum):
    REVIEW = "review"
    COMPREHENSION = "comprehension"
    CALCULATION = "calculation"
    VOCABULARY = "vocabulary"
    ORDERING = "ordering"
    UNIT_REVIEW = "unit_review"
    REINFORCEMENT = "reinforcement"
    CHALLENGE = "challenge"


class PracticeDifficulty(str, enum.Enum):
    INITIAL = "initial"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ExerciseType(str, enum.Enum):
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
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    AUTO_REVIEWED = "auto_reviewed"
    NEEDS_MANUAL_REVIEW = "needs_manual_review"
    REVIEWED = "reviewed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class GameType(str, enum.Enum):
    MATCHING = "matching"
    ORDERING = "ordering"
    MEMORY = "memory"
    CLASSIFICATION = "classification"
    WORD_COMPLETION = "word_completion"
    QUICK_CHALLENGE = "quick_challenge"
    IMAGE_WORD_ASSOCIATION = "image_word_association"


class GameSessionStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class PracticeBase(BaseModel):
    course_id: UUID
    unit_id: Optional[UUID] = None
    lesson_id: Optional[UUID] = None
    title: str = Field(min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    practice_type: PracticeType = PracticeType.REVIEW
    difficulty: PracticeDifficulty = PracticeDifficulty.INTERMEDIATE
    status: PracticeStatus = PracticeStatus.DRAFT
    max_attempts: Optional[int] = Field(default=None, ge=1)
    time_limit_minutes: Optional[int] = Field(default=None, ge=1)
    shuffle_questions: bool = False
    shuffle_options: bool = False
    show_solutions_after: str = Field(default="attempt", max_length=20)
    allow_partial_progress: bool = True
    show_hints: bool = True
    max_score: int = Field(default=100, ge=1)
    passing_score: Optional[int] = Field(default=None, ge=0)
    partial_scoring: bool = True
    tags: List[str] = Field(default_factory=list)


class PracticeCreate(PracticeBase):
    pass


class PracticeUpdate(BaseModel):
    course_id: Optional[UUID] = None
    unit_id: Optional[UUID] = None
    lesson_id: Optional[UUID] = None
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    practice_type: Optional[PracticeType] = None
    difficulty: Optional[PracticeDifficulty] = None
    status: Optional[PracticeStatus] = None
    max_attempts: Optional[int] = Field(default=None, ge=1)
    time_limit_minutes: Optional[int] = Field(default=None, ge=1)
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    show_solutions_after: Optional[str] = Field(default=None, max_length=20)
    allow_partial_progress: Optional[bool] = None
    show_hints: Optional[bool] = None
    max_score: Optional[int] = Field(default=None, ge=1)
    passing_score: Optional[int] = Field(default=None, ge=0)
    partial_scoring: Optional[bool] = None
    tags: Optional[List[str]] = None


class PracticeRead(BaseModel):
    id: UUID
    institution_id: UUID
    course_id: UUID
    unit_id: Optional[UUID] = None
    lesson_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    practice_type: str
    difficulty: str
    status: str
    max_attempts: Optional[int] = None
    time_limit_minutes: Optional[int] = None
    shuffle_questions: bool
    shuffle_options: bool
    show_solutions_after: str
    allow_partial_progress: bool
    show_hints: bool
    max_score: int
    passing_score: Optional[int] = None
    partial_scoring: bool
    tags: List[str]
    created_by_user_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PracticeDetail(PracticeRead):
    course_name: str
    unit_title: Optional[str] = None
    lesson_title: Optional[str] = None
    version_count: int = 0
    exercise_count: int = 0
    attempt_count: int = 0
    latest_version: Optional["PracticeVersionRead"] = None
    published_version: Optional["PracticeVersionRead"] = None


class PracticeVersionRead(BaseModel):
    id: UUID
    practice_id: UUID
    version_number: int
    status: str
    snapshot: Dict[str, Any]
    config_snapshot: Dict[str, Any]
    exercises_snapshot: List[Dict[str, Any]]
    author_id: Optional[UUID] = None
    change_summary: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PracticeVersionDetail(PracticeVersionRead):
    practice: Optional[PracticeRead] = None
    attempt_count: int = 0


class ExerciseOptionBase(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    sequence: int = Field(default=0, ge=0)
    is_correct: bool = False
    feedback: Optional[str] = Field(default=None, max_length=2000)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ExerciseOptionCreate(ExerciseOptionBase):
    pass


class ExerciseOptionRead(ExerciseOptionBase):
    id: UUID
    exercise_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


ExerciseTypeParam = Literal[
    "single_choice", "true_false", "multiple_choice", "matching",
    "ordering", "numeric", "fill_blank", "classification", "open_response"
]


class ExerciseBase(BaseModel):
    exercise_type: ExerciseType
    prompt: str = Field(min_length=2, max_length=5000)
    content: Optional[Dict[str, Any]] = None
    sequence: int = Field(default=0, ge=0)
    points: int = Field(default=1, ge=1)
    scoring_rule: Optional[Dict[str, Any]] = None
    feedback_config: Optional[Dict[str, Any]] = None
    hints: List[str] = Field(default_factory=list)
    difficulty: Optional[PracticeDifficulty] = None
    tags: List[str] = Field(default_factory=list)
    learning_objective: Optional[str] = Field(default=None, max_length=255)
    resource_ids: List[UUID] = Field(default_factory=list)


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    exercise_type: Optional[ExerciseType] = None
    prompt: Optional[str] = Field(default=None, min_length=2, max_length=5000)
    content: Optional[Dict[str, Any]] = None
    sequence: Optional[int] = Field(default=None, ge=0)
    points: Optional[int] = Field(default=None, ge=1)
    scoring_rule: Optional[Dict[str, Any]] = None
    feedback_config: Optional[Dict[str, Any]] = None
    hints: Optional[List[str]] = None
    difficulty: Optional[PracticeDifficulty] = None
    tags: Optional[List[str]] = None
    learning_objective: Optional[str] = Field(default=None, max_length=255)
    resource_ids: Optional[List[UUID]] = None


class ExerciseRead(BaseModel):
    id: UUID
    practice_id: UUID
    version_id: UUID
    exercise_type: str
    prompt: str
    content: Optional[Dict[str, Any]] = None
    sequence: int
    points: int
    scoring_rule: Optional[Dict[str, Any]] = None
    feedback_config: Optional[Dict[str, Any]] = None
    hints: List[str]
    difficulty: Optional[str] = None
    tags: List[str]
    learning_objective: Optional[str] = None
    resource_ids: List[UUID]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ExerciseDetail(ExerciseRead):
    options: List[ExerciseOptionRead] = Field(default_factory=list)
    practice_title: str
    version_number: int


class PracticeAttemptCreate(BaseModel):
    practice_id: UUID
    idempotency_key: Optional[str] = None


class PracticeAttemptRead(BaseModel):
    id: UUID
    practice_id: UUID
    version_id: UUID
    student_profile_id: UUID
    institution_id: UUID
    enrollment_id: Optional[UUID] = None
    attempt_number: int
    status: str
    current_exercise_index: int
    exercises_answered: int
    score: Optional[int] = None
    max_possible_score: Optional[int] = None
    percentage: Optional[float] = None
    exercises_correct: int
    exercises_incorrect: int
    exercises_pending_review: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None
    is_offline: bool
    sync_status: str
    local_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PracticeAttemptDetail(PracticeAttemptRead):
    practice: Optional[PracticeRead] = None
    version: Optional[PracticeVersionRead] = None
    responses: List["PracticeResponseRead"] = Field(default_factory=list)
    result: Optional["PracticeResultRead"] = None


class PracticeResponseCreate(BaseModel):
    answer_data: Dict[str, Any]
    response_status: str = "saved"
    time_spent_seconds: Optional[int] = Field(default=None, ge=0)


class PracticeResponseRead(BaseModel):
    id: UUID
    attempt_id: UUID
    exercise_id: UUID
    answer_data: Dict[str, Any]
    response_status: str
    is_correct: Optional[bool] = None
    points_earned: Optional[int] = None
    max_points: Optional[int] = None
    auto_feedback: Optional[str] = None
    scoring_details: Optional[Dict[str, Any]] = None
    needs_review: bool
    reviewed_by: Optional[UUID] = None
    reviewer_feedback: Optional[str] = None
    reviewer_points: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    saved_at: datetime
    submitted_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PracticeResponseDetail(PracticeResponseRead):
    exercise: Optional[ExerciseRead] = None


class PracticeResultRead(BaseModel):
    id: UUID
    attempt_id: UUID
    student_profile_id: UUID
    practice_id: UUID
    version_id: UUID
    institution_id: UUID
    score: int
    max_score: int
    percentage: float
    passed: Optional[bool] = None
    total_exercises: int
    correct_exercises: int
    incorrect_exercises: int
    pending_review_exercises: int
    feedback_status: str
    auto_feedback_generated: bool
    manual_feedback_added: bool
    finalized_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PracticeResultDetail(PracticeResultRead):
    attempt: Optional[PracticeAttemptRead] = None
    practice: Optional[PracticeRead] = None
    feedback_items: List["PracticeFeedbackRead"] = Field(default_factory=list)


class PracticeFeedbackRead(BaseModel):
    id: UUID
    result_id: UUID
    exercise_id: Optional[UUID] = None
    feedback_type: str
    title: str
    message: str
    is_positive: bool
    resources_recommended: List[UUID]
    lessons_recommended: List[UUID]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EducationalGameBase(BaseModel):
    practice_id: Optional[UUID] = None
    course_id: Optional[UUID] = None
    game_type: GameType
    title: str = Field(min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    instructions: Optional[str] = Field(default=None, max_length=5000)
    configuration: Dict[str, Any] = Field(default_factory=dict)
    status: str = "draft"
    difficulty: PracticeDifficulty = PracticeDifficulty.INTERMEDIATE
    tags: List[str] = Field(default_factory=list)
    resource_ids: List[UUID] = Field(default_factory=list)


class EducationalGameCreate(EducationalGameBase):
    pass


class EducationalGameUpdate(BaseModel):
    practice_id: Optional[UUID] = None
    course_id: Optional[UUID] = None
    game_type: Optional[GameType] = None
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    instructions: Optional[str] = Field(default=None, max_length=5000)
    configuration: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    difficulty: Optional[PracticeDifficulty] = None
    tags: Optional[List[str]] = None
    resource_ids: Optional[List[UUID]] = None


class EducationalGameRead(BaseModel):
    id: UUID
    institution_id: UUID
    practice_id: Optional[UUID] = None
    course_id: Optional[UUID] = None
    game_type: str
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    configuration: Dict[str, Any]
    status: str
    difficulty: str
    tags: List[str]
    resource_ids: List[UUID]
    created_by_user_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EducationalGameDetail(EducationalGameRead):
    practice_title: Optional[str] = None
    course_name: Optional[str] = None
    session_count: int = 0


class GameSessionCreate(BaseModel):
    game_id: UUID
    idempotency_key: Optional[str] = None


class GameSessionRead(BaseModel):
    id: UUID
    game_id: UUID
    student_profile_id: UUID
    institution_id: UUID
    enrollment_id: Optional[UUID] = None
    status: str
    session_data: Dict[str, Any]
    configuration_snapshot: Dict[str, Any]
    score: Optional[int] = None
    max_score: Optional[int] = None
    objectives_completed: int
    total_objectives: int
    attempts_count: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None
    is_offline: bool
    sync_status: str
    local_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class GameSessionDetail(GameSessionRead):
    game: Optional[EducationalGameRead] = None
    results: List["GameResultRead"] = Field(default_factory=list)


class GameResultRead(BaseModel):
    id: UUID
    session_id: UUID
    student_profile_id: UUID
    game_id: UUID
    institution_id: UUID
    score: int
    max_score: int
    objectives_completed: int
    total_objectives: int
    completed: bool
    result_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class GameResultDetail(GameResultRead):
    session: Optional[GameSessionRead] = None
    game: Optional[EducationalGameRead] = None


PracticeRead.model_rebuild()
PracticeDetail.model_rebuild()
PracticeVersionRead.model_rebuild()
PracticeVersionDetail.model_rebuild()
ExerciseRead.model_rebuild()
ExerciseDetail.model_rebuild()
PracticeAttemptRead.model_rebuild()
PracticeAttemptDetail.model_rebuild()
PracticeResponseRead.model_rebuild()
PracticeResponseDetail.model_rebuild()
PracticeResultRead.model_rebuild()
PracticeResultDetail.model_rebuild()
PracticeFeedbackRead.model_rebuild()
EducationalGameRead.model_rebuild()
EducationalGameDetail.model_rebuild()
GameSessionRead.model_rebuild()
GameSessionDetail.model_rebuild()
GameResultRead.model_rebuild()
GameResultDetail.model_rebuild()