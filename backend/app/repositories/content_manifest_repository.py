"""Content manifest repository."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import ContentManifest, Course, Grade
from app.core.exceptions import NotFoundError


class ContentManifestRepository:
    """Repository for content manifest operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_manifests(
        self,
        *,
        institution_id: UUID,
        page: int,
        page_size: int,
        course_id: Optional[UUID] = None,
        grade_id: Optional[UUID] = None,
        is_active: Optional[bool] = None,
    ) -> Tuple[List[ContentManifest], int]:
        conditions = [ContentManifest.institution_id == str(institution_id)]
        if course_id:
            conditions.append(ContentManifest.course_id == str(course_id))
        if grade_id:
            conditions.append(ContentManifest.grade_id == str(grade_id))
        if is_active is not None:
            conditions.append(ContentManifest.is_active == is_active)

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(ContentManifest).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(ContentManifest)
            .where(*conditions)
            .options(selectinload(ContentManifest.course), selectinload(ContentManifest.grade))
            .order_by(ContentManifest.generated_at.desc(), ContentManifest.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_manifest(self, institution_id: UUID, manifest_id: UUID) -> ContentManifest:
        stmt = (
            select(ContentManifest)
            .where(
                ContentManifest.id == str(manifest_id),
                ContentManifest.institution_id == str(institution_id),
            )
            .options(selectinload(ContentManifest.course), selectinload(ContentManifest.grade))
        )
        manifest = (await self.session.execute(stmt)).scalars().first()
        if not manifest:
            raise NotFoundError("Content manifest not found")
        return manifest

    async def get_manifest_by_course_grade_version(
        self, institution_id: UUID, course_id: UUID, grade_id: UUID, version: str
    ) -> Optional[ContentManifest]:
        stmt = select(ContentManifest).where(
            ContentManifest.institution_id == str(institution_id),
            ContentManifest.course_id == str(course_id),
            ContentManifest.grade_id == str(grade_id),
            ContentManifest.version == version,
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def get_latest_manifest(self, institution_id: UUID, course_id: UUID, grade_id: UUID) -> Optional[ContentManifest]:
        stmt = (
            select(ContentManifest)
            .where(
                ContentManifest.institution_id == str(institution_id),
                ContentManifest.course_id == str(course_id),
                ContentManifest.grade_id == str(grade_id),
                ContentManifest.is_active == True,
            )
            .order_by(ContentManifest.manifest_version.desc(), ContentManifest.generated_at.desc())
            .limit(1)
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def create_manifest(self, data: dict) -> ContentManifest:
        manifest = ContentManifest(**data)
        self.session.add(manifest)
        await self.session.flush()
        await self.session.refresh(manifest)
        return manifest

    async def update_manifest(self, manifest: ContentManifest, data: dict) -> ContentManifest:
        for key, value in data.items():
            if value is not None:
                setattr(manifest, key, value)
        await self.session.flush()
        await self.session.refresh(manifest)
        return manifest

    async def delete_manifest(self, manifest: ContentManifest) -> None:
        await self.session.delete(manifest)
        await self.session.flush()

    async def deactivate_manifests_for_course_grade(self, institution_id: UUID, course_id: UUID, grade_id: UUID) -> int:
        stmt = (
            select(ContentManifest)
            .where(
                ContentManifest.institution_id == str(institution_id),
                ContentManifest.course_id == str(course_id),
                ContentManifest.grade_id == str(grade_id),
                ContentManifest.is_active == True,
            )
        )
        manifests = (await self.session.execute(stmt)).scalars().all()
        for manifest in manifests:
            manifest.is_active = False
        await self.session.flush()
        return len(manifests)