"""Course repository."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Course, Unit, Lesson
from app.core.exceptions import NotFoundError


class CourseRepository:
    """Repository for course operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_courses(
        self,
        *,
        institution_id: UUID,
        page: int,
        page_size: int,
        grade_id: Optional[UUID] = None,
        subject_id: Optional[UUID] = None,
        status: Optional[str] = None,
        visibility: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Course], int]:
        conditions = [Course.institution_id == str(institution_id)]
        if grade_id:
            conditions.append(Course.grade_id == str(grade_id))
        if subject_id:
            conditions.append(Course.subject_id == str(subject_id))
        if status:
            conditions.append(Course.status == status)
        if visibility:
            conditions.append(Course.visibility == visibility)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(Course.code).like(pattern),
                    func.lower(Course.name).like(pattern),
                    func.lower(Course.description).like(pattern),
                )
            )

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Course).where(*conditions)
                )
            ).scalar_one()
        )

        stmt = (
            select(Course)
            .where(*conditions)
            .options(selectinload(Course.subject), selectinload(Course.grade))
            .order_by(Course.sequence.asc(), Course.name.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_course(self, institution_id: UUID, course_id: UUID) -> Course:
        stmt = (
            select(Course)
            .where(
                Course.id == str(course_id),
                Course.institution_id == str(institution_id),
            )
            .options(selectinload(Course.subject), selectinload(Course.grade))
        )
        course = (await self.session.execute(stmt)).scalars().first()
        if not course:
            raise NotFoundError("Course not found")
        return course

    async def get_course_by_code(self, institution_id: UUID, grade_id: UUID, code: str) -> Optional[Course]:
        stmt = select(Course).where(
            Course.institution_id == str(institution_id),
            Course.grade_id == str(grade_id),
            Course.code == code,
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def create_course(self, data: dict) -> Course:
        course = Course(**data)
        self.session.add(course)
        await self.session.flush()
        await self.session.refresh(course)
        return course

    async def update_course(self, course: Course, data: dict) -> Course:
        for key, value in data.items():
            if value is not None:
                setattr(course, key, value)
        await self.session.flush()
        await self.session.refresh(course)
        return course

    async def delete_course(self, course: Course) -> None:
        await self.session.delete(course)
        await self.session.flush()

    async def get_course_stats(self, course_id: UUID) -> dict:
        unit_count = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Unit).where(Unit.course_id == str(course_id))
                )
            ).scalar_one()
        )
        lesson_count = int(
            (
                await self.session.execute(
                    select(func.count())
                    .select_from(Lesson)
                    .join(Unit, Lesson.unit_id == Unit.id)
                    .where(Unit.course_id == str(course_id))
                )
            ).scalar_one()
        )
        return {"unit_count": unit_count, "lesson_count": lesson_count}

    async def list_courses_for_monitor(
        self,
        institution_id: UUID,
        monitor_user_id: UUID,
        *,
        page: int,
        page_size: int,
        grade_id: Optional[UUID] = None,
        subject_id: Optional[UUID] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Course], int]:
        """List courses where the monitor has an assignment."""
        from app.db.models import TeacherAssignment
        
        assigned_course_ids = (
            await self.session.execute(
                select(TeacherAssignment.course_id)
                .where(
                    TeacherAssignment.institution_id == str(institution_id),
                    TeacherAssignment.monitor_id == str(monitor_user_id),
                    TeacherAssignment.status.in_(["planned", "active"]),
                )
            )
        ).scalars().all()
        
        if not assigned_course_ids:
            return [], 0
            
        conditions = [Course.id.in_(assigned_course_ids)]
        if grade_id:
            conditions.append(Course.grade_id == str(grade_id))
        if subject_id:
            conditions.append(Course.subject_id == str(subject_id))
        if status:
            conditions.append(Course.status == status)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(Course.code).like(pattern),
                    func.lower(Course.name).like(pattern),
                )
            )
        
        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Course).where(*conditions)
                )
            ).scalar_one()
        )
        
        stmt = (
            select(Course)
            .where(*conditions)
            .options(selectinload(Course.subject), selectinload(Course.grade))
            .order_by(Course.sequence.asc(), Course.name.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total