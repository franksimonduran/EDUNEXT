"""Read-only grade catalog endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import require_permission
from app.schemas.academic import GradeRead
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_structure_service import AcademicStructureService
from app.db.session import get_async_session_dependency
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/grades", tags=["Grades"])


def get_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AcademicStructureService:
    return AcademicStructureService(session)


@router.get("", response_model=List[GradeRead])
async def list_grades(
    grade_status: Optional[str] = Query(default=None, alias="status"),
    include_inactive: bool = Query(default=False),
    context: AuthorizationContext = Depends(require_permission(Permissions.GRADES_READ)),
    service: AcademicStructureService = Depends(get_service),
):
    return await service.list_grades(status=grade_status, include_inactive=include_inactive)


@router.get("/{grade_id}", response_model=GradeRead)
async def get_grade(
    grade_id: UUID,
    context: AuthorizationContext = Depends(require_permission(Permissions.GRADES_READ)),
    service: AcademicStructureService = Depends(get_service),
):
    return await service.get_grade(grade_id)
