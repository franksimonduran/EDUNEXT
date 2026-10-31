"""Public progress contracts never contain grades, answer keys or family data."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RecordLessonActivity(BaseModel):
    model_config = ConfigDict(extra="forbid")
    lesson_version_id: UUID


class LessonProgressRead(BaseModel):
    lesson_id: UUID
    lesson_version_id: UUID
    title: str
    unit_id: UUID
    status: Literal["not_started", "started", "completed"]
    completed_at: datetime | None = None
    started_at: datetime | None = None
    completed_lesson_version_id: UUID | None = None
    completion_source: str | None = None
    source: str = "server_recorded"


class CourseProgressRead(BaseModel):
    course_id: UUID
    title: str
    applicable_lessons_count: int
    started_lessons_count: int
    completed_lessons_count: int
    completion_percentage: float | None
    state: Literal["available", "no_applicable_content"]
    catalog_reference: str
    lessons: list[LessonProgressRead]
    last_confirmed_activity_at: datetime | None = None
    source: str = "calculated_from_server_records"


class UnitProgressRead(BaseModel):
    unit_id: UUID
    course_id: UUID
    applicable_lessons_count: int
    started_lessons_count: int
    completed_lessons_count: int
    completion_percentage: float | None
    state: Literal["available", "no_applicable_content"]
    catalog_reference: str
    lessons: list[LessonProgressRead]
    last_confirmed_activity_at: datetime | None = None
    source: str = "calculated_from_server_records"


class AchievementRead(BaseModel):
    code: str
    name: str
    description: str
    rule_version: int = 1
    earned_at: datetime | None = None
    status: str = "available"


class LearningHistoryRead(BaseModel):
    event_id: str
    lesson_id: UUID
    course_id: UUID
    event_type: str
    occurred_at: datetime
    recorded_at: datetime
    enrollment_id: UUID
    lesson_version_id: UUID
    source: str = "server_recorded"


class SourceAvailability(BaseModel):
    data_status: Literal["not_available"] = "not_available"
    reason: str


class ProgressOverview(BaseModel):
    can_record_own_activity: bool
    active_courses_count: int
    applicable_lessons_count: int
    completed_lessons_count: int
    earned_achievements_count: int
    last_confirmed_activity_at: datetime | None = None
    completion_percentage: float | None
    courses: list[CourseProgressRead]
    data_status: str = "calculated_from_server_records"
    practices: SourceAvailability
    games: SourceAvailability
    assessments: SourceAvailability
    competencies: SourceAvailability
