"""Subject repository."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Subject
from app.core.exceptions import NotFoundError


class SubjectRepository:
    """Repository for subject operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_subjects(
        self,
        *,
        page: int,
        page_size: int,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> tuple[List[Subject], int]:
        conditions = []
        if status:
            conditions.append(Subject.status == status)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(Subject.code).like(pattern),
                    func.lower(Subject.name).like(pattern),
                    func.lower(Subject.description).like(pattern),
                )
            )

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Subject).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(Subject)
            .where(*conditions)
            .order_by(Subject.sequence.asc(), Subject.name.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_subject(self, subject_id: UUID) -> Subject:
        stmt = select(Subject).where(Subject.id == str(subject_id))
        subject = (await self.session.execute(stmt)).scalars().first()
        if not subject:
            raise NotFoundError("Subject not found")
        return subject

    async def get_subject_by_code(self, code: str) -> Optional[Subject]:
        stmt = select(Subject).where(Subject.code == code)
        return (await self.session.execute(stmt)).scalars().first()

    async def create_subject(self, data: dict) -> Subject:
        subject = Subject(**data)
        self.session.add(subject)
        await self.session.flush()
        await self.session.refresh(subject)
        return subject

    async def update_subject(self, subject: Subject, data: dict) -> Subject:
        for key, value in data.items():
            if value is not None:
                setattr(subject, key, value)
        await self.session.flush()
        await self.session.refresh(subject)
        return subject

    async def delete_subject(self, subject: Subject) -> None:
        await self.session.delete(subject)
        await self.session.flush()

    async def get_active_subjects(self) -> List[Subject]:
        stmt = select(Subject).where(Subject.status == "active").order_by(Subject.sequence.asc())
        return list((await self.session.execute(stmt)).scalars().all())