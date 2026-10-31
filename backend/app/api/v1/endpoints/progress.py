"""Own progress operations; unsupported sources are explicitly unavailable."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.db.session import get_async_session_dependency
from app.dependencies.auth import require_permission
from app.schemas.common import Page
from app.schemas.permission import AuthorizationContext, Permissions
from app.schemas.progress import AchievementRead, CourseProgressRead, LearningHistoryRead, LessonProgressRead, ProgressOverview, RecordLessonActivity, SourceAvailability, UnitProgressRead
from app.services.academic_common import pages
from app.services.progress_service import ProgressService

def no_cache(response: Response):
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["Vary"] = "Authorization, Cookie"


router = APIRouter(tags=["Learning progress"], dependencies=[Depends(no_cache)])
own = require_permission(Permissions.PROGRESS_READ_OWN)


@router.get("/monitors/me/student-progress")
async def monitor_progress(classroom_id: UUID, course_id: UUID, period_id: UUID | None = None,
                           page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
                           context: AuthorizationContext = Depends(require_permission(Permissions.PROGRESS_READ_ASSIGNED)),
                           session: AsyncSession = Depends(get_async_session_dependency)):
    from app.services.monitor_progress_service import MonitorProgressService
    items, total = await MonitorProgressService(session).students(context, classroom_id, course_id,
        page=page, page_size=page_size, period_id=period_id)
    return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": pages(total, page_size)}


@router.get("/progress/institution/summary")
async def institution_summary(
    context: AuthorizationContext = Depends(require_permission(Permissions.PROGRESS_READ_INSTITUTION_AGGREGATES)),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    from app.services.progress_aggregation_service import ProgressAggregationService
    return await ProgressAggregationService(session).summary(context)


@router.get("/progress/me", response_model=ProgressOverview)
async def overview(context: AuthorizationContext = Depends(own), session: AsyncSession = Depends(get_async_session_dependency)):
    return await ProgressService(session).overview(context)


@router.get("/progress/me/courses", response_model=Page[CourseProgressRead])
async def courses(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
                  context: AuthorizationContext = Depends(own), session: AsyncSession = Depends(get_async_session_dependency)):
    result = await ProgressService(session).overview(context, page=page, page_size=page_size)
    total = result.active_courses_count
    return Page(items=result.courses, total=total, page=page, page_size=page_size, pages=pages(total, page_size))


@router.get("/progress/courses/{course_id}", response_model=CourseProgressRead)
async def course(course_id: UUID, context: AuthorizationContext = Depends(own), session: AsyncSession = Depends(get_async_session_dependency)):
    return await ProgressService(session).course(context, course_id)


@router.get("/progress/units/{unit_id}", response_model=UnitProgressRead)
async def unit(unit_id: UUID, context: AuthorizationContext = Depends(own), session: AsyncSession = Depends(get_async_session_dependency)):
    return await ProgressService(session).unit(context, unit_id)


@router.get("/progress/lessons/{lesson_id}", response_model=LessonProgressRead)
async def lesson(lesson_id: UUID, context: AuthorizationContext = Depends(own), session: AsyncSession = Depends(get_async_session_dependency)):
    return await ProgressService(session).lesson(context, lesson_id)


@router.post("/progress/lessons/{lesson_id}/start", response_model=LessonProgressRead)
async def start(lesson_id: UUID, data: RecordLessonActivity, context: AuthorizationContext = Depends(own), session: AsyncSession = Depends(get_async_session_dependency)):
    result = await ProgressService(session).record(context, lesson_id, data.lesson_version_id, complete=False)
    await session.commit()
    return result


@router.post("/progress/lessons/{lesson_id}/complete", response_model=LessonProgressRead)
async def complete(lesson_id: UUID, data: RecordLessonActivity, context: AuthorizationContext = Depends(own), session: AsyncSession = Depends(get_async_session_dependency)):
    result = await ProgressService(session).record(context, lesson_id, data.lesson_version_id, complete=True)
    await session.commit()
    return result


@router.get("/progress/me/achievements", response_model=list[AchievementRead])
async def achievements(context: AuthorizationContext = Depends(own), session: AsyncSession = Depends(get_async_session_dependency)):
    return await ProgressService(session).achievements(context)


@router.get("/badges", response_model=list[AchievementRead])
@router.get("/achievements", response_model=list[AchievementRead])
async def badges(context: AuthorizationContext = Depends(own)):
    from app.services.progress_calculator import ACHIEVEMENTS
    return [AchievementRead(**{k: v for k, v in r.items() if k != "threshold"}) for r in ACHIEVEMENTS]


@router.get("/progress/competencies", response_model=SourceAvailability)
async def competencies(context: AuthorizationContext = Depends(own), session: AsyncSession = Depends(get_async_session_dependency)):
    await ProgressService(session).student(context)
    return SourceAvailability(reason="FASE 40 does not yet persist confirmed competency achievements")


@router.get("/progress/me/history", response_model=Page[LearningHistoryRead])
async def history(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100), course_id: UUID | None = None,
                  event_type: Literal["lesson_started", "lesson_completed"] | None = None,
                  since: datetime | None = None, until: datetime | None = None,
                  context: AuthorizationContext = Depends(own), session: AsyncSession = Depends(get_async_session_dependency)):
    if any(x is not None and x.tzinfo is None for x in (since, until)):
        raise ValidationError("Date filters require a timezone offset")
    if since and until and until < since:
        raise ValidationError("Invalid date range")
    items, total = await ProgressService(session).history(context, page=page, page_size=page_size,
        course_id=course_id, event_type=event_type, since=since, until=until)
    return Page(items=items, total=total, page=page, page_size=page_size, pages=pages(total, page_size))
