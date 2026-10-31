"""Permission and authorization schemas."""

from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class PermissionBase(BaseModel):
    """Base permission schema."""
    code: str
    name: str
    description: Optional[str] = None
    resource: str
    action: str
    scope: str = "institution"
    model_config = ConfigDict(from_attributes=True)


class RoleBase(BaseModel):
    """Base role schema."""
    code: str
    name: str
    description: Optional[str] = None
    is_system: bool = False
    permissions: List[str] = []
    model_config = ConfigDict(from_attributes=True)


class RoleWithPermissions(RoleBase):
    """Role with full permission objects."""
    permissions: List[PermissionBase] = []


class UserRoleAssignment(BaseModel):
    """User role assignment."""
    user_id: UUID
    role_id: UUID
    institution_id: UUID
    assigned_at: str
    assigned_by: Optional[UUID] = None
    expires_at: Optional[str] = None
    is_active: bool = True
    model_config = ConfigDict(from_attributes=True)


class PermissionCheckRequest(BaseModel):
    """Permission check request."""
    permission: str
    resource_id: Optional[UUID] = None
    institution_id: Optional[UUID] = None


class PermissionCheckResponse(BaseModel):
    """Permission check response."""
    allowed: bool
    permission: str
    reason: Optional[str] = None


class AuthorizationContext(BaseModel):
    """Authorization context for current request."""
    user_id: UUID
    institution_id: UUID
    roles: List[str]
    permissions: List[str]
    session_id: UUID
    model_config = ConfigDict(from_attributes=True)


