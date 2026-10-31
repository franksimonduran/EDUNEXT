"""Unit service."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import Course, Unit
from app.repositories import CourseRepository, UnitRepository
from app.schemas.content import UnitCreate, UnitUpdate
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class UnitService:
    """Unit management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = UnitRepository(session)
        self.course_repo = CourseRepository(session)

    async def list_units(
        self,
        context: AuthorizationContext,
        course_id: UUID,
        *,
        page: int,
        page_size: int,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Unit], int]:
        # Verify course access
        course = await self.course_repo.get_course(context.institution_id, course_id)
        
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read units")
        
        return await self.repository.list_units(
            course_id=course_id,
            page=page,
            page_size=page_size,
            status=status,
            search=search,
        )

    async def get_unit(self, context: AuthorizationContext, unit_id: UUID) -> Unit:
        if not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read units")
        unit = await self.repository.get_unit(unit_id)
        await self.course_repo.get_course(context.institution_id, UUID(unit.course_id))
        return unit

    async def get_unit_detail(self, context: AuthorizationContext, unit_id: UUID) -> Unit:
        unit = await self.get_unit(context, unit_id)
        stats = await self.repository.get_unit_stats(unit_id)
        unit.lesson_count = stats["lesson_count"]
        return unit

    async def create_unit(
        self,
        context: AuthorizationContext,
        course_id: UUID,
        data: UnitCreate,
    ) -> Unit:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to create units")

        course = await self.course_repo.get_course(context.institution_id, course_id)
        
        # Check if course is in a state that allows modifications
        if course.status in ["archived"]:
            raise ConflictError("Cannot add units to an archived course")

        # Check for duplicate sequence
        existing_units = await self.repository.list_units(
            course_id=course_id,
            page=1,
            page_size=1000,
        )
        for unit in existing_units[0]:
            if unit.sequence == data.sequence:
                raise ConflictError("A unit with this sequence already exists in the course")

        unit_data = data.model_dump()
        unit_data["course_id"] = str(course_id)
        
        unit = await self.repository.create_unit(unit_data)
        await self.session.commit()
        return unit

    async def update_unit(
        self,
        context: AuthorizationContext,
        unit_id: UUID,
        data: UnitUpdate,
    ) -> Unit:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to update units")

        unit = await self.repository.get_unit(unit_id)
        
        # Verify course access
        course = await self.course_repo.get_course(context.institution_id, UUID(unit.course_id))
        if course.status in ["archived"]:
            raise ConflictError("Cannot modify units in an archived course")

        update_data = data.model_dump(exclude_unset=True)

        # Check for duplicate sequence if changing
        if "sequence" in update_data:
            existing_units = await self.repository.list_units(
                course_id=UUID(unit.course_id),
                page=1,
                page_size=1000,
            )
            for u in existing_units[0]:
                if u.id != unit_id and u.sequence == update_data["sequence"]:
                    raise ConflictError("A unit with this sequence already exists in the course")

        unit = await self.repository.update_unit(unit, update_data)
        await self.session.commit()
        return unit

    async def delete_unit(self, context: AuthorizationContext, unit_id: UUID) -> None:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to delete units")

        unit = await self.repository.get_unit(unit_id)
        
        # Verify course access
        course = await self.course_repo.get_course(context.institution_id, UUID(unit.course_id))
        if course.status in ["archived"]:
            raise ConflictError("Cannot delete units from an archived course")

        await self.repository.delete_unit(unit)
        await self.session.commit()

    async def reorder_units(
        self,
        context: AuthorizationContext,
        course_id: UUID,
        unit_ids: List[UUID],
    ) -> List[Unit]:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to reorder units")

        course = await self.course_repo.get_course(context.institution_id, course_id)
        if course.status in ["archived"]:
            raise ConflictError("Cannot reorder units in an archived course")

        units = await self.repository.reorder_units(course_id, unit_ids)
        await self.session.commit()
        return units
