"""Content version repository."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import ContentVersion, ContentReview, ContentPublication
from app.core.exceptions import NotFoundError


class ContentVersionRepository:
    """Repository for content version operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_versions(
        self,
        *,
        content_id: UUID,
        content_type: str,
        page: int,
        page_size: int,
        status: Optional[str] = None,
    ) -> Tuple[List[ContentVersion], int]:
        conditions = [
            ContentVersion.content_id == str(content_id),
            ContentVersion.content_type == content_type,
        ]
        if status:
            conditions.append(ContentVersion.status == status)

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(ContentVersion).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(ContentVersion)
            .where(*conditions)
            .order_by(ContentVersion.version_number.desc(), ContentVersion.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_version(self, version_id: UUID) -> ContentVersion:
        stmt = select(ContentVersion).where(ContentVersion.id == str(version_id))
        version = (await self.session.execute(stmt)).scalars().first()
        if not version:
            raise NotFoundError("Content version not found")
        return version

    async def get_version_with_relations(self, version_id: UUID) -> ContentVersion:
        stmt = (
            select(ContentVersion)
            .where(ContentVersion.id == str(version_id))
            .options(
                selectinload(ContentVersion.reviews),
                selectinload(ContentVersion.publications),
            )
        )
        version = (await self.session.execute(stmt)).scalars().first()
        if not version:
            raise NotFoundError("Content version not found")
        return version

    async def get_latest_version(self, content_id: UUID, content_type: str) -> Optional[ContentVersion]:
        stmt = (
            select(ContentVersion)
            .where(
                ContentVersion.content_id == str(content_id),
                ContentVersion.content_type == content_type,
            )
            .order_by(ContentVersion.version_number.desc(), ContentVersion.created_at.desc())
            .limit(1)
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def get_published_version(self, content_id: UUID, content_type: str) -> Optional[ContentVersion]:
        stmt = (
            select(ContentVersion)
            .where(
                ContentVersion.content_id == str(content_id),
                ContentVersion.content_type == content_type,
                ContentVersion.is_published == True,
            )
            .order_by(ContentVersion.version_number.desc(), ContentVersion.created_at.desc())
            .limit(1)
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def create_version(self, data: dict) -> ContentVersion:
        version = ContentVersion(**data)
        self.session.add(version)
        await self.session.flush()
        await self.session.refresh(version)
        return version

    async def update_version(self, version: ContentVersion, data: dict) -> ContentVersion:
        for key, value in data.items():
            if value is not None:
                setattr(version, key, value)
        await self.session.flush()
        await self.session.refresh(version)
        return version

    async def delete_version(self, version: ContentVersion) -> None:
        await self.session.delete(version)
        await self.session.flush()

    async def get_next_version_number(self, content_id: UUID, content_type: str) -> int:
        result = await self.session.execute(
            select(func.coalesce(func.max(ContentVersion.version_number), 0)).where(
                ContentVersion.content_id == str(content_id),
                ContentVersion.content_type == content_type,
            )
        )
        return result.scalar_one() + 1