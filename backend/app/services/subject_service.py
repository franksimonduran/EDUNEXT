"""Subject service."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.db.models import Subject
from app.repositories import SubjectRepository
from app.schemas.content import SubjectCreate, SubjectUpdate
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class SubjectService:
    """Subject management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = SubjectRepository(session)

    async def list_subjects(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Subject], int]:
        if not has_permission(context, Permissions.COURSES_READ):
            from app.core.exceptions import ForbiddenError
            raise ForbiddenError("Insufficient permissions to read subjects")
        return await self.repository.list_subjects(
            page=page,
            page_size=page_size,
            status=status,
            search=search,
        )

    async def get_subject(self, context: AuthorizationContext, subject_id: UUID) -> Subject:
        if not has_permission(context, Permissions.COURSES_READ):
            from app.core.exceptions import ForbiddenError
            raise ForbiddenError("Insufficient permissions to read subjects")
        return await self.repository.get_subject(subject_id)

    async def create_subject(
        self,
        context: AuthorizationContext,
        data: SubjectCreate,
    ) -> Subject:
        if not has_permission(context, Permissions.COURSES_CREATE):
            from app.core.exceptions import ForbiddenError
            raise ForbiddenError("Insufficient permissions to create subjects")

        existing = await self.repository.get_subject_by_code(data.code)
        if existing:
            raise ConflictError("A subject with this code already exists")

        subject_data = data.model_dump()
        subject = await self.repository.create_subject(subject_data)
        await self.session.commit()
        return subject

    async def update_subject(
        self,
        context: AuthorizationContext,
        subject_id: UUID,
        data: SubjectUpdate,
    ) -> Subject:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            from app.core.exceptions import ForbiddenError
            raise ForbiddenError("Insufficient permissions to update subjects")

        subject = await self.repository.get_subject(subject_id)
        update_data = data.model_dump(exclude_unset=True)

        if "code" in update_data and update_data["code"] != subject.code:
            existing = await self.repository.get_subject_by_code(update_data["code"])
            if existing:
                raise ConflictError("A subject with this code already exists")

        subject = await self.repository.update_subject(subject, update_data)
        await self.session.commit()
        return subject

    async def delete_subject(self, context: AuthorizationContext, subject_id: UUID) -> None:
        if not has_permission(context, Permissions.COURSES_DELETE):
            from app.core.exceptions import ForbiddenError
            raise ForbiddenError("Insufficient permissions to delete subjects")

        subject = await self.repository.get_subject(subject_id)
        await self.repository.delete_subject(subject)
        await self.session.commit()

    async def get_active_subjects(self, context: AuthorizationContext) -> List[Subject]:
        if not has_permission(context, Permissions.COURSES_READ):
            from app.core.exceptions import ForbiddenError
            raise ForbiddenError("Insufficient permissions to read subjects")
        return await self.repository.get_active_subjects()