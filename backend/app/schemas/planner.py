"""Strict planner inputs, finite states and timezone-aware deadlines."""

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, field_validator, model_validator


class PlannerInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @field_validator("*", mode="before")
    @classmethod
    def plain_text(cls, value):
        if isinstance(value, str) and ("<" in value or ">" in value):
            raise ValueError("Use plain text, not HTML")
        return value


class AssignmentCreate(PlannerInput):
    course_id: UUID
    classroom_id: UUID
    academic_period_id: UUID
    unit_id: UUID | None = None
    lesson_id: UUID | None = None
    title: str = Field(min_length=2, max_length=255)
    instructions: str = Field(min_length=2, max_length=12000)
    assignment_type: Literal["homework", "classwork", "project", "reading", "research", "practice", "other"] = "homework"
    available_from: AwareDatetime
    due_at: AwareDatetime
    allow_late_submission: bool = False
    allow_resubmission: bool = False
    max_attempts: int = Field(1, ge=1, le=5)
    student_ids: list[UUID] | None = Field(None, min_length=1, max_length=200)

    @model_validator(mode="after")
    def dates(self):
        if self.due_at < self.available_from:
            raise ValueError("Deadline precedes availability")
        if self.student_ids and len(set(self.student_ids)) != len(self.student_ids):
            raise ValueError("Duplicate recipients")
        return self


class AssignmentUpdate(PlannerInput):
    expected_revision: int = Field(ge=1)
    title: str | None = Field(None, min_length=2, max_length=255)
    instructions: str | None = Field(None, min_length=2, max_length=12000)
    available_from: AwareDatetime | None = None
    due_at: AwareDatetime | None = None


class RevisionInput(PlannerInput):
    expected_revision: int = Field(ge=1)


class SubmissionSave(RevisionInput):
    response_text: str = Field(max_length=20000)


class FeedbackCreate(RevisionInput):
    feedback_text: str = Field(min_length=2, max_length=6000)
    requests_revision: bool = False


class ExtensionInput(RevisionInput):
    due_at: AwareDatetime
    reason: str = Field(min_length=2, max_length=300)


class ReinforcementCreate(PlannerInput):
    course_id: UUID
    classroom_id: UUID
    student_id: UUID
    academic_period_id: UUID
    title: str = Field(min_length=2, max_length=255)
    objective: str = Field(min_length=2, max_length=255)
    instructions: str = Field(min_length=2, max_length=6000)
    lesson_ids: list[UUID] = Field(min_length=1, max_length=20)
    available_from: AwareDatetime
    due_at: AwareDatetime

    @model_validator(mode="after")
    def dates(self):
        if self.due_at < self.available_from:
            raise ValueError("Deadline precedes availability")
        if len(set(self.lesson_ids)) != len(self.lesson_ids):
            raise ValueError("Duplicate lessons")
        return self


class CalendarCreate(PlannerInput):
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(default="", max_length=4000)
    scope: Literal["institution", "classroom", "course"]
    classroom_id: UUID | None = None
    course_id: UUID | None = None
    all_day: bool = False
    starts_on: date | None = None
    ends_on: date | None = None
    starts_at: AwareDatetime | None = None
    ends_at: AwareDatetime | None = None

    @model_validator(mode="after")
    def dates_and_scope(self):
        if self.scope == "institution" and (self.classroom_id or self.course_id):
            raise ValueError("Institution events have no classroom/course")
        if self.scope != "institution" and not self.classroom_id:
            raise ValueError("A classroom is required")
        if (self.scope == "course") != (self.course_id is not None):
            raise ValueError("Course scope requires a course")
        if self.all_day:
            if not self.starts_on or not self.ends_on or self.ends_on <= self.starts_on or self.starts_at or self.ends_at:
                raise ValueError("All-day events use civil start and exclusive end dates")
        elif not self.starts_at or not self.ends_at or self.ends_at <= self.starts_at or self.starts_on or self.ends_on:
            raise ValueError("Timed events require timezone-aware instants")
        return self


class CalendarReplace(CalendarCreate):
    expected_revision: int = Field(ge=1)
