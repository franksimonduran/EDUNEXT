"""Database models package."""

from app.db.base import Base, TimestampedUUIDModel
from app.db.models.institution import Institution
from app.db.models.identity import User, UserStatus, UserProfile, StudentProfile, MonitorProfile, AdministratorProfile, UserRoleName
from app.db.models.role import Role, Permission, RolePermission, UserRole
from app.db.models.academic_period import AcademicYear, AcademicPeriod, PeriodType
from app.db.models.grade import Grade, Section
from app.db.models.classroom import Classroom
from app.db.models.enrollment import Enrollment, EnrollmentStatus
from app.db.models.academic_movement import AcademicMovement, AcademicMovementType
from app.db.models.academic_idempotency import AcademicIdempotencyRecord
from app.db.models.teacher_assignment import TeacherAssignment, ResponsibilityType
from app.db.models.course import Course, Unit, Lesson
from app.db.models.subject import Subject
from app.db.models.content_version import ContentVersion
from app.db.models.resource import Resource, LessonResource, ResourceType, ResourceStatus
from app.db.models.content_workflow import ContentReview, ContentPublication, ContentManifest, ContentReviewStatus, ContentReviewDecision, ContentPublicationStatus, ContentVisibility
from app.db.models.practice import (
    Practice,
    PracticeVersion,
    Exercise,
    ExerciseOption,
    PracticeAttempt,
    PracticeResponse,
    PracticeResult,
    PracticeFeedback,
    EducationalGame,
    GameSession,
    GameResult,
    PracticeStatus,
    PracticeType,
    PracticeDifficulty,
    ExerciseType,
    AttemptStatus,
    GameType,
    GameSessionStatus,
)
from app.db.models.assessment import Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentResponse, AssessmentResult
from app.db.models.progress import LearningProgress
from app.db.models.report_access import ReportAccessEvent
from app.db.models.sync_receipt import SyncOperationReceipt
from app.db.models.ai import AIServiceConfiguration, AIUsageEvent, PronunciationSession
from app.db.models.student_achievement import StudentAchievement
from app.db.models.assignment import Assignment, AssignmentTarget
from app.db.models.planner import AssignmentVersion, AssignmentSubmission, AssignmentFeedback, PlannerAudit, CalendarEvent
from app.db.models.reinforcement import ReinforcementPlan
from app.db.models.user_credential import UserCredential, CredentialStatus
from app.db.models.auth_session import AuthSession, SessionStatus
from app.db.models.refresh_token import RefreshToken, RefreshTokenStatus
from app.db.models.security_event import SecurityEvent, SecurityEventType, SecurityEventSeverity

__all__ = [
    "Base",
    "TimestampedUUIDModel",
    "Institution",
    "User",
    "UserStatus",
    "UserProfile",
    "StudentProfile",
    "MonitorProfile",
    "AdministratorProfile",
    "UserRoleName",
    "UserRole",
    "Role",
    "Permission",
    "RolePermission",
    "AcademicYear",
    "AcademicPeriod",
    "PeriodType",
    "Grade",
    "Section",
    "Classroom",
    "Enrollment",
    "EnrollmentStatus",
    "AcademicMovement",
    "AcademicMovementType",
    "AcademicIdempotencyRecord",
    "TeacherAssignment",
    "ResponsibilityType",
    "Course",
    "Unit",
    "Lesson",
    "Subject",
    "ContentVersion",
    "Resource",
    "LessonResource",
    "ResourceType",
    "ResourceStatus",
    "ContentReview",
    "ContentPublication",
    "ContentManifest",
    "ContentReviewStatus",
    "ContentReviewDecision",
    "ContentPublicationStatus",
    "ContentVisibility",
    "Practice",
    "PracticeVersion",
    "Exercise",
    "ExerciseOption",
    "PracticeAttempt",
    "PracticeResponse",
    "PracticeResult",
    "PracticeFeedback",
    "EducationalGame",
    "GameSession",
    "GameResult",
    "PracticeStatus",
    "PracticeType",
    "PracticeDifficulty",
    "ExerciseType",
    "AttemptStatus",
    "GameType",
    "GameSessionStatus",
    "Assessment",
    "AssessmentQuestion",
    "AssessmentAttempt",
    "AssessmentResponse",
    "AssessmentResult",
    "LearningProgress",
    "SyncOperationReceipt",
    "Assignment",
    "AssignmentTarget",
    "ReinforcementPlan",
    "UserCredential",
    "CredentialStatus",
    "AuthSession",
    "SessionStatus",
    "RefreshToken",
    "RefreshTokenStatus",
    "SecurityEvent",
    "SecurityEventType",
    "SecurityEventSeverity",
]
