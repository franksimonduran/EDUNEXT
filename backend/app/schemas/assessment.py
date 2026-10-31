"""Assessment schemas."""

import enum
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Literal, Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictBool, field_validator, model_validator


class StrictAcademicInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class AssessmentAnswer(StrictAcademicInput):
    """Student input deliberately has no score, reviewer or achievement fields."""

    answer_data: dict = Field(default_factory=dict)
    expected_revision: int = Field(ge=1)


class NumericAnswer(StrictAcademicInput):
    value: str = Field(min_length=1, max_length=80)

    @field_validator("value")
    @classmethod
    def decimal_value(cls, value):
        # A comma is a decimal separator; grouping separators are not accepted.
        try:
            parsed = Decimal(value.replace(",", "."))
        except InvalidOperation:
            raise ValueError("A valid decimal is required") from None
        if not parsed.is_finite():
            raise ValueError("A finite decimal is required")
        return value


class BooleanAnswer(StrictAcademicInput):
    value: StrictBool


class StudentQuestion(BaseModel):
    """Allowlisted presentation excludes solutions, private settings and explanations."""

    id: UUID
    question_type: str
    prompt: str
    options: list["StudentOption"] = Field(default_factory=list)


class StudentOption(BaseModel):
    id: str
    text: str


class DescriptiveConclusionInput(StrictAcademicInput):
    achievements_description: str = Field(min_length=1, max_length=5000)
    improvement_needs: str = Field(min_length=1, max_length=5000)
    recommendations: str = Field(min_length=1, max_length=5000)


class CompetencyJudgmentInput(StrictAcademicInput):
    """A teacher judgment is categorical and evidence-backed, never score-derived.

    This is a boundary contract, not an enabled academic-record endpoint.
    Normative conclusion obligations remain subject to verified institutional policy.
    """

    competency_id: UUID
    academic_period_id: UUID
    achievement_level: Literal["AD", "A", "B", "C"]
    evidence_ids: list[UUID] = Field(min_length=1, max_length=100)
    justification: str = Field(min_length=1, max_length=5000)
    conclusion: DescriptiveConclusionInput | None = None
    expected_revision: int = Field(ge=1)

    @model_validator(mode="after")
    def unique_evidence(self):
        if len(self.evidence_ids) != len(set(self.evidence_ids)):
            raise ValueError("Evidence IDs must be unique")
        return self


StudentQuestion.model_rebuild()


# CRUD schemas for assessments
class AssessmentTypeEnum(str, enum.Enum):
    DIAGNOSTIC = "diagnostic"
    FORMATIVE = "formative"
    SUMMATIVE = "summative"
    PRACTICE = "practice"
    EXAM = "exam"


class AssessmentStatusEnum(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class AssessmentBase(BaseModel):
    course_id: UUID
    unit_id: Optional[UUID] = None
    period_id: Optional[UUID] = None
    title: str = Field(min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    assessment_type: AssessmentTypeEnum = AssessmentTypeEnum.FORMATIVE
    status: AssessmentStatusEnum = AssessmentStatusEnum.DRAFT
    version: str = Field(default="1.0", max_length=20)
    time_limit_minutes: Optional[int] = Field(default=None, ge=1)
    max_attempts: int = Field(default=1, ge=1)
    passing_score: Optional[float] = Field(default=None, ge=0, le=100)
    show_results_immediately: bool = True
    show_correct_answers: bool = False
    shuffle_questions: bool = False
    shuffle_options: bool = False
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)
    instructions: Optional[str] = Field(default=None, max_length=10000)
    settings: Dict[str, Any] = Field(default_factory=dict)


class AssessmentCreate(AssessmentBase):
    pass


class AssessmentUpdate(BaseModel):
    course_id: Optional[UUID] = None
    unit_id: Optional[UUID] = None
    period_id: Optional[UUID] = None
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    assessment_type: Optional[AssessmentTypeEnum] = None
    status: Optional[AssessmentStatusEnum] = None
    version: Optional[str] = Field(default=None, max_length=20)
    time_limit_minutes: Optional[int] = Field(default=None, ge=1)
    max_attempts: Optional[int] = Field(default=None, ge=1)
    passing_score: Optional[float] = Field(default=None, ge=0, le=100)
    show_results_immediately: Optional[bool] = None
    show_correct_answers: Optional[bool] = None
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    tags: Optional[List[str]] = None
    instructions: Optional[str] = Field(default=None, max_length=10000)
    settings: Optional[Dict[str, Any]] = None


class AssessmentRead(AssessmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentDetail(AssessmentRead):
    questions_count: int = 0
    attempts_count: int = 0
