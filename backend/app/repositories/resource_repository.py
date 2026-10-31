"""Educational resource repository."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Resource, LessonResource, Lesson
from app.core.exceptions import NotFoundError


class ResourceRepository:
    """Repository for educational resource operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_resources(
        self,
        *,
        institution_id: UUID,
        page: int,
        page_size: int,
        course_id: Optional[UUID] = None,
        resource_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Resource], int]:
        conditions = [Resource.institution_id == str(institution_id)]
        if course_id:
            conditions.append(Resource.course_id == str(course_id))
        if resource_type:
            conditions.append(Resource.resource_type == resource_type)
        if status:
            conditions.append(Resource.status == status)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(Resource.name).like(pattern),
                    func.lower(Resource.description).like(pattern),
                )
            )

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Resource).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(Resource)
            .where(*conditions)
            .options(selectinload(Resource.course))
            .order_by(Resource.created_at.desc(), Resource.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_resource(self, institution_id: UUID, resource_id: UUID) -> Resource:
        stmt = select(Resource).where(
            Resource.id == str(resource_id),
            Resource.institution_id == str(institution_id),
        )
        resource = (await self.session.execute(stmt)).scalars().first()
        if not resource:
            raise NotFoundError("Resource not found")
        return resource

    async def get_resource_with_relations(self, resource_id: UUID) -> Resource:
        stmt = (
            select(Resource)
            .where(Resource.id == str(resource_id))
            .options(selectinload(Resource.course), selectinload(Resource.lesson_resources).selectinload(LessonResource.lesson))
        )
        resource = (await self.session.execute(stmt)).scalars().first()
        if not resource:
            raise NotFoundError("Resource not found")
        return resource

    async def create_resource(self, data: dict) -> Resource:
        resource = Resource(**data)
        self.session.add(resource)
        await self.session.flush()
        await self.session.refresh(resource)
        return resource

    async def update_resource(self, resource: Resource, data: dict) -> Resource:
        for key, value in data.items():
            if value is not None:
                setattr(resource, key, value)
        await self.session.flush()
        await self.session.refresh(resource)
        return resource

    async def delete_resource(self, resource: Resource) -> None:
        await self.session.delete(resource)
        await self.session.flush()

    async def get_resource_usage(self, resource_id: UUID) -> List[dict]:
        from app.db.models import Lesson, Unit
        stmt = (
            select(LessonResource, Lesson, Unit)
            .join(Lesson, LessonResource.lesson_id == Lesson.id)
            .join(Unit, Lesson.unit_id == Unit.id)
            .where(LessonResource.resource_id == str(resource_id))
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {
                "lesson_id": str(lr.lesson_id),
                "lesson_title": lesson.title,
                "unit_id": str(unit.id),
                "unit_title": unit.title,
                "order": lr.order,
                "is_required": lr.is_required,
                "usage_context": lr.usage_context,
            }
            for lr, lesson, unit in rows
        ]