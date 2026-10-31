"""Transactional enrollment lifecycle management."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import (
    AcademicMovement,
    AcademicMovementType,
    AcademicPeriod,
    AcademicYear,
    Classroom,
    Enrollment,
    EnrollmentStatus,
    Grade,
    Section,
    StudentProfile,
    User,
    UserStatus,
)
from app.schemas.academic import (
    AcademicMovementRead,
    EnrollmentCompleteRequest,
    EnrollmentCreate,
    EnrollmentDetail,
    EnrollmentRead,
    EnrollmentTransferRequest,
    EnrollmentUpdate,
    EnrollmentWithdrawRequest,
)
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import (
    assigned_classroom_ids,
    find_idempotent_result,
    has_permission,
    now_utc,
    record_idempotency,
)


ACTIVE_ENROLLMENT_STATUSES = [EnrollmentStatus.PENDING, EnrollmentStatus.ACTIVE]


class EnrollmentService:
    """Enrollment creation, transfer, withdrawal, and history."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def _scope_conditions(self, context: AuthorizationContext) -> list:
        conditions = [Enrollment.institution_id == str(context.institution_id)]
        if has_permission(context, Permissions.ENROLLMENTS_READ_INSTITUTION):
            return conditions
        if has_permission(context, Permissions.ENROLLMENTS_READ_ASSIGNED):
            assigned = await assigned_classroom_ids(
                self.session,
                context.institution_id,
                context.user_id,
            )
            if not assigned:
                return [Enrollment.id == "__none__"]
            conditions.append(Enrollment.classroom_id.in_(assigned))
            return conditions
        conditions.append(StudentProfile.user_id == str(context.user_id))
        return conditions

    async def _base_select(self):
        return (
            select(Enrollment, StudentProfile, User, Classroom, Grade, Section)
            .join(StudentProfile, Enrollment.student_id == StudentProfile.id)
            .join(User, StudentProfile.user_id == User.id)
            .join(Classroom, Enrollment.classroom_id == Classroom.id)
            .join(Grade, Classroom.grade_id == Grade.id)
            .outerjoin(Section, Classroom.section_id == Section.id)
        )

    def _serialize(self, row) -> EnrollmentRead:
        enrollment, student, user, classroom, grade, section = row
        return EnrollmentRead(
            id=UUID(enrollment.id),
            student_id=UUID(enrollment.student_id),
            institution_id=UUID(enrollment.institution_id),
            classroom_id=UUID(enrollment.classroom_id),
            academic_year_id=UUID(enrollment.academic_year_id),
            period_id=UUID(enrollment.period_id) if enrollment.period_id else None,
            status=enrollment.status.value,
            enrolled_at=enrollment.enrolled_at,
            effective_date=enrollment.effective_date,
            ended_at=enrollment.ended_at,
            status_reason=enrollment.status_reason,
            student_code=student.student_code,
            student_display_name=user.display_name,
            classroom_code=classroom.code,
            classroom_name=classroom.display_name,
            grade_name=grade.display_name,
            section_name=section.name if section else None,
            created_at=enrollment.created_at,
            updated_at=enrollment.updated_at,
        )

    async def list_enrollments(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        academic_year_id: Optional[UUID],
        classroom_id: Optional[UUID],
        grade_id: Optional[UUID],
        period_id: Optional[UUID],
        student_id: Optional[UUID],
        status: Optional[str],
        search: Optional[str],
    ) -> Tuple[List[EnrollmentRead], int]:
        conditions = await self._scope_conditions(context)
        if academic_year_id:
            conditions.append(Enrollment.academic_year_id == str(academic_year_id))
        if classroom_id:
            conditions.append(Enrollment.classroom_id == str(classroom_id))
        if grade_id:
            conditions.append(Classroom.grade_id == str(grade_id))
        if period_id:
            conditions.append(Enrollment.period_id == str(period_id))
        if student_id:
            conditions.append(Enrollment.student_id == str(student_id))
        if status:
            try:
                status_value = EnrollmentStatus(status)
            except ValueError as exc:
                raise ValidationError("Invalid enrollment status") from exc
            conditions.append(Enrollment.status == status_value)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(User.display_name).like(pattern),
                    func.lower(StudentProfile.student_code).like(pattern),
                    func.lower(Classroom.code).like(pattern),
                    func.lower(Classroom.display_name).like(pattern),
                )
            )

        count_stmt = (
            select(func.count())
            .select_from(Enrollment)
            .join(StudentProfile, Enrollment.student_id == StudentProfile.id)
            .join(User, StudentProfile.user_id == User.id)
            .join(Classroom, Enrollment.classroom_id == Classroom.id)
            .where(*conditions)
        )
        total = int((await self.session.execute(count_stmt)).scalar_one())

        stmt = (
            (await self._base_select())
            .where(*conditions)
            .order_by(Enrollment.created_at.desc(), Enrollment.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = (await self.session.execute(stmt)).all()
        return [self._serialize(row) for row in rows], total

    async def _get_row(
        self,
        context: AuthorizationContext,
        enrollment_id: UUID,
        *,
        for_update: bool = False,
    ):
        if for_update:
            locked = (
                await self.session.execute(
                    select(Enrollment.id)
                    .where(
                        Enrollment.id == str(enrollment_id),
                        Enrollment.institution_id == str(context.institution_id),
                    )
                    .with_for_update()
                )
            ).scalars().first()
            if not locked:
                raise NotFoundError("Enrollment not found")

        conditions = await self._scope_conditions(context)
        conditions.append(Enrollment.id == str(enrollment_id))
        stmt = (await self._base_select()).where(*conditions)
        row = (await self.session.execute(stmt)).first()
        if not row:
            raise NotFoundError("Enrollment not found")
        return row

    async def get_enrollment(
        self,
        context: AuthorizationContext,
        enrollment_id: UUID,
    ) -> EnrollmentDetail:
        row = await self._get_row(context, enrollment_id)
        enrollment = row[0]
        movements = await self._movements_for(enrollment.id)
        payload = self._serialize(row).model_dump()
        return EnrollmentDetail(**payload, movements=movements)

    async def create_enrollment(
        self,
        context: AuthorizationContext,
        data: EnrollmentCreate,
        *,
        idempotency_key: Optional[str],
    ) -> EnrollmentRead:
        if not has_permission(context, Permissions.ENROLLMENTS_CREATE_INSTITUTION):
            raise ForbiddenError("Enrollment creation permission required")

        request_payload = data.model_dump(mode="json")
        existing_id = await find_idempotent_result(
            self.session,
            context,
            operation="enrollment.create",
            key=idempotency_key,
            payload=request_payload,
        )
        if existing_id:
            return self._serialize(await self._get_row(context, existing_id))

        classroom = await self._get_classroom_for_update(
            context.institution_id,
            data.classroom_id,
        )
        if classroom.status != "active":
            raise ConflictError("Classroom is not active")
        if not classroom.academic_year_id:
            raise ConflictError("Classroom has no academic year")

        year = await self._get_year(context.institution_id, classroom.academic_year_id)
        if year.status in {"closed", "archived", "draft"}:
            raise ConflictError("Academic year is not open for enrollment")

        student = await self._get_student(context.institution_id, data.student_id)
        period = await self._get_period_for_year(
            classroom.academic_year_id,
            data.period_id,
        )

        duplicate = (
            await self.session.execute(
                select(Enrollment.id).where(
                    Enrollment.student_id == str(student.id),
                    Enrollment.institution_id == str(context.institution_id),
                    Enrollment.academic_year_id == str(classroom.academic_year_id),
                    Enrollment.status.in_(ACTIVE_ENROLLMENT_STATUSES),
                )
            )
        ).scalars().first()
        if duplicate:
            raise ConflictError("Student already has an active enrollment in this academic year")

        await self._ensure_capacity(classroom)

        enrollment = Enrollment(
            student_id=str(student.id),
            institution_id=str(context.institution_id),
            classroom_id=str(classroom.id),
            academic_year_id=str(classroom.academic_year_id),
            period_id=str(period.id) if period else None,
            status=EnrollmentStatus(data.status),
            effective_date=data.effective_date or now_utc(),
        )
        self.session.add(enrollment)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError(
                "Student already has an active enrollment in this academic year"
            ) from exc

        self.session.add(
            AcademicMovement(
                institution_id=str(context.institution_id),
                student_id=str(student.id),
                movement_type=AcademicMovementType.ENROLLMENT,
                destination_enrollment_id=str(enrollment.id),
                destination_classroom_id=str(classroom.id),
                effective_date=enrollment.effective_date or now_utc(),
                reason_code="enrollment_created",
                authorized_by_user_id=str(context.user_id),
            )
        )
        await record_idempotency(
            self.session,
            context,
            operation="enrollment.create",
            key=idempotency_key,
            payload=request_payload,
            resource_type="enrollment",
            resource_id=UUID(enrollment.id),
        )
        await self.session.flush()
        return self._serialize(await self._get_row(context, UUID(enrollment.id)))

    async def update_enrollment(
        self,
        context: AuthorizationContext,
        enrollment_id: UUID,
        data: EnrollmentUpdate,
    ) -> EnrollmentRead:
        if not has_permission(context, Permissions.ENROLLMENTS_MANAGE_INSTITUTION):
            raise ForbiddenError("Enrollment management permission required")

        row = await self._get_row(context, enrollment_id, for_update=True)
        enrollment = row[0]
        if enrollment.status not in ACTIVE_ENROLLMENT_STATUSES:
            raise ConflictError("Only pending or active enrollments can be updated")

        if data.period_id is not None:
            period = await self._get_period_for_year(
                enrollment.academic_year_id,
                data.period_id,
            )
            enrollment.period_id = str(period.id) if period else None
        if data.effective_date is not None:
            enrollment.effective_date = data.effective_date

        await self.session.flush()
        return self._serialize(await self._get_row(context, enrollment_id))

    async def withdraw_enrollment(
        self,
        context: AuthorizationContext,
        enrollment_id: UUID,
        data: EnrollmentWithdrawRequest,
    ) -> EnrollmentRead:
        if not has_permission(context, Permissions.ENROLLMENTS_MANAGE_INSTITUTION):
            raise ForbiddenError("Enrollment management permission required")

        row = await self._get_row(context, enrollment_id, for_update=True)
        enrollment = row[0]
        if enrollment.status not in ACTIVE_ENROLLMENT_STATUSES:
            raise ConflictError("Only pending or active enrollments can be withdrawn")

        effective_date = data.effective_date or now_utc()
        enrollment.status = EnrollmentStatus.WITHDRAWN
        enrollment.ended_at = effective_date
        enrollment.effective_date = enrollment.effective_date or effective_date
        enrollment.status_reason = self._reason(data.reason_code, data.notes)

        self.session.add(
            AcademicMovement(
                institution_id=str(context.institution_id),
                student_id=str(enrollment.student_id),
                movement_type=AcademicMovementType.WITHDRAWAL,
                source_enrollment_id=str(enrollment.id),
                source_classroom_id=str(enrollment.classroom_id),
                effective_date=effective_date,
                reason_code=data.reason_code,
                notes=data.notes,
                authorized_by_user_id=str(context.user_id),
            )
        )
        await self.session.flush()
        return self._serialize(await self._get_row(context, enrollment_id))

    async def complete_enrollment(
        self,
        context: AuthorizationContext,
        enrollment_id: UUID,
        data: EnrollmentCompleteRequest,
    ) -> EnrollmentRead:
        if not has_permission(context, Permissions.ENROLLMENTS_MANAGE_INSTITUTION):
            raise ForbiddenError("Enrollment management permission required")

        row = await self._get_row(context, enrollment_id, for_update=True)
        enrollment = row[0]
        if enrollment.status != EnrollmentStatus.ACTIVE:
            raise ConflictError("Only active enrollments can be completed")

        effective_date = data.effective_date or now_utc()
        enrollment.status = EnrollmentStatus.COMPLETED
        enrollment.ended_at = effective_date
        enrollment.effective_date = enrollment.effective_date or effective_date
        enrollment.status_reason = self._reason(data.reason_code, data.notes)

        self.session.add(
            AcademicMovement(
                institution_id=str(context.institution_id),
                student_id=str(enrollment.student_id),
                movement_type=AcademicMovementType.COMPLETION,
                source_enrollment_id=str(enrollment.id),
                source_classroom_id=str(enrollment.classroom_id),
                effective_date=effective_date,
                reason_code=data.reason_code,
                notes=data.notes,
                authorized_by_user_id=str(context.user_id),
            )
        )
        await self.session.flush()
        return self._serialize(await self._get_row(context, enrollment_id))

    async def transfer_enrollment(
        self,
        context: AuthorizationContext,
        enrollment_id: UUID,
        data: EnrollmentTransferRequest,
        *,
        idempotency_key: Optional[str],
    ) -> EnrollmentRead:
        if not has_permission(context, Permissions.ENROLLMENTS_TRANSFER_INSTITUTION):
            raise ForbiddenError("Enrollment transfer permission required")

        request_payload = {"enrollment_id": str(enrollment_id), **data.model_dump(mode="json")}
        existing_id = await find_idempotent_result(
            self.session,
            context,
            operation="enrollment.transfer",
            key=idempotency_key,
            payload=request_payload,
        )
        if existing_id:
            return self._serialize(await self._get_row(context, existing_id))

        row = await self._get_row(context, enrollment_id, for_update=True)
        source = row[0]
        if source.status not in ACTIVE_ENROLLMENT_STATUSES:
            raise ConflictError("Only pending or active enrollments can be transferred")
        if str(source.classroom_id) == str(data.destination_classroom_id):
            raise ValidationError("Destination classroom must be different")

        source_classroom = await self._get_classroom_for_update(
            context.institution_id,
            UUID(source.classroom_id),
        )
        destination = await self._get_classroom_for_update(
            context.institution_id,
            data.destination_classroom_id,
        )
        if destination.status != "active":
            raise ConflictError("Destination classroom is not active")
        if destination.academic_year_id != source.academic_year_id:
            raise ConflictError("Transfers cannot change the academic year")
        if destination.grade_id != source_classroom.grade_id:
            raise ConflictError("Transfers cannot change the grade; use the promotion process")

        duplicate = (
            await self.session.execute(
                select(Enrollment.id).where(
                    Enrollment.student_id == str(source.student_id),
                    Enrollment.classroom_id == str(destination.id),
                    Enrollment.academic_year_id == str(destination.academic_year_id),
                    Enrollment.status.in_(ACTIVE_ENROLLMENT_STATUSES),
                    Enrollment.id != str(source.id),
                )
            )
        ).scalars().first()
        if duplicate:
            raise ConflictError("Student already has an active enrollment in the destination classroom")

        await self._ensure_capacity(destination)

        effective_date = data.effective_date or now_utc()
        source.status = EnrollmentStatus.TRANSFERRED
        source.ended_at = effective_date
        source.effective_date = source.effective_date or effective_date
        source.status_reason = self._reason(data.reason_code, data.notes)
        await self.session.flush()

        destination_enrollment = Enrollment(
            student_id=str(source.student_id),
            institution_id=str(context.institution_id),
            classroom_id=str(destination.id),
            academic_year_id=str(destination.academic_year_id),
            period_id=source.period_id,
            status=EnrollmentStatus.ACTIVE,
            effective_date=effective_date,
        )
        self.session.add(destination_enrollment)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError(
                "Student already has an active enrollment in this academic year"
            ) from exc

        self.session.add(
            AcademicMovement(
                institution_id=str(context.institution_id),
                student_id=str(source.student_id),
                movement_type=AcademicMovementType.TRANSFER,
                source_enrollment_id=str(source.id),
                destination_enrollment_id=str(destination_enrollment.id),
                source_classroom_id=str(source.classroom_id),
                destination_classroom_id=str(destination.id),
                effective_date=effective_date,
                reason_code=data.reason_code,
                notes=data.notes,
                authorized_by_user_id=str(context.user_id),
            )
        )
        await record_idempotency(
            self.session,
            context,
            operation="enrollment.transfer",
            key=idempotency_key,
            payload=request_payload,
            resource_type="enrollment",
            resource_id=UUID(destination_enrollment.id),
        )
        await self.session.flush()
        return self._serialize(
            await self._get_row(context, UUID(destination_enrollment.id))
        )

    async def list_movements(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        student_id: Optional[UUID],
        enrollment_id: Optional[UUID],
        movement_type: Optional[str],
        classroom_id: Optional[UUID],
    ) -> Tuple[List[AcademicMovementRead], int]:
        conditions = [AcademicMovement.institution_id == str(context.institution_id)]
        if student_id:
            conditions.append(AcademicMovement.student_id == str(student_id))
        if enrollment_id:
            conditions.append(
                or_(
                    AcademicMovement.source_enrollment_id == str(enrollment_id),
                    AcademicMovement.destination_enrollment_id == str(enrollment_id),
                )
            )
        if movement_type:
            try:
                conditions.append(
                    AcademicMovement.movement_type == AcademicMovementType(movement_type)
                )
            except ValueError as exc:
                raise ValidationError("Invalid movement type") from exc
        if classroom_id:
            conditions.append(
                or_(
                    AcademicMovement.source_classroom_id == str(classroom_id),
                    AcademicMovement.destination_classroom_id == str(classroom_id),
                )
            )

        total = int(
            (
                await self.session.execute(
                    select(func.count())
                    .select_from(AcademicMovement)
                    .where(*conditions)
                )
            ).scalar_one()
        )
        stmt = (
            select(AcademicMovement)
            .where(*conditions)
            .order_by(AcademicMovement.effective_date.desc(), AcademicMovement.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        movements = list((await self.session.execute(stmt)).scalars().all())
        return [AcademicMovementRead.model_validate(item) for item in movements], total

    async def _movements_for(self, enrollment_id: str) -> List[AcademicMovementRead]:
        stmt = (
            select(AcademicMovement)
            .where(
                or_(
                    AcademicMovement.source_enrollment_id == str(enrollment_id),
                    AcademicMovement.destination_enrollment_id == str(enrollment_id),
                )
            )
            .order_by(AcademicMovement.effective_date.asc())
        )
        items = list((await self.session.execute(stmt)).scalars().all())
        return [AcademicMovementRead.model_validate(item) for item in items]

    async def _get_classroom_for_update(
        self,
        institution_id: UUID,
        classroom_id: UUID,
    ) -> Classroom:
        classroom = (
            await self.session.execute(
                select(Classroom)
                .where(
                    Classroom.id == str(classroom_id),
                    Classroom.institution_id == str(institution_id),
                )
                .with_for_update()
            )
        ).scalars().first()
        if not classroom:
            raise NotFoundError("Classroom not found")
        return classroom

    async def _get_year(self, institution_id: UUID, year_id: str) -> AcademicYear:
        year = (
            await self.session.execute(
                select(AcademicYear).where(
                    AcademicYear.id == str(year_id),
                    AcademicYear.institution_id == str(institution_id),
                )
            )
        ).scalars().first()
        if not year:
            raise NotFoundError("Academic year not found")
        return year

    async def _get_student(
        self,
        institution_id: UUID,
        student_id: UUID,
    ) -> StudentProfile:
        student = (
            await self.session.execute(
                select(StudentProfile)
                .join(User, StudentProfile.user_id == User.id)
                .where(
                    StudentProfile.id == str(student_id),
                    User.institution_id == str(institution_id),
                    User.status == UserStatus.ACTIVE,
                )
            )
        ).scalars().first()
        if not student:
            raise NotFoundError("Student not found")
        return student

    async def _get_period_for_year(
        self,
        academic_year_id: str,
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
        if period.academic_year_id != str(academic_year_id):
            raise ValidationError("Period does not belong to the classroom academic year")
        if period.status == "archived":
            raise ConflictError("Academic period is archived")
        return period

    async def _ensure_capacity(self, classroom: Classroom) -> None:
        if classroom.capacity is None:
            return
        count = int(
            (
                await self.session.execute(
                    select(func.count())
                    .select_from(Enrollment)
                    .where(
                        Enrollment.classroom_id == str(classroom.id),
                        Enrollment.status.in_(ACTIVE_ENROLLMENT_STATUSES),
                    )
                )
            ).scalar_one()
        )
        if count >= classroom.capacity:
            raise ConflictError("Classroom capacity has been reached")

    @staticmethod
    def _reason(reason_code: str, notes: Optional[str]) -> str:
        value = reason_code if not notes else f"{reason_code}: {notes}"
        return value[:500]
