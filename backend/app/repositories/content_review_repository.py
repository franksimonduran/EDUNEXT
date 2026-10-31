"""Content review repository."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import ContentReview, ContentVersion, User
from app.core.exceptions import NotFoundError


class ContentReviewRepository:
    """Repository for content review operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_reviews(
        self,
        *,
        institution_id: UUID,
        page: int,
        page_size: int,
        content_version_id: Optional[UUID] = None,
        reviewer_user_id: Optional[UUID] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[ContentReview], int]:
        conditions = [ContentReview.institution_id == str(institution_id)]
        if content_version_id:
            conditions.append(ContentReview.content_version_id == str(content_version_id))
        if reviewer_user_id:
            conditions.append(ContentReview.reviewer_user_id == str(reviewer_user_id))
        if status:
            conditions.append(ContentReview.status == status)

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(ContentReview).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(ContentReview)
            .where(*conditions)
            .options(
                selectinload(ContentReview.content_version),
                selectinload(ContentReview.reviewer),
            )
            .order_by(ContentReview.submitted_at.desc(), ContentReview.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_review(self, institution_id: UUID, review_id: UUID) -> ContentReview:
        stmt = (
            select(ContentReview)
            .where(
                ContentReview.id == str(review_id),
                ContentReview.institution_id == str(institution_id),
            )
            .options(
                selectinload(ContentReview.content_version),
                selectinload(ContentReview.reviewer),
            )
        )
        review = (await self.session.execute(stmt)).scalars().first()
        if not review:
            raise NotFoundError("Content review not found")
        return review

    async def get_review_for_version(self, content_version_id: UUID) -> Optional[ContentReview]:
        stmt = (
            select(ContentReview)
            .where(ContentReview.content_version_id == str(content_version_id))
            .order_by(ContentReview.submitted_at.desc())
            .limit(1)
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def get_pending_reviews_for_reviewer(self, institution_id: UUID, reviewer_user_id: UUID) -> List[ContentReview]:
        stmt = (
            select(ContentReview)
            .where(
                ContentReview.institution_id == str(institution_id),
                ContentReview.status.in_(["pending", "in_review"]),
            )
            .options(selectinload(ContentReview.content_version))
            .order_by(ContentReview.submitted_at.asc())
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def create_review(self, data: dict) -> ContentReview:
        review = ContentReview(**data)
        self.session.add(review)
        await self.session.flush()
        await self.session.refresh(review)
        return review

    async def update_review(self, review: ContentReview, data: dict) -> ContentReview:
        for key, value in data.items():
            if value is not None:
                setattr(review, key, value)
        await self.session.flush()
        await self.session.refresh(review)
        return review

    async def delete_review(self, review: ContentReview) -> None:
        await self.session.delete(review)
        await self.session.flush()