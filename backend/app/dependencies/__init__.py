"""Dependencies package."""

from app.dependencies.common import get_request_id, get_current_settings, verify_api_key
from app.dependencies.auth import (
    get_auth_service,
    get_current_user,
    get_current_session,
    get_current_institution,
    get_authorization_context,
    get_current_user_optional,
    verify_csrf_protection,
    enforce_login_rate_limit,
)
from app.dependencies.content_access import (
    require_course_access,
    require_course_manage_access,
    require_unit_access,
    require_unit_manage_access,
    require_lesson_access,
    require_lesson_manage_access,
    require_content_version_access,
    require_resource_access,
    require_review_access,
    require_publication_access,
    require_manifest_access,
)

__all__ = [
    "get_request_id",
    "get_current_settings",
    "verify_api_key",
    "get_auth_service",
    "get_current_user",
    "get_current_session",
    "get_current_institution",
    "get_authorization_context",
    "get_current_user_optional",
    "verify_csrf_protection",
    "enforce_login_rate_limit",
    "require_course_access",
    "require_course_manage_access",
    "require_unit_access",
    "require_unit_manage_access",
    "require_lesson_access",
    "require_lesson_manage_access",
    "require_content_version_access",
    "require_resource_access",
    "require_review_access",
    "require_publication_access",
    "require_manifest_access",
]