# Permission constants for easy reference
class Permissions:
    """Permission codes used in the system."""
    
    # Profile permissions
    PROFILE_READ_OWN = "profile.read_own"
    PROFILE_UPDATE_OWN = "profile.update_own"
    
    # Course permissions
    COURSES_READ = "courses.read"
    COURSES_CREATE = "courses.create"
    COURSES_UPDATE = "courses.update"
    COURSES_DELETE = "courses.delete"
    COURSES_PUBLISH = "courses.publish"
    
    # Unit permissions
    UNITS_READ = "units.read"
    UNITS_CREATE = "units.create"
    UNITS_UPDATE = "units.update"
    UNITS_DELETE = "units.delete"
    
    # Lesson permissions
    LESSONS_READ = "lessons.read"
    LESSONS_CREATE = "lessons.create"
    LESSONS_UPDATE = "lessons.update"
    LESSONS_DELETE = "lessons.delete"
    
    # Progress permissions
    PROGRESS_READ_OWN = "progress.read_own"
    PROGRESS_READ_ASSIGNED = "progress.read_assigned"
    PROGRESS_RECORD_OWN_ACTIVITY = "progress.record_own_activity"
    PROGRESS_READ_INSTITUTION_AGGREGATES = "progress.read_institution_aggregates"
    
    # Assessment permissions
    ASSESSMENTS_READ = "assessments.read"
    ASSESSMENTS_CREATE = "assessments.create"
    ASSESSMENTS_UPDATE = "assessments.update"
    ASSESSMENTS_DELETE = "assessments.delete"
    ASSESSMENTS_SUBMIT_OWN = "assessments.submit_own"
    ASSESSMENTS_GRADE_ASSIGNED = "assessments.grade_assigned"
    ASSESSMENTS_MANAGE_ASSIGNED = "assessments.manage_assigned"
    
    # Academic organization permissions
    ACADEMIC_YEARS_READ = "academic_years.read"
    ACADEMIC_YEARS_MANAGE = "academic_years.manage"
    ACADEMIC_PERIODS_READ = "academic_periods.read"
    ACADEMIC_PERIODS_MANAGE = "academic_periods.manage"
    GRADES_READ = "grades.read"
    SECTIONS_READ = "sections.read"
    SECTIONS_MANAGE = "sections.manage"
    ACADEMIC_MOVEMENTS_READ_INSTITUTION = "academic_movements.read_institution"
    
    # Classroom permissions
    CLASSROOMS_READ = "classrooms.read"
    CLASSROOMS_READ_ASSIGNED = "classrooms.read_assigned"
    CLASSROOMS_READ_INSTITUTION = "classrooms.read_institution"
    CLASSROOMS_MANAGE_INSTITUTION = "classrooms.manage_institution"
    CLASSROOMS_CREATE = "classrooms.create"
    CLASSROOMS_UPDATE = "classrooms.update"
    CLASSROOMS_DELETE = "classrooms.delete"
    
    # Student permissions
    STUDENTS_READ_OWN = "students.read_own"
    STUDENTS_READ_ASSIGNED = "students.read_assigned"
    STUDENTS_READ_INSTITUTION = "students.read_institution"
    STUDENTS_MANAGE_INSTITUTION = "students.manage_institution"
    
    # Enrollment permissions
    ENROLLMENTS_READ_OWN = "enrollments.read_own"
    ENROLLMENTS_READ_ASSIGNED = "enrollments.read_assigned"
    ENROLLMENTS_READ_INSTITUTION = "enrollments.read_institution"
    ENROLLMENTS_CREATE_INSTITUTION = "enrollments.create_institution"
    ENROLLMENTS_MANAGE_INSTITUTION = "enrollments.manage_institution"
    ENROLLMENTS_TRANSFER_INSTITUTION = "enrollments.transfer_institution"
    
    # Teacher assignment permissions
    TEACHER_ASSIGNMENTS_READ = "teacher_assignments.read"
    TEACHER_ASSIGNMENTS_READ_OWN = "teacher_assignments.read_own"
    TEACHER_ASSIGNMENTS_READ_INSTITUTION = "teacher_assignments.read_institution"
    TEACHER_ASSIGNMENTS_MANAGE = "teacher_assignments.manage"
    TEACHER_ASSIGNMENTS_MANAGE_INSTITUTION = "teacher_assignments.manage_institution"
    
    # User permissions
    USERS_READ_INSTITUTION = "users.read_institution"
    USERS_MANAGE_INSTITUTION = "users.manage_institution"
    USERS_CREATE_INSTITUTION = "users.create_institution"
    
    # Monitor permissions
    MONITORS_READ_INSTITUTION = "monitors.read_institution"
    MONITORS_MANAGE_INSTITUTION = "monitors.manage_institution"
    
    # Membership permissions
    MEMBERSHIPS_READ_INSTITUTION = "memberships.read_institution"
    MEMBERSHIPS_MANAGE_INSTITUTION = "memberships.manage_institution"
    
    # Institution permissions
    INSTITUTIONS_READ = "institutions.read"
    INSTITUTIONS_MANAGE = "institutions.manage"
    INSTITUTIONS_CREATE = "institutions.create"
    
    # Role permissions
    ROLES_READ_INSTITUTION = "roles.read_institution"
    ROLES_ASSIGN_INSTITUTION = "roles.assign_institution"
    ROLES_MANAGE_INSTITUTION = "roles.manage_institution"
    
    # Content permissions
    CONTENT_READ = "content.read"
    CONTENT_CREATE = "content.create"
    CONTENT_UPDATE = "content.update"
    CONTENT_DELETE = "content.delete"
    CONTENT_REVIEW_INSTITUTION = "content.review_institution"
    CONTENT_PUBLISH_INSTITUTION = "content.publish_institution"
    
    # Report permissions
    REPORTS_READ_OWN = "reports.read_own"
    REPORTS_READ_ASSIGNED = "reports.read_assigned"
    REPORTS_READ_INSTITUTION = "reports.read_institution"
    
    # Settings permissions
    SETTINGS_READ_INSTITUTION = "settings.read_institution"
    SETTINGS_MANAGE_INSTITUTION = "settings.manage_institution"
    
    # Reinforcement permissions
    REINFORCEMENT_READ_OWN = "reinforcement.read_own"
    REINFORCEMENT_READ_ASSIGNED = "reinforcement.read_assigned"
    REINFORCEMENT_MANAGE = "reinforcement.manage"
    
    # System permissions
    SYSTEM_ADMIN = "system.admin"
    SYSTEM_HEALTH = "system.health"
    SYSTEM_METRICS = "system.metrics"
