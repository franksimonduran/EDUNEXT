"""Content publication repository."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import ContentPublication, ContentVersion, ContentReview, User
from app.core.exceptions import NotFoundError


class ContentPublicationRepository:
    """Repository for content publication operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_publications(
        self,
        *,
        institution_id: UUID,
        page: int,
        page_size: int,
        content_version_id: Optional[UUID] = None,
        status: Optional[str] = None,
        visibility: Optional[str] = None,
    ) -> Tuple[List[ContentPublication], int]:
        conditions = [ContentPublication.institution_id == str(institution_id)]
        if content_version_id:
            conditions.append(ContentPublication.content_version_id == str(content_version_id))
        if status:
            conditions.append(ContentPublication.status == status)
        if visibility:
            conditions.append(ContentPublication.visibility == visibility)

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(ContentPublication).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(ContentPublication)
            .where(*conditions)
            .options(
                selectinload(ContentPublication.content_version),
                selectinload(ContentPublication.published_by),
                selectinload(ContentPublication.review),
            )
            .order_by(ContentPublication.published_at.desc().nullslast(), ContentPublication.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_publication(self, institution_id: UUID, publication_id: UUID) -> ContentPublication:
        stmt = (
            select(ContentPublication)
            .where(
                ContentPublication.id == str(publication_id),
                ContentPublication.institution_id == str(institution_id),
            )
            .options(
                selectinload(ContentPublication.content_version),
                selectinload(ContentPublication.published_by),
                selectinload(ContentPublication.review),
            )
        )
        publication = (await self.session.execute(stmt)).scalars().first()
        if not publication:
            raise NotFoundError("Content publication not found")
        return publication

    async def get_publication_for_version(self, content_version_id: UUID) -> Optional[ContentPublication]:
        stmt = (
            select(ContentPublication)
            .where(ContentPublication.content_version_id == str(content_version_id))
            .options(
                selectinload(ContentPublication.content_version),
                selectinload(ContentPublication.published_by),
                selectinload(ContentPublication.review),
            )
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def get_active_publication_for_course(self, course_id: UUID, grade_id: UUID) -> Optional[ContentPublication]:
        from app.db.models import Lesson, Unit
        stmt = (
            select(ContentPublication)
            .join(ContentVersion, ContentPublication.content_version_id == ContentVersion.id)
            .join(Lesson, ContentVersion.content_id == Lesson.id)
            .join(Unit, Lesson.unit_id == Unit.id)
            .where(
                Unit.course_id == str(course_id),
                ContentPublication.status == "published",
            )
            .options(selectinload(ContentPublication.content_version))
            .order_by(ContentPublication.published_at.desc())
            .limit(1)
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def create_publication(self, data: dict) -> ContentPublication:
        publication = ContentPublication(**data)
        self.session.add(publication)
        await self.session.flush()
        await self.session.refresh(publication)
        return publication

    async def update_publication(self, publication: ContentPublication, data: dict) -> ContentPublication:
        for key, value in data.items():
            if value is not None:
                setattr(publication, key, value)
        await self.session.flush()
        await self.session.refresh(publication)
        return publication

    async def delete_publication(self, publication: ContentPublication) -> None:
        await self.session.delete(publication)
        await self.session.flush()