"""Schemas for institutions, users, students, monitors, and memberships."""

from datetime import date, datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

RoleCode = Literal["ADMIN", "MONITOR", "STUDENT"]


class InstitutionOut(BaseModel):
    id: UUID
    name: str
    short_name: Optional[str] = None
    code: Optional[str] = None
    country_code: Optional[str] = None
    timezone: str
    default_language: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class InstitutionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    short_name: Optional[str] = Field(default=None, max_length=50)
    country_code: Optional[str] = Field(default=None, min_length=2, max_length=3)
    timezone: Optional[str] = Field(default=None, max_length=50)
    default_language: Optional[str] = Field(default=None, min_length=2, max_length=10)
    status: Optional[Literal["active", "inactive"]] = None


class UserOut(BaseModel):
    id: UUID
    institution_id: UUID
    username: Optional[str] = None
    display_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: str
    roles: List[str] = []
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100, pattern=r"^[a-zA-Z0-9._-]+$")
    display_name: str = Field(min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    password: str = Field(min_length=15, max_length=128)
    role_code: Literal["ADMIN"] = "ADMIN"

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=100, pattern=r"^[a-zA-Z0-9._-]+$")
    display_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    status: Optional[Literal["active", "inactive", "suspended", "archived"]] = None

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: Optional[str]) -> Optional[str]:
        return value.strip().lower() if value else value


class StudentCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100, pattern=r"^[a-zA-Z0-9._-]+$")
    display_name: str = Field(min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    password: str = Field(min_length=15, max_length=128)
    student_code: str = Field(min_length=1, max_length=50)
    grade: Optional[int] = Field(default=None, ge=1, le=12)
    section: Optional[str] = Field(default=None, max_length=10)
    birth_date: Optional[date] = None
    guardian_name: Optional[str] = Field(default=None, max_length=255)
    guardian_phone: Optional[str] = Field(default=None, max_length=50)
    course_keys: List[str] = []

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()


class StudentUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    grade: Optional[int] = Field(default=None, ge=1, le=12)
    section: Optional[str] = Field(default=None, max_length=10)
    birth_date: Optional[date] = None
    guardian_name: Optional[str] = Field(default=None, max_length=255)
    guardian_phone: Optional[str] = Field(default=None, max_length=50)
    course_keys: Optional[List[str]] = None
    status: Optional[Literal["active", "inactive", "suspended", "archived"]] = None


class StudentOut(BaseModel):
    id: UUID
    user_id: UUID
    institution_id: UUID
    student_code: str
    display_name: str
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    grade: Optional[int] = None
    section: Optional[str] = None
    status: str
    created_at: datetime


class StudentDetail(StudentOut):
    birth_date: Optional[date] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    has_medical_info: bool = False


class MonitorCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100, pattern=r"^[a-zA-Z0-9._-]+$")
    display_name: str = Field(min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    password: str = Field(min_length=15, max_length=128)
    employee_code: str = Field(min_length=1, max_length=50)
    title: Optional[str] = Field(default=None, max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)
    specialties: List[str] = []
    max_students: int = Field(default=30, ge=1, le=500)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()


class MonitorUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    title: Optional[str] = Field(default=None, max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)
    specialties: Optional[List[str]] = None
    max_students: Optional[int] = Field(default=None, ge=1, le=500)
    status: Optional[Literal["active", "inactive", "suspended", "archived"]] = None


class MonitorOut(BaseModel):
    id: UUID
    user_id: UUID
    institution_id: UUID
    employee_code: str
    display_name: str
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    title: Optional[str] = None
    department: Optional[str] = None
    specialties: List[str] = []
    max_students: int
    status: str
    created_at: datetime


class MembershipCreate(BaseModel):
    user_id: UUID
    role_code: RoleCode
    expires_at: Optional[datetime] = None


class MembershipUpdate(BaseModel):
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class MembershipOut(BaseModel):
    id: UUID
    user_id: UUID
    institution_id: UUID
    role_id: UUID
    role_code: str
    user_display_name: str
    is_active: bool
    assigned_at: datetime
    expires_at: Optional[datetime] = None
