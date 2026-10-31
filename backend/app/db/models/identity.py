"""User identity and profile models."""

import enum
from datetime import date, datetime
from typing import Optional, List
from uuid import uuid4

from sqlalchemy import Date, DateTime, String, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TimestampedUUIDModel


class UserStatus(str, enum.Enum):
    """User account status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"


class UserRoleName(str, enum.Enum):
    """Canonical role codes used for system roles."""
    STUDENT = "STUDENT"
    MONITOR = "MONITOR"
    ADMIN = "ADMIN"


class User(TimestampedUUIDModel):
    """User identity model - core identity separate from profiles."""
    
    __tablename__ = "users"
    
    username: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True, unique=True, index=True
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, values_callable=lambda x: [e.value for e in x]),
        default=UserStatus.ACTIVE,
        nullable=False,
    )
    
    # Institutional membership
    institution_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Relationships
    institution = relationship("Institution", back_populates="users")
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    monitor_profile = relationship("MonitorProfile", back_populates="user", uselist=False)
    admin_profile = relationship("AdministratorProfile", back_populates="user", uselist=False)
    credential = relationship("UserCredential", back_populates="user", uselist=False)
    user_roles = relationship(
        "UserRole",
        back_populates="user",
        foreign_keys="UserRole.user_id",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, display_name={self.display_name}, status={self.status})>"


class UserProfile(TimestampedUUIDModel):
    """Base user profile with common fields."""
    
    __abstract__ = True
    
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    alias: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    avatar: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    preferences: Mapped[dict] = mapped_column(default=dict, nullable=False)


class StudentProfile(TimestampedUUIDModel):
    """Student-specific profile."""
    
    __tablename__ = "student_profiles"
    
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    student_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    grade: Mapped[Optional[int]] = mapped_column(nullable=True)
    section: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    course_keys: Mapped[list[str]] = mapped_column(ARRAY(String(50)), default=list, nullable=False)
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    guardian_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    guardian_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    medical_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    user = relationship("User", back_populates="student_profile")
    enrollments = relationship("Enrollment", back_populates="student")
    assessment_attempts = relationship("AssessmentAttempt", back_populates="student")
    practice_attempts = relationship("PracticeAttempt", back_populates="student_profile")
    game_sessions = relationship("GameSession", back_populates="student_profile")
    
    def __repr__(self) -> str:
        return f"<StudentProfile(id={self.id}, student_code={self.student_code})>"


class MonitorProfile(TimestampedUUIDModel):
    """Monitor/Teacher profile."""
    
    __tablename__ = "monitor_profiles"
    
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    employee_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    specialties: Mapped[list[str]] = mapped_column(ARRAY(String(50)), default=list, nullable=False)
    hire_date: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    max_students: Mapped[int] = mapped_column(default=30, nullable=False)
    
    user = relationship("User", back_populates="monitor_profile")
    assignments = relationship("TeacherAssignment", back_populates="monitor")
    
    def __repr__(self) -> str:
        return f"<MonitorProfile(id={self.id}, employee_code={self.employee_code})>"


class AdministratorProfile(TimestampedUUIDModel):
    """Administrator profile."""
    
    __tablename__ = "administrator_profiles"
    
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    employee_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    permissions_level: Mapped[str] = mapped_column(String(50), default="full", nullable=False)
    hire_date: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    user = relationship("User", back_populates="admin_profile")
    
    def __repr__(self) -> str:
        return f"<AdministratorProfile(id={self.id}, employee_code={self.employee_code})>"