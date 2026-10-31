"""Content access control dependencies."""

from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.dependencies.auth import get_authorization_context
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.course_service import CourseService
from app.services.unit_service import UnitService
from app.services.lesson_service import LessonService
from app.services.content_version_service import ContentVersionService
from app.services.educational_resource_service import EducationalResourceService


async def require_course_access(
    course_id: UUID,
    context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Verify user has access to a course."""
    service = CourseService(session)
    try:
        await service.get_course(context, course_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this course",
        )
    return context


async def require_course_manage_access(
    course_id: UUID,
    context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Verify user has manage access to a course."""
    if not any(p in context.permissions for p in [
        Permissions.COURSES_CREATE,
        Permissions.COURSES_UPDATE,
        Permissions.COURSES_DELETE,
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to manage courses",
        )
    
    service = CourseService(session)
    try:
        await service.get_course(context, course_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this course",
        )
    return context


async def require_unit_access(
    unit_id: UUID,
    context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Verify user has access to a unit."""
    service = UnitService(session)
    try:
        await service.get_unit(context, unit_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this unit",
        )
    return context


async def require_unit_manage_access(
    unit_id: UUID,
    context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Verify user has manage access to a unit."""
    if not any(p in context.permissions for p in [
        Permissions.COURSES_CREATE,
        Permissions.COURSES_UPDATE,
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to manage units",
        )
    
    service = UnitService(session)
    try:
        await service.get_unit(context, unit_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this unit",
        )
    return context


async def require_lesson_access(
    lesson_id: UUID,
    context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Verify user has access to a lesson."""
    service = LessonService(session)
    try:
        await service.get_lesson(context, lesson_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this lesson",
        )
    return context


async def require_lesson_manage_access(
    lesson_id: UUID,
    context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Verify user has manage access to a lesson."""
    if not any(p in context.permissions for p in [
        Permissions.COURSES_CREATE,
        Permissions.COURSES_UPDATE,
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to manage lessons",
        )
    
    service = LessonService(session)
    try:
        await service.get_lesson(context, lesson_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this lesson",
        )
    return context


async def require_content_version_access(
    version_id: UUID,
    context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Verify user has access to a content version."""
    service = ContentVersionService(session)
    try:
        await service.get_version(context, version_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this content version",
        )
    return context


async def require_resource_access(
    resource_id: UUID,
    context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Verify user has access to a resource."""
    service = EducationalResourceService(session)
    try:
        await service.get_resource(context, resource_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this resource",
        )
    return context


async def require_review_access(
    review_id: UUID,
    context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Verify user has access to a content review."""
    from app.services.content_review_service import ContentReviewService
    service = ContentReviewService(session)
    try:
        await service.get_review(context, review_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this review",
        )
    return context


async def require_publication_access(
    publication_id: UUID,
    context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Verify user has access to a content publication."""
    from app.services.content_publication_service import ContentPublicationService
    service = ContentPublicationService(session)
    try:
        await service.get_publication(context, publication_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this publication",
        )
    return context


async def require_manifest_access(
    manifest_id: UUID,
    context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Verify user has access to a content manifest."""
    from app.services.content_manifest_service import ContentManifestService
    service = ContentManifestService(session)
    try:
        await service.get_manifest(context, manifest_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this manifest",
        )
    return context