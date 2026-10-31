"""Schemas for academic organization, classrooms, enrollments, and assignments."""

from datetime import date, datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

AcademicYearStatus = Literal["draft", "planned", "active", "closed", "archived"]
PeriodTypeValue = Literal["semester", "trimester", "quarter", "bimester", "custom"]
PeriodStatus = Literal["draft", "planned", "active", "closed", "archived"]
ClassroomStatus = Literal["active", "inactive", "archived"]
EnrollmentStatusValue = Literal[
    "pending",
    "active",
    "transferred",
    "withdrawn",
    "completed",
    "graduated",
    "suspended",
    "cancelled",
]
ResponsibilityValue = Literal["main", "assistant", "substitute", "specialist"]
AssignmentStatus = Literal["planned", "active", "completed", "revoked", "cancelled"]
MovementTypeValue = Literal[
    "enrollment", "transfer", "withdrawal", "completion", "reentry", "correction"
]


class AcademicYearCreate(BaseModel):
    year: int = Field(ge=2000, le=2100)
    name: str = Field(min_length=2, max_length=100)
    start_date: date
    end_date: date
    status: AcademicYearStatus = "draft"

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class AcademicYearUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[AcademicYearStatus] = None


class AcademicYearRead(BaseModel):
    id: UUID
    institution_id: UUID
    year: int
    name: str
    start_date: date
    end_date: date
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AcademicPeriodCreate(BaseModel):
    academic_year_id: UUID
    name: str = Field(min_length=2, max_length=100)
    period_type: PeriodTypeValue = "bimester"
    start_date: date
    end_date: date
    status: PeriodStatus = "planned"
    sequence: int = Field(ge=1, le=20)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class AcademicPeriodUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    period_type: Optional[PeriodTypeValue] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[PeriodStatus] = None
    sequence: Optional[int] = Field(default=None, ge=1, le=20)


class AcademicPeriodRead(BaseModel):
    id: UUID
    academic_year_id: UUID
    name: str
    period_type: str
    start_date: date
    end_date: date
    status: str
    sequence: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class GradeRead(BaseModel):
    id: UUID
    number: int
    name: str
    display_name: str
    sequence: int
    description: Optional[str] = None
    status: str
    model_config = ConfigDict(from_attributes=True)


class SectionCreate(BaseModel):
    grade_id: UUID
    name: str = Field(min_length=1, max_length=10)
    name_short: Optional[str] = Field(default=None, max_length=5)
    capacity: Optional[int] = Field(default=None, ge=1, le=500)
    status: Literal["active", "inactive"] = "active"


class SectionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=10)
    name_short: Optional[str] = Field(default=None, max_length=5)
    capacity: Optional[int] = Field(default=None, ge=1, le=500)
    status: Optional[Literal["active", "inactive"]] = None


class SectionRead(BaseModel):
    id: UUID
    grade_id: UUID
    name: str
    name_short: Optional[str] = None
    capacity: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ClassroomCreate(BaseModel):
    academic_year_id: UUID
    grade_id: UUID
    section_id: Optional[UUID] = None
    code: str = Field(min_length=1, max_length=50)
    display_name: str = Field(min_length=2, max_length=100)
    capacity: Optional[int] = Field(default=None, ge=1, le=500)
    capacity_source: Optional[str] = Field(default=None, max_length=50)
    status: ClassroomStatus = "active"
    notes: Optional[str] = Field(default=None, max_length=500)


class ClassroomUpdate(BaseModel):
    code: Optional[str] = Field(default=None, min_length=1, max_length=50)
    display_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    capacity: Optional[int] = Field(default=None, ge=1, le=500)
    capacity_source: Optional[str] = Field(default=None, max_length=50)
    status: Optional[ClassroomStatus] = None
    notes: Optional[str] = Field(default=None, max_length=500)


