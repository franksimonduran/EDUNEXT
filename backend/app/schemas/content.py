"""Schemas for educational content management."""

import enum
from datetime import date, datetime
from typing import List, Literal, Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SubjectStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class SubjectCreate(BaseModel):
    code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: SubjectStatus = SubjectStatus.ACTIVE
    sequence: int = Field(default=0, ge=0)
    icon: Optional[str] = Field(default=None, max_length=100)
    color: Optional[str] = Field(default=None, max_length=20)
    curriculum_code: Optional[str] = Field(default=None, max_length=50)
    keywords: List[str] = Field(default_factory=list)


class SubjectUpdate(BaseModel):
    code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[SubjectStatus] = None
    sequence: Optional[int] = Field(default=None, ge=0)
    icon: Optional[str] = Field(default=None, max_length=100)
    color: Optional[str] = Field(default=None, max_length=20)
    curriculum_code: Optional[str] = Field(default=None, max_length=50)
    keywords: Optional[List[str]] = None


class SubjectRead(BaseModel):
    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    status: str
    sequence: int
    icon: Optional[str] = None
    color: Optional[str] = None
    curriculum_code: Optional[str] = None
    keywords: List[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SubjectDetail(SubjectRead):
    course_count: int = 0


CourseStatus = Literal["draft", "active", "inactive", "archived"]
CourseVisibility = Literal["institution", "shared", "public"]


class CourseCreate(BaseModel):
    grade_id: UUID
    subject_id: UUID
    code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    icon: Optional[str] = Field(default=None, max_length=100)
    color: Optional[str] = Field(default=None, max_length=20)
    sequence: int = Field(default=0, ge=0)
    status: CourseStatus = "draft"
    visibility: CourseVisibility = "institution"


class CourseUpdate(BaseModel):
    grade_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None
    code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    icon: Optional[str] = Field(default=None, max_length=100)
    color: Optional[str] = Field(default=None, max_length=20)
    sequence: Optional[int] = Field(default=None, ge=0)
    status: Optional[CourseStatus] = None
    visibility: Optional[CourseVisibility] = None


class CourseRead(BaseModel):
    id: UUID
    institution_id: UUID
    grade_id: UUID
    subject_id: UUID
    code: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sequence: int
    status: str
    version: str
    visibility: str
    created_by_user_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CourseDetail(CourseRead):
    grade_name: str
    subject_name: str
    unit_count: int = 0
    lesson_count: int = 0
    resource_count: int = 0
    teacher_assignment_count: int = 0


UnitStatus = Literal["draft", "active", "inactive", "archived"]


class UnitCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    objectives: Optional[str] = Field(default=None, max_length=5000)
    sequence: int = Field(default=0, ge=0)
    estimated_hours: Optional[int] = Field(default=None, ge=0)
    status: UnitStatus = "draft"


class UnitUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    objectives: Optional[str] = Field(default=None, max_length=5000)
    sequence: Optional[int] = Field(default=None, ge=0)
    estimated_hours: Optional[int] = Field(default=None, ge=0)
    status: Optional[UnitStatus] = None


class UnitRead(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    description: Optional[str] = None
    objectives: Optional[str] = None
    sequence: int
    estimated_hours: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UnitDetail(UnitRead):
    course_name: str
    lesson_count: int = 0
    assessment_count: int = 0


LessonStatus = Literal["draft", "validation_failed", "ready_for_review", "in_review", "changes_requested", "approved", "published", "superseded", "withdrawn", "archived"]
BlockType = Literal["heading", "paragraph", "list", "image", "audio", "video", "example", "note", "table", "reflection_question", "resource", "summary"]


class LessonBlock(BaseModel):
    id: str = Field(min_length=1)
    type: BlockType
    position: int = Field(ge=0)
    data: Dict[str, Any]
    resource_ids: List[UUID] = Field(default_factory=list)


class LessonCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    objectives: Optional[str] = Field(default=None, max_length=5000)
    sequence: int = Field(default=0, ge=0)
    duration_minutes: Optional[int] = Field(default=None, ge=0)
    estimated_time_minutes: Optional[int] = Field(default=None, ge=0)
    difficulty_level: Optional[str] = Field(default=None, max_length=20)
    status: LessonStatus = "draft"
    blocks: List[LessonBlock] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    learning_objectives: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)


class LessonUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    objectives: Optional[str] = Field(default=None, max_length=5000)
    sequence: Optional[int] = Field(default=None, ge=0)
    duration_minutes: Optional[int] = Field(default=None, ge=0)
    estimated_time_minutes: Optional[int] = Field(default=None, ge=0)
    difficulty_level: Optional[str] = Field(default=None, max_length=20)
    status: Optional[LessonStatus] = None
    blocks: Optional[List[LessonBlock]] = None
    tags: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None


class LessonRead(BaseModel):
    id: UUID
    unit_id: UUID
    title: str
    description: Optional[str] = None
    objectives: Optional[str] = None
    sequence: int
    duration_minutes: Optional[int] = None
    estimated_time_minutes: Optional[int] = None
    difficulty_level: Optional[str] = None
    status: str
    version: str
    blocks: List[LessonBlock] = Field(default_factory=list)
    tags: List[str]
    keywords: List[str]
    learning_objectives: List[str]
    prerequisites: List[str]
    created_by_user_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LessonDetail(LessonRead):
    unit_title: str
    course_name: str
    resource_count: int = 0
    version_count: int = 0
    latest_version_id: Optional[UUID] = None
    published_version_id: Optional[UUID] = None


ContentVersionStatus = Literal["draft", "validation_failed", "ready_for_review", "in_review", "changes_requested", "approved", "published", "superseded", "withdrawn", "archived"]


class ContentVersionCreate(BaseModel):
    version: str = Field(min_length=1, max_length=20)
    version_number: int = Field(default=1, ge=1)
    snapshot: Dict[str, Any]
    change_summary: Optional[str] = Field(default=None, max_length=500)
    status: ContentVersionStatus = "draft"
    base_version_id: Optional[UUID] = None


class ContentVersionRead(BaseModel):
    id: UUID
    content_id: UUID
    content_type: str
    version: str
    version_number: int
    snapshot: Dict[str, Any]
    author_id: Optional[UUID] = None
    change_summary: Optional[str] = None
    status: str
    is_published: bool
    published_at: Optional[datetime] = None
    validation_result: Optional[Dict[str, Any]] = None
    base_version_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ContentVersionDetail(ContentVersionRead):
    reviews: List["ContentReviewRead"] = Field(default_factory=list)
    publications: List["ContentPublicationRead"] = Field(default_factory=list)


ResourceType = Literal["image", "audio", "video", "document", "interactive", "link", "archive", "other"]
ResourceStatus = Literal["draft", "available", "processing", "failed", "archived"]


class ResourceCreate(BaseModel):
    course_id: Optional[UUID] = None
    name: str = Field(min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    resource_type: ResourceType
    media_type: Optional[str] = Field(default=None, max_length=100)
    file_size: Optional[int] = Field(default=None, ge=0)
    storage_path: Optional[str] = Field(default=None, max_length=500)
    storage_provider: str = Field(default="local", max_length=50)
    checksum: Optional[str] = Field(default=None, max_length=64)
    checksum_algorithm: str = Field(default="sha256", max_length=20)
    version: str = Field(default="1.0", max_length=20)
    status: ResourceStatus = "draft"
    author_id: Optional[UUID] = None
    license: Optional[str] = Field(default=None, max_length=100)
    license_url: Optional[str] = Field(default=None, max_length=500)
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_offline_available: bool = False
    offline_size: Optional[int] = Field(default=None, ge=0)


class ResourceUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    resource_type: Optional[ResourceType] = None
    media_type: Optional[str] = Field(default=None, max_length=100)
    file_size: Optional[int] = Field(default=None, ge=0)
    storage_path: Optional[str] = Field(default=None, max_length=500)
    storage_provider: Optional[str] = Field(default=None, max_length=50)
    checksum: Optional[str] = Field(default=None, max_length=64)
    checksum_algorithm: Optional[str] = Field(default=None, max_length=20)
    version: Optional[str] = Field(default=None, max_length=20)
    status: Optional[ResourceStatus] = None
    author_id: Optional[UUID] = None
    license: Optional[str] = Field(default=None, max_length=100)
    license_url: Optional[str] = Field(default=None, max_length=500)
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    is_offline_available: Optional[bool] = None
    offline_size: Optional[int] = Field(default=None, ge=0)


class ResourceRead(BaseModel):
    id: UUID
    institution_id: UUID
    course_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    resource_type: str
    media_type: Optional[str] = None
    file_size: Optional[int] = None
    storage_path: Optional[str] = None
    storage_provider: str
    checksum: Optional[str] = None
    checksum_algorithm: str
    version: str
    status: str
    author_id: Optional[UUID] = None
    license: Optional[str] = None
    license_url: Optional[str] = None
    tags: List[str]
    metadata: Dict[str, Any]
    is_offline_available: bool
    offline_size: Optional[int] = None
    cached_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ResourceDetail(ResourceRead):
    lesson_count: int = 0
    lessons: List[Dict[str, Any]] = Field(default_factory=list)


class LessonResourceCreate(BaseModel):
    resource_id: UUID
    order: int = Field(default=0, ge=0)
    is_required: bool = False
    usage_context: Optional[str] = Field(default=None, max_length=255)


class LessonResourceRead(BaseModel):
    id: UUID
    lesson_id: UUID
    resource_id: UUID
    order: int
    is_required: bool
    usage_context: Optional[str] = None
    resource: Optional[ResourceRead] = None
    model_config = ConfigDict(from_attributes=True)


ContentReviewStatus = Literal["pending", "in_review", "changes_requested", "approved", "rejected"]
ContentReviewDecision = Literal["approve", "request_changes", "reject"]


class ContentReviewSubmit(BaseModel):
    content_version_id: UUID


class ContentReviewDecisionRequest(BaseModel):
    decision: ContentReviewDecision
    observations: Optional[str] = Field(default=None, max_length=5000)
    pedagogical_notes: Optional[str] = Field(default=None, max_length=5000)
    technical_notes: Optional[str] = Field(default=None, max_length=5000)


class ContentReviewRead(BaseModel):
    id: UUID
    content_version_id: UUID
    reviewer_user_id: UUID
    institution_id: UUID
    status: str
    decision: Optional[str] = None
    observations: Optional[str] = None
    pedagogical_notes: Optional[str] = None
    technical_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    submitted_at: datetime
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ContentReviewDetail(ContentReviewRead):
    reviewer_name: Optional[str] = None
    content_version: Optional[ContentVersionRead] = None


ContentPublicationStatus = Literal["draft", "pending_publication", "published", "withdrawn", "superseded", "archived"]
ContentVisibility = Literal["institution", "shared", "public"]


class ContentPublicationCreate(BaseModel):
    content_version_id: UUID
    visibility: ContentVisibility = "institution"
    shared_institution_ids: List[UUID] = Field(default_factory=list)
    publication_notes: Optional[str] = Field(default=None, max_length=5000)


class ContentPublicationUpdate(BaseModel):
    visibility: Optional[ContentVisibility] = None
    shared_institution_ids: Optional[List[UUID]] = None
    publication_notes: Optional[str] = Field(default=None, max_length=5000)


class ContentPublicationWithdraw(BaseModel):
    withdrawal_reason: str = Field(min_length=2, max_length=5000)


class ContentPublicationRead(BaseModel):
    id: UUID
    content_version_id: UUID
    institution_id: UUID
    published_by_user_id: UUID
    review_id: Optional[UUID] = None
    status: str
    visibility: str
    shared_institution_ids: List[UUID]
    published_at: Optional[datetime] = None
    withdrawn_at: Optional[datetime] = None
    withdrawal_reason: Optional[str] = None
    publication_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ContentPublicationDetail(ContentPublicationRead):
    published_by_name: Optional[str] = None
    content_version: Optional[ContentVersionRead] = None
    review: Optional[ContentReviewRead] = None


class ContentManifestCreate(BaseModel):
    course_id: UUID
    grade_id: UUID
    version: str = Field(min_length=1, max_length=50)
    content_version_ids: List[UUID] = Field(default_factory=list)
    resource_ids: List[UUID] = Field(default_factory=list)
    checksums: Dict[str, str] = Field(default_factory=dict)
    required_resources: List[UUID] = Field(default_factory=list)
    total_size_bytes: int = Field(default=0, ge=0)
    expires_at: Optional[datetime] = None


class ContentManifestRead(BaseModel):
    id: UUID
    course_id: UUID
    grade_id: UUID
    institution_id: UUID
    version: str
    manifest_version: int
    content_version_ids: List[UUID]
    resource_ids: List[UUID]
    checksums: Dict[str, str]
    required_resources: List[UUID]
    total_size_bytes: int
    generated_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ContentManifestDetail(ContentManifestRead):
    course_name: str
    grade_name: str


class ContentValidationRequest(BaseModel):
    content_type: Literal["lesson", "unit", "course"]
    content_id: UUID
    version_id: Optional[UUID] = None


class ContentValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    details: Dict[str, Any] = Field(default_factory=dict)


SubjectRead.model_rebuild()
CourseRead.model_rebuild()
UnitRead.model_rebuild()
LessonRead.model_rebuild()
ContentVersionRead.model_rebuild()
ResourceRead.model_rebuild()
LessonResourceRead.model_rebuild()
ContentReviewRead.model_rebuild()
ContentPublicationRead.model_rebuild()
ContentManifestRead.model_rebuild()