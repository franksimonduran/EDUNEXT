"""Unit repository."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Unit, Lesson
from app.core.exceptions import NotFoundError


class UnitRepository:
    """Repository for unit operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_units(
        self,
        *,
        course_id: UUID,
        page: int,
        page_size: int,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Unit], int]:
        conditions = [Unit.course_id == str(course_id)]
        if status:
            conditions.append(Unit.status == status)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                func.lower(Unit.title).like(pattern)
            )

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Unit).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(Unit)
            .where(*conditions)
            .order_by(Unit.sequence.asc(), Unit.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_unit(self, unit_id: UUID) -> Unit:
        stmt = select(Unit).where(Unit.id == str(unit_id))
        unit = (await self.session.execute(stmt)).scalars().first()
        if not unit:
            raise NotFoundError("Unit not found")
        return unit

    async def get_unit_with_course(self, unit_id: UUID) -> Unit:
        stmt = select(Unit).where(Unit.id == str(unit_id)).options(selectinload(Unit.course))
        unit = (await self.session.execute(stmt)).scalars().first()
        if not unit:
            raise NotFoundError("Unit not found")
        return unit

    async def create_unit(self, data: dict) -> Unit:
        unit = Unit(**data)
        self.session.add(unit)
        await self.session.flush()
        await self.session.refresh(unit)
        return unit

    async def update_unit(self, unit: Unit, data: dict) -> Unit:
        for key, value in data.items():
            if value is not None:
                setattr(unit, key, value)
        await self.session.flush()
        await self.session.refresh(unit)
        return unit

    async def delete_unit(self, unit: Unit) -> None:
        await self.session.delete(unit)
        await self.session.flush()

    async def reorder_units(self, course_id: UUID, unit_ids: List[UUID]) -> List[Unit]:
        for index, unit_id in enumerate(unit_ids):
            unit = await self.get_unit(unit_id)
            if unit.course_id != str(course_id):
                from app.core.exceptions import ValidationError
                raise ValidationError(f"Unit {unit_id} does not belong to course {course_id}")
            unit.sequence = index
        await self.session.flush()
        stmt = select(Unit).where(Unit.course_id == str(course_id)).order_by(Unit.sequence.asc())
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_unit_stats(self, unit_id: UUID) -> dict:
        lesson_count = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Lesson).where(Lesson.unit_id == str(unit_id))
                )
            ).scalar_one()
        )
        return {"lesson_count": lesson_count}