class ClassroomRead(BaseModel):
    id: UUID
    institution_id: UUID
    academic_year_id: Optional[UUID] = None
    grade_id: UUID
    section_id: Optional[UUID] = None
    code: str
    display_name: str
    capacity: Optional[int] = None
    capacity_source: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ClassroomStudentRead(BaseModel):
    enrollment_id: UUID
    student_id: UUID
    user_id: UUID
    student_code: str
    display_name: str
    status: str
    enrolled_at: datetime


class TeacherAssignmentSummary(BaseModel):
    id: UUID
    monitor_id: UUID
    monitor_display_name: str
    course_id: UUID
    course_name: str
    responsibility: str
    status: str


class ClassroomDetail(ClassroomRead):
    grade_name: str
    section_name: Optional[str] = None
    active_enrollment_count: int = 0
    student_count: int = 0
    teacher_assignment_count: int = 0
    students: List[ClassroomStudentRead] = []
    assignments: List[TeacherAssignmentSummary] = []


class EnrollmentCreate(BaseModel):
    student_id: UUID
    classroom_id: UUID
    period_id: Optional[UUID] = None
    status: Literal["pending", "active"] = "active"
    effective_date: Optional[datetime] = None


class EnrollmentUpdate(BaseModel):
    period_id: Optional[UUID] = None
    effective_date: Optional[datetime] = None


class EnrollmentTransferRequest(BaseModel):
    destination_classroom_id: UUID
    effective_date: Optional[datetime] = None
    reason_code: Literal[
        "family_request",
        "academic_reorganization",
        "behavioral",
        "capacity",
        "other",
    ] = "other"
    notes: Optional[str] = Field(default=None, max_length=500)


class EnrollmentWithdrawRequest(BaseModel):
    effective_date: Optional[datetime] = None
    reason_code: Literal[
        "family_request",
        "relocation",
        "health",
        "economic",
        "academic",
        "other",
    ] = "other"
    notes: Optional[str] = Field(default=None, max_length=500)


class EnrollmentCompleteRequest(BaseModel):
    effective_date: Optional[datetime] = None
    reason_code: Literal["year_end", "administrative", "other"] = "year_end"
    notes: Optional[str] = Field(default=None, max_length=500)


class EnrollmentRead(BaseModel):
    id: UUID
    student_id: UUID
    institution_id: UUID
    classroom_id: UUID
    academic_year_id: UUID
    period_id: Optional[UUID] = None
    status: str
    enrolled_at: datetime
    effective_date: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    status_reason: Optional[str] = None
    student_code: Optional[str] = None
    student_display_name: Optional[str] = None
    classroom_code: Optional[str] = None
    classroom_name: Optional[str] = None
    grade_name: Optional[str] = None
    section_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AcademicMovementRead(BaseModel):
    id: UUID
    institution_id: UUID
    student_id: UUID
    movement_type: str
    source_enrollment_id: Optional[UUID] = None
    destination_enrollment_id: Optional[UUID] = None
    source_classroom_id: Optional[UUID] = None
    destination_classroom_id: Optional[UUID] = None
    effective_date: datetime
    reason_code: Optional[str] = None
    notes: Optional[str] = None
    authorized_by_user_id: Optional[UUID] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EnrollmentDetail(EnrollmentRead):
    movements: List[AcademicMovementRead] = []


class TeacherAssignmentCreate(BaseModel):
    monitor_id: UUID
    classroom_id: UUID
    course_id: UUID
    period_id: Optional[UUID] = None
    responsibility: ResponsibilityValue = "main"
    status: AssignmentStatus = "active"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date and self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class TeacherAssignmentUpdate(BaseModel):
    responsibility: Optional[ResponsibilityValue] = None
    status: Optional[AssignmentStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=500)


class TeacherAssignmentRead(BaseModel):
    id: UUID
    monitor_id: UUID
    institution_id: UUID
    classroom_id: UUID
    course_id: UUID
    period_id: Optional[UUID] = None
    responsibility: str
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    notes: Optional[str] = None
    monitor_display_name: Optional[str] = None
    classroom_code: Optional[str] = None
    classroom_name: Optional[str] = None
    course_name: Optional[str] = None
    period_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
