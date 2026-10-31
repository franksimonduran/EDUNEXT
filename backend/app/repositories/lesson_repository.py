"""Lesson repository."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Lesson, Unit, ContentVersion, Resource, LessonResource
from app.core.exceptions import NotFoundError


class LessonRepository:
    """Repository for lesson operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_lessons(
        self,
        *,
        unit_id: UUID,
        page: int,
        page_size: int,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Lesson], int]:
        conditions = [Lesson.unit_id == str(unit_id)]
        if status:
            conditions.append(Lesson.status == status)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(Lesson.title).like(pattern),
                    func.lower(Lesson.description).like(pattern),
                )
            )

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Lesson).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(Lesson)
            .where(*conditions)
            .options(selectinload(Lesson.unit))
            .order_by(Lesson.sequence.asc(), Lesson.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_lesson(self, lesson_id: UUID) -> Lesson:
        stmt = select(Lesson).where(Lesson.id == str(lesson_id))
        lesson = (await self.session.execute(stmt)).scalars().first()
        if not lesson:
            raise NotFoundError("Lesson not found")
        return lesson

    async def get_lesson_with_unit(self, lesson_id: UUID) -> Lesson:
        stmt = select(Lesson).where(Lesson.id == str(lesson_id)).options(selectinload(Lesson.unit))
        lesson = (await self.session.execute(stmt)).scalars().first()
        if not lesson:
            raise NotFoundError("Lesson not found")
        return lesson

    async def get_lesson_detail(self, lesson_id: UUID) -> Lesson:
        stmt = (
            select(Lesson)
            .where(Lesson.id == str(lesson_id))
            .options(
                selectinload(Lesson.unit).selectinload(Unit.course),
                selectinload(Lesson.resources).selectinload(LessonResource.resource),
            )
        )
        lesson = (await self.session.execute(stmt)).scalars().first()
        if not lesson:
            raise NotFoundError("Lesson not found")
        return lesson

    async def create_lesson(self, data: dict) -> Lesson:
        lesson = Lesson(**data)
        self.session.add(lesson)
        await self.session.flush()
        await self.session.refresh(lesson)
        return lesson

    async def update_lesson(self, lesson: Lesson, data: dict) -> Lesson:
        for key, value in data.items():
            if value is not None:
                setattr(lesson, key, value)
        await self.session.flush()
        await self.session.refresh(lesson)
        return lesson

    async def delete_lesson(self, lesson: Lesson) -> None:
        await self.session.delete(lesson)
        await self.session.flush()

    async def reorder_lessons(self, unit_id: UUID, lesson_ids: List[UUID]) -> List[Lesson]:
        for index, lesson_id in enumerate(lesson_ids):
            lesson = await self.get_lesson(lesson_id)
            if lesson.unit_id != str(unit_id):
                from app.core.exceptions import ValidationError
                raise ValidationError(f"Lesson {lesson_id} does not belong to unit {unit_id}")
            lesson.sequence = index
        await self.session.flush()
        stmt = select(Lesson).where(Lesson.unit_id == str(unit_id)).order_by(Lesson.sequence.asc())
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_lesson_resources(self, lesson_id: UUID) -> List[Resource]:
        stmt = (
            select(Resource)
            .join(LessonResource, LessonResource.resource_id == Resource.id)
            .where(LessonResource.lesson_id == str(lesson_id))
            .order_by(LessonResource.order.asc())
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def add_resource_to_lesson(self, lesson_id: UUID, resource_id: UUID, order: int = 0, is_required: bool = False, usage_context: Optional[str] = None) -> LessonResource:
        from app.db.models import LessonResource
        lesson_resource = LessonResource(
            lesson_id=str(lesson_id),
            resource_id=str(resource_id),
            order=order,
            is_required=is_required,
            usage_context=usage_context,
        )
        self.session.add(lesson_resource)
        await self.session.flush()
        await self.session.refresh(lesson_resource)
        return lesson_resource

    async def remove_resource_from_lesson(self, lesson_id: UUID, resource_id: UUID) -> None:
        from app.db.models import LessonResource
        stmt = select(LessonResource).where(
            LessonResource.lesson_id == str(lesson_id),
            LessonResource.resource_id == str(resource_id),
        )
        lr = (await self.session.execute(stmt)).scalars().first()
        if lr:
            await self.session.delete(lr)
            await self.session.flush()