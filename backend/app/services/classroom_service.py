"""Institution-scoped classroom management."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import (
    AcademicYear,
    Classroom,
    Course,
    Enrollment,
    EnrollmentStatus,
    Grade,
    MonitorProfile,
    Section,
    StudentProfile,
    TeacherAssignment,
    User,
)
from app.schemas.academic import (
    ClassroomCreate,
    ClassroomDetail,
    ClassroomRead,
    ClassroomStudentRead,
    ClassroomUpdate,
    TeacherAssignmentSummary,
)
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import assigned_classroom_ids, has_permission


CLASSROOM_TRANSITIONS = {
    "active": {"inactive", "archived"},
    "inactive": {"active", "archived"},
    "archived": set(),
}


class ClassroomService:
    """Classroom CRUD and classroom-scoped student queries."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_model(
        self,
        institution_id: UUID,
        classroom_id: UUID,
        *,
        for_update: bool = False,
    ) -> Classroom:
        stmt = (
            select(Classroom)
            .where(
                Classroom.id == str(classroom_id),
                Classroom.institution_id == str(institution_id),
            )
            .options(selectinload(Classroom.grade), selectinload(Classroom.section))
        )
        if for_update:
            stmt = stmt.with_for_update()
        classroom = (await self.session.execute(stmt)).scalars().first()
        if not classroom:
            raise NotFoundError("Classroom not found")
        return classroom

    async def _assert_access(
        self,
        context: AuthorizationContext,
        classroom: Classroom,
    ) -> None:
        if has_permission(context, Permissions.CLASSROOMS_READ_INSTITUTION):
            return
        assigned = await assigned_classroom_ids(
            self.session,
            context.institution_id,
            context.user_id,
        )
        if str(classroom.id) not in assigned:
            raise ForbiddenError("Classroom is not assigned to this monitor")

    async def list_classrooms(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        academic_year_id: Optional[UUID],
        grade_id: Optional[UUID],
        section_id: Optional[UUID],
        status: Optional[str],
        search: Optional[str],
    ) -> Tuple[List[Classroom], int]:
        conditions = [Classroom.institution_id == str(context.institution_id)]
        if not has_permission(context, Permissions.CLASSROOMS_READ_INSTITUTION):
            assigned = await assigned_classroom_ids(
                self.session,
                context.institution_id,
                context.user_id,
            )
            if not assigned:
                return [], 0
            conditions.append(Classroom.id.in_(assigned))
        if academic_year_id:
            conditions.append(Classroom.academic_year_id == str(academic_year_id))
        if grade_id:
            conditions.append(Classroom.grade_id == str(grade_id))
        if section_id:
            conditions.append(Classroom.section_id == str(section_id))
        if status:
            conditions.append(Classroom.status == status)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(Classroom.code).like(pattern),
                    func.lower(Classroom.display_name).like(pattern),
                )
            )

        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Classroom).where(*conditions)
                )
            ).scalar_one()
        )
        stmt = (
            select(Classroom)
            .where(*conditions)
            .options(selectinload(Classroom.grade), selectinload(Classroom.section))
            .order_by(Classroom.code.asc(), Classroom.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_classroom(
        self,
        context: AuthorizationContext,
        classroom_id: UUID,
    ) -> Classroom:
        classroom = await self._get_model(context.institution_id, classroom_id)
        await self._assert_access(context, classroom)
        return classroom

    async def create_classroom(
        self,
        context: AuthorizationContext,
        data: ClassroomCreate,
    ) -> Classroom:
        year = await self._get_year(context, data.academic_year_id)
        if year.status in {"closed", "archived"}:
            raise ConflictError("Cannot create classrooms in a closed academic year")

        grade = (
            await self.session.execute(
                select(Grade).where(Grade.id == str(data.grade_id))
            )
        ).scalars().first()
        if not grade or grade.status != "active":
            raise NotFoundError("Grade not found or inactive")

        section: Optional[Section] = None
        if data.section_id:
            section = (
                await self.session.execute(
                    select(Section).where(Section.id == str(data.section_id))
                )
            ).scalars().first()
            if not section:
                raise NotFoundError("Section not found")
            if section.grade_id != str(data.grade_id):
                raise ValidationError("Section does not belong to the selected grade")
            if section.status != "active":
                raise ConflictError("Section is not active")

        duplicate_conditions = [
            Classroom.institution_id == str(context.institution_id),
            Classroom.academic_year_id == str(data.academic_year_id),
            Classroom.code == data.code.strip(),
        ]
        duplicate = (
            await self.session.execute(
                select(Classroom.id).where(*duplicate_conditions)
            )
        ).scalars().first()
        if duplicate:
            raise ConflictError("A classroom with this code already exists for the year")

        if data.section_id:
            section_duplicate = (
                await self.session.execute(
                    select(Classroom.id).where(
                        Classroom.institution_id == str(context.institution_id),
                        Classroom.academic_year_id == str(data.academic_year_id),
                        Classroom.grade_id == str(data.grade_id),
                        Classroom.section_id == str(data.section_id),
                    )
                )
            ).scalars().first()
            if section_duplicate:
                raise ConflictError("A classroom already exists for this grade and section")

        classroom = Classroom(
            institution_id=str(context.institution_id),
            academic_year_id=str(data.academic_year_id),
            grade_id=str(data.grade_id),
            section_id=str(data.section_id) if data.section_id else None,
            code=data.code.strip(),
            display_name=data.display_name.strip(),
            capacity=data.capacity,
            capacity_source=data.capacity_source,
            status=data.status,
            notes=data.notes,
        )
        self.session.add(classroom)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError("Classroom conflicts with an existing record") from exc
        return await self._get_model(context.institution_id, UUID(classroom.id))

    async def _get_year(
        self,
        context: AuthorizationContext,
        year_id: UUID,
    ) -> AcademicYear:
        year = (
            await self.session.execute(
                select(AcademicYear).where(
                    AcademicYear.id == str(year_id),
                    AcademicYear.institution_id == str(context.institution_id),
                )
            )
        ).scalars().first()
        if not year:
            raise NotFoundError("Academic year not found")
        return year

    async def update_classroom(
        self,
        context: AuthorizationContext,
        classroom_id: UUID,
        data: ClassroomUpdate,
    ) -> Classroom:
        classroom = await self._get_model(
            context.institution_id,
            classroom_id,
            for_update=True,
        )

        if data.status is not None:
            if data.status != classroom.status:
                if data.status not in CLASSROOM_TRANSITIONS.get(classroom.status, set()):
                    raise ConflictError(
                        f"Invalid classroom status transition: {classroom.status} -> {data.status}"
                    )
            if data.status == "archived":
                await self._ensure_classroom_can_archive(context, classroom)

        if data.capacity is not None and classroom.capacity is not None:
            if data.capacity < await self._active_enrollment_count(classroom.id):
                raise ConflictError("Capacity cannot be lower than active enrollment count")

        if data.code is not None:
            duplicate = (
                await self.session.execute(
                    select(Classroom.id).where(
                        Classroom.institution_id == str(context.institution_id),
                        Classroom.academic_year_id == classroom.academic_year_id,
                        Classroom.code == data.code.strip(),
                        Classroom.id != str(classroom.id),
                    )
                )
            ).scalars().first()
            if duplicate:
                raise ConflictError("A classroom with this code already exists for the year")

        if data.code is not None:
            classroom.code = data.code.strip()
        if data.display_name is not None:
            classroom.display_name = data.display_name.strip()
        if data.capacity is not None:
            classroom.capacity = data.capacity
        if data.capacity_source is not None:
            classroom.capacity_source = data.capacity_source
        if data.notes is not None:
            classroom.notes = data.notes
        if data.status is not None:
            classroom.status = data.status

        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError("Classroom conflicts with an existing record") from exc
        return await self._get_model(context.institution_id, classroom_id)

    async def _ensure_classroom_can_archive(
        self,
        context: AuthorizationContext,
        classroom: Classroom,
    ) -> None:
        active_enrollments = await self._active_enrollment_count(classroom.id)
        if active_enrollments:
            raise ConflictError("Classroom has active enrollments and cannot be archived")
        assignments = int(
            (
                await self.session.execute(
                    select(func.count())
                    .select_from(TeacherAssignment)
                    .where(
                        TeacherAssignment.classroom_id == str(classroom.id),
                        TeacherAssignment.status == "active",
                    )
                )
            ).scalar_one()
        )
        if assignments:
            raise ConflictError("Classroom has active teacher assignments")

    async def _active_enrollment_count(self, classroom_id: str) -> int:
        return int(
            (
                await self.session.execute(
                    select(func.count())
                    .select_from(Enrollment)
                    .where(
                        Enrollment.classroom_id == str(classroom_id),
                        Enrollment.status.in_(
                            [EnrollmentStatus.PENDING, EnrollmentStatus.ACTIVE]
                        ),
                    )
                )
            ).scalar_one()
        )

    async def get_detail(
        self,
        context: AuthorizationContext,
        classroom_id: UUID,
    ) -> ClassroomDetail:
        classroom = await self.get_classroom(context, classroom_id)
        students = await self.list_students(context, classroom_id)
        assignments = await self._assignment_summaries(classroom)
        active_count = sum(
            1 for student in students if student.status == EnrollmentStatus.ACTIVE.value
        )
        return ClassroomDetail(
            id=UUID(classroom.id),
            institution_id=UUID(classroom.institution_id),
            academic_year_id=UUID(classroom.academic_year_id)
            if classroom.academic_year_id
            else None,
            grade_id=UUID(classroom.grade_id),
            section_id=UUID(classroom.section_id) if classroom.section_id else None,
            code=classroom.code,
            display_name=classroom.display_name,
            capacity=classroom.capacity,
            capacity_source=classroom.capacity_source,
            status=classroom.status,
            notes=classroom.notes,
            created_at=classroom.created_at,
            updated_at=classroom.updated_at,
            grade_name=classroom.grade.display_name if classroom.grade else "",
            section_name=classroom.section.name if classroom.section else None,
            active_enrollment_count=active_count,
            student_count=len(students),
            teacher_assignment_count=len(assignments),
            students=students,
            assignments=assignments,
        )

    async def list_students(
        self,
        context: AuthorizationContext,
        classroom_id: UUID,
    ) -> List[ClassroomStudentRead]:
        classroom = await self._get_model(context.institution_id, classroom_id)
        await self._assert_access(context, classroom)
        stmt = (
            select(Enrollment, StudentProfile, User)
            .join(StudentProfile, Enrollment.student_id == StudentProfile.id)
            .join(User, StudentProfile.user_id == User.id)
            .where(
                Enrollment.classroom_id == str(classroom.id),
                Enrollment.institution_id == str(context.institution_id),
                Enrollment.status.in_(
                    [
                        EnrollmentStatus.PENDING,
                        EnrollmentStatus.ACTIVE,
                        EnrollmentStatus.SUSPENDED,
                    ]
                ),
            )
            .order_by(User.display_name.asc(), Enrollment.id.asc())
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            ClassroomStudentRead(
                enrollment_id=UUID(enrollment.id),
                student_id=UUID(student.id),
                user_id=UUID(user.id),
                student_code=student.student_code,
                display_name=user.display_name,
                status=enrollment.status.value,
                enrolled_at=enrollment.enrolled_at,
            )
            for enrollment, student, user in rows
        ]

    async def _assignment_summaries(
        self,
        classroom: Classroom,
    ) -> List[TeacherAssignmentSummary]:
        stmt = (
            select(TeacherAssignment, MonitorProfile, User, Course)
            .join(MonitorProfile, TeacherAssignment.monitor_id == MonitorProfile.id)
            .join(User, MonitorProfile.user_id == User.id)
            .join(Course, TeacherAssignment.course_id == Course.id)
            .where(
                TeacherAssignment.classroom_id == str(classroom.id),
                TeacherAssignment.status.in_(["planned", "active"]),
            )
            .order_by(User.display_name.asc())
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            TeacherAssignmentSummary(
                id=UUID(assignment.id),
                monitor_id=UUID(assignment.monitor_id),
                monitor_display_name=user.display_name,
                course_id=UUID(assignment.course_id),
                course_name=course.name,
                responsibility=assignment.responsibility.value,
                status=assignment.status,
            )
            for assignment, _monitor, user, course in rows
        ]

    async def monitor_classrooms(
        self,
        context: AuthorizationContext,
    ) -> List[Classroom]:
        assigned = await assigned_classroom_ids(
            self.session,
            context.institution_id,
            context.user_id,
        )
        if not assigned:
            return []
        stmt = (
            select(Classroom)
            .where(
                Classroom.institution_id == str(context.institution_id),
                Classroom.id.in_(assigned),
                Classroom.status == "active",
            )
            .options(selectinload(Classroom.grade), selectinload(Classroom.section))
            .order_by(Classroom.code.asc())
        )
        return list((await self.session.execute(stmt)).scalars().all())
