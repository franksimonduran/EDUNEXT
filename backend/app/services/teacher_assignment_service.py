"""Teacher assignment services with institution and monitor scoping."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import (
    AcademicPeriod,
    Classroom,
    Course,
    MonitorProfile,
    TeacherAssignment,
    User,
    UserStatus,
)
from app.schemas.academic import (
    TeacherAssignmentCreate,
    TeacherAssignmentRead,
    TeacherAssignmentUpdate,
)
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


ASSIGNMENT_TRANSITIONS = {
    "planned": {"active", "cancelled"},
    "active": {"completed", "revoked"},
    "completed": set(),
    "revoked": set(),
    "cancelled": set(),
}


class TeacherAssignmentService:
    """Create and revoke assignments without losing historical records."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def _base_select(self):
        return (
            select(TeacherAssignment, MonitorProfile, User, Classroom, Course, AcademicPeriod)
            .join(MonitorProfile, TeacherAssignment.monitor_id == MonitorProfile.id)
            .join(User, MonitorProfile.user_id == User.id)
            .join(Classroom, TeacherAssignment.classroom_id == Classroom.id)
            .join(Course, TeacherAssignment.course_id == Course.id)
            .outerjoin(AcademicPeriod, TeacherAssignment.period_id == AcademicPeriod.id)
        )

    def _serialize(self, row) -> TeacherAssignmentRead:
        assignment, _monitor, monitor_user, classroom, course, period = row
        responsibility = assignment.responsibility
        if hasattr(responsibility, "value"):
            responsibility = responsibility.value
        return TeacherAssignmentRead(
            id=UUID(assignment.id),
            monitor_id=UUID(assignment.monitor_id),
            institution_id=UUID(assignment.institution_id),
            classroom_id=UUID(assignment.classroom_id),
            course_id=UUID(assignment.course_id),
            period_id=UUID(assignment.period_id) if assignment.period_id else None,
            responsibility=responsibility,
            status=assignment.status,
            start_date=assignment.start_date,
            end_date=assignment.end_date,
            notes=assignment.notes,
            monitor_display_name=monitor_user.display_name,
            classroom_code=classroom.code,
            classroom_name=classroom.display_name,
            course_name=course.name,
            period_name=period.name if period else None,
            created_at=assignment.created_at,
            updated_at=assignment.updated_at,
        )

    async def _scope_conditions(self, context: AuthorizationContext) -> list:
        conditions = [TeacherAssignment.institution_id == str(context.institution_id)]
        if has_permission(context, Permissions.TEACHER_ASSIGNMENTS_READ_INSTITUTION):
            return conditions
        conditions.append(MonitorProfile.user_id == str(context.user_id))
        return conditions

    async def list_assignments(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        monitor_id: Optional[UUID],
        classroom_id: Optional[UUID],
        course_id: Optional[UUID],
        period_id: Optional[UUID],
        academic_year_id: Optional[UUID],
        status: Optional[str],
        search: Optional[str],
    ) -> Tuple[List[TeacherAssignmentRead], int]:
        conditions = await self._scope_conditions(context)
        if monitor_id:
            conditions.append(TeacherAssignment.monitor_id == str(monitor_id))
        if classroom_id:
            conditions.append(TeacherAssignment.classroom_id == str(classroom_id))
        if course_id:
            conditions.append(TeacherAssignment.course_id == str(course_id))
        if period_id:
            conditions.append(TeacherAssignment.period_id == str(period_id))
        if academic_year_id:
            conditions.append(Classroom.academic_year_id == str(academic_year_id))
        if status:
            conditions.append(TeacherAssignment.status == status)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(User.display_name).like(pattern),
                    func.lower(Classroom.code).like(pattern),
                    func.lower(Course.name).like(pattern),
                )
            )

        count_stmt = (
            select(func.count())
            .select_from(TeacherAssignment)
            .join(MonitorProfile, TeacherAssignment.monitor_id == MonitorProfile.id)
            .join(User, MonitorProfile.user_id == User.id)
            .join(Classroom, TeacherAssignment.classroom_id == Classroom.id)
            .join(Course, TeacherAssignment.course_id == Course.id)
            .where(*conditions)
        )
        total = int((await self.session.execute(count_stmt)).scalar_one())

        stmt = (
            (await self._base_select())
            .where(*conditions)
            .order_by(TeacherAssignment.created_at.desc(), TeacherAssignment.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = (await self.session.execute(stmt)).all()
        return [self._serialize(row) for row in rows], total

    async def _get_row(
        self,
        context: AuthorizationContext,
        assignment_id: UUID,
        *,
        for_update: bool = False,
    ):
        if for_update:
            locked = (
                await self.session.execute(
                    select(TeacherAssignment.id)
                    .where(
                        TeacherAssignment.id == str(assignment_id),
                        TeacherAssignment.institution_id == str(context.institution_id),
                    )
                    .with_for_update()
                )
            ).scalars().first()
            if not locked:
                raise NotFoundError("Teacher assignment not found")

        conditions = await self._scope_conditions(context)
        conditions.append(TeacherAssignment.id == str(assignment_id))
        row = (
            await self.session.execute((await self._base_select()).where(*conditions))
        ).first()
        if not row:
            raise NotFoundError("Teacher assignment not found")
        return row

    async def get_assignment(
        self,
        context: AuthorizationContext,
        assignment_id: UUID,
    ) -> TeacherAssignmentRead:
        return self._serialize(await self._get_row(context, assignment_id))

    async def create_assignment(
        self,
        context: AuthorizationContext,
        data: TeacherAssignmentCreate,
    ) -> TeacherAssignmentRead:
        if not has_permission(context, Permissions.TEACHER_ASSIGNMENTS_MANAGE_INSTITUTION):
            raise ForbiddenError("Teacher assignment management permission required")

        monitor = await self._get_monitor(context, data.monitor_id)
        classroom = await self._get_classroom(context, data.classroom_id)
        course = await self._get_course(context, data.course_id)
        period = await self._get_period_for_classroom(classroom, data.period_id)

        if course.institution_id != str(context.institution_id):
            raise ValidationError("Course belongs to another institution")
        if course.grade_id != classroom.grade_id:
            raise ConflictError("Course grade does not match the classroom grade")
        if course.status != "active":
            raise ConflictError("Course is not active")

        if data.start_date and data.end_date and data.end_date <= data.start_date:
            raise ValidationError("end_date must be after start_date")
        if data.status == "active":
            await self._ensure_no_active_duplicate(
                context.institution_id,
                monitor.id,
                classroom.id,
                course.id,
                period.id if period else None,
                exclude_id=None,
            )

        assignment = TeacherAssignment(
            monitor_id=str(monitor.id),
            institution_id=str(context.institution_id),
            classroom_id=str(classroom.id),
            course_id=str(course.id),
            period_id=str(period.id) if period else None,
            responsibility=data.responsibility,
            status=data.status,
            start_date=data.start_date,
            end_date=data.end_date,
            notes=data.notes,
        )
        self.session.add(assignment)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError("This teacher assignment already exists") from exc
        return self._serialize(await self._get_row(context, UUID(assignment.id)))

    async def update_assignment(
        self,
        context: AuthorizationContext,
        assignment_id: UUID,
        data: TeacherAssignmentUpdate,
    ) -> TeacherAssignmentRead:
        if not has_permission(context, Permissions.TEACHER_ASSIGNMENTS_MANAGE_INSTITUTION):
            raise ForbiddenError("Teacher assignment management permission required")

        row = await self._get_row(context, assignment_id, for_update=True)
        assignment = row[0]
        if data.status is not None and data.status != assignment.status:
            if data.status not in ASSIGNMENT_TRANSITIONS.get(assignment.status, set()):
                raise ConflictError(
                    f"Invalid assignment status transition: {assignment.status} -> {data.status}"
                )
        if data.status == "active":
            await self._ensure_no_active_duplicate(
                context.institution_id,
                assignment.monitor_id,
                assignment.classroom_id,
                assignment.course_id,
                assignment.period_id,
                exclude_id=assignment.id,
            )

        new_start = data.start_date or assignment.start_date
        new_end = data.end_date or assignment.end_date
        if new_start and new_end and new_end <= new_start:
            raise ValidationError("end_date must be after start_date")

        if data.responsibility is not None:
            assignment.responsibility = data.responsibility
        if data.status is not None:
            assignment.status = data.status
        if data.start_date is not None:
            assignment.start_date = data.start_date
        if data.end_date is not None:
            assignment.end_date = data.end_date
        if data.notes is not None:
            assignment.notes = data.notes

        await self.session.flush()
        return self._serialize(await self._get_row(context, assignment_id))

    async def revoke_assignment(
        self,
        context: AuthorizationContext,
        assignment_id: UUID,
    ) -> TeacherAssignmentRead:
        if not has_permission(context, Permissions.TEACHER_ASSIGNMENTS_MANAGE_INSTITUTION):
            raise ForbiddenError("Teacher assignment management permission required")
        return await self.update_assignment(
            context,
            assignment_id,
            TeacherAssignmentUpdate(status="revoked"),
        )

    async def _get_monitor(
        self,
        context: AuthorizationContext,
        monitor_id: UUID,
    ) -> MonitorProfile:
        monitor = (
            await self.session.execute(
                select(MonitorProfile)
                .join(User, MonitorProfile.user_id == User.id)
                .where(
                    MonitorProfile.id == str(monitor_id),
                    User.institution_id == str(context.institution_id),
                    User.status == UserStatus.ACTIVE,
                )
            )
        ).scalars().first()
        if not monitor:
            raise NotFoundError("Monitor not found")
        return monitor

    async def _get_classroom(
        self,
        context: AuthorizationContext,
        classroom_id: UUID,
    ) -> Classroom:
        classroom = (
            await self.session.execute(
                select(Classroom).where(
                    Classroom.id == str(classroom_id),
                    Classroom.institution_id == str(context.institution_id),
                )
            )
        ).scalars().first()
        if not classroom:
            raise NotFoundError("Classroom not found")
        if classroom.status != "active":
            raise ConflictError("Classroom is not active")
        return classroom

    async def _get_course(
        self,
        context: AuthorizationContext,
        course_id: UUID,
    ) -> Course:
        course = (
            await self.session.execute(
                select(Course).where(
                    Course.id == str(course_id),
                    Course.institution_id == str(context.institution_id),
                )
            )
        ).scalars().first()
        if not course:
            raise NotFoundError("Course not found")
        return course

    async def _get_period_for_classroom(
        self,
        classroom: Classroom,
        period_id: Optional[UUID],
    ) -> Optional[AcademicPeriod]:
        if not period_id:
            return None
        period = (
            await self.session.execute(
                select(AcademicPeriod).where(AcademicPeriod.id == str(period_id))
            )
        ).scalars().first()
        if not period:
            raise NotFoundError("Academic period not found")
        if not classroom.academic_year_id or period.academic_year_id != str(
            classroom.academic_year_id
        ):
            raise ValidationError("Period does not belong to the classroom academic year")
        if period.status == "archived":
            raise ConflictError("Academic period is archived")
        return period

    async def _ensure_no_active_duplicate(
        self,
        institution_id: UUID,
        monitor_id: str,
        classroom_id: str,
        course_id: str,
        period_id: Optional[str],
        *,
        exclude_id: Optional[str],
    ) -> None:
        conditions = [
            TeacherAssignment.institution_id == str(institution_id),
            TeacherAssignment.monitor_id == str(monitor_id),
            TeacherAssignment.classroom_id == str(classroom_id),
            TeacherAssignment.course_id == str(course_id),
            TeacherAssignment.status.in_(["planned", "active"]),
        ]
        if period_id:
            conditions.append(TeacherAssignment.period_id == str(period_id))
        else:
            conditions.append(TeacherAssignment.period_id.is_(None))
        if exclude_id:
            conditions.append(TeacherAssignment.id != str(exclude_id))

        duplicate = (
            await self.session.execute(select(TeacherAssignment.id).where(*conditions))
        ).scalars().first()
        if duplicate:
            raise ConflictError("This teacher assignment is already active")
