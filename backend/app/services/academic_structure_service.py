"""Academic years, periods, grades, and sections services."""

from datetime import date
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import String, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.db.models import (
    AcademicPeriod,
    AcademicYear,
    Assessment,
    Enrollment,
    EnrollmentStatus,
    Grade,
    PeriodType,
    Section,
)
from app.schemas.academic import (
    AcademicPeriodCreate,
    AcademicPeriodUpdate,
    AcademicYearCreate,
    AcademicYearUpdate,
    SectionCreate,
    SectionUpdate,
)
from app.schemas.permission import AuthorizationContext


YEAR_TRANSITIONS = {
    "draft": {"planned", "active", "archived"},
    "planned": {"active", "closed", "archived"},
    "active": {"closed"},
    "closed": {"archived"},
    "archived": set(),
}

PERIOD_TRANSITIONS = {
    "draft": {"planned", "active", "archived"},
    "planned": {"active", "closed", "archived"},
    "active": {"closed"},
    "closed": {"archived"},
    "archived": set(),
}


def _validate_transition(current: str, target: str, transitions: dict[str, set[str]]) -> None:
    if target == current:
        return
    if target not in transitions.get(current, set()):
        raise ConflictError(f"Invalid status transition: {current} -> {target}")


class AcademicStructureService:
    """Institution-scoped academic structure management."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_year_model(
        self,
        context: AuthorizationContext,
        year_id: UUID,
        *,
        for_update: bool = False,
    ) -> AcademicYear:
        stmt = select(AcademicYear).where(
            AcademicYear.id == str(year_id),
            AcademicYear.institution_id == str(context.institution_id),
        )
        if for_update:
            stmt = stmt.with_for_update()
        year = (await self.session.execute(stmt)).scalars().first()
        if not year:
            raise NotFoundError("Academic year not found")
        return year

    async def _get_period_model(
        self,
        context: AuthorizationContext,
        period_id: UUID,
        *,
        for_update: bool = False,
    ) -> AcademicPeriod:
        stmt = (
            select(AcademicPeriod)
            .join(AcademicYear, AcademicPeriod.academic_year_id == AcademicYear.id)
            .where(
                AcademicPeriod.id == str(period_id),
                AcademicYear.institution_id == str(context.institution_id),
            )
            .options(selectinload(AcademicPeriod.academic_year))
        )
        if for_update:
            stmt = stmt.with_for_update()
        period = (await self.session.execute(stmt)).scalars().first()
        if not period:
            raise NotFoundError("Academic period not found")
        return period

    async def list_years(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        status: Optional[str],
        search: Optional[str],
    ) -> Tuple[List[AcademicYear], int]:
        conditions = [AcademicYear.institution_id == str(context.institution_id)]
        if status:
            conditions.append(AcademicYear.status == status)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(AcademicYear.name).like(pattern),
                    func.cast(AcademicYear.year, String).like(pattern),
                )
            )
        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(AcademicYear).where(*conditions)
                )
            ).scalar_one()
        )
        stmt = (
            select(AcademicYear)
            .where(*conditions)
            .order_by(AcademicYear.year.desc(), AcademicYear.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_year(self, context: AuthorizationContext, year_id: UUID) -> AcademicYear:
        return await self._get_year_model(context, year_id)

    async def create_year(
        self,
        context: AuthorizationContext,
        data: AcademicYearCreate,
    ) -> AcademicYear:
        if data.end_date <= data.start_date:
            raise ValidationError("end_date must be after start_date")
        if data.status == "active":
            await self._ensure_only_active_year(context, exclude_id=None)

        year = AcademicYear(
            institution_id=str(context.institution_id),
            year=data.year,
            name=data.name.strip(),
            start_date=data.start_date,
            end_date=data.end_date,
            status=data.status,
        )
        self.session.add(year)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError("An academic year with this year already exists") from exc
        await self.session.refresh(year)
        return year

    async def update_year(
        self,
        context: AuthorizationContext,
        year_id: UUID,
        data: AcademicYearUpdate,
    ) -> AcademicYear:
        year = await self._get_year_model(context, year_id, for_update=True)
        new_start = data.start_date or year.start_date
        new_end = data.end_date or year.end_date
        if new_end <= new_start:
            raise ValidationError("end_date must be after start_date")

        if data.status is not None:
            _validate_transition(year.status, data.status, YEAR_TRANSITIONS)
            if data.status == "active":
                await self._ensure_only_active_year(context, exclude_id=year.id)
            if data.status in {"closed", "archived"}:
                await self._ensure_year_can_close(context, year)

        period_outside = (
            await self.session.execute(
                select(func.count())
                .select_from(AcademicPeriod)
                .where(
                    AcademicPeriod.academic_year_id == str(year.id),
                    or_(
                        AcademicPeriod.start_date < new_start,
                        AcademicPeriod.end_date > new_end,
                    ),
                )
            )
        ).scalar_one()
        if int(period_outside) > 0:
            raise ConflictError("Academic year dates must contain all existing periods")

        if data.name is not None:
            year.name = data.name.strip()
        year.start_date = new_start
        year.end_date = new_end
        if data.status is not None:
            year.status = data.status

        await self.session.flush()
        return year

    async def _ensure_only_active_year(
        self,
        context: AuthorizationContext,
        *,
        exclude_id: Optional[str],
    ) -> None:
        conditions = [
            AcademicYear.institution_id == str(context.institution_id),
            AcademicYear.status == "active",
        ]
        if exclude_id:
            conditions.append(AcademicYear.id != str(exclude_id))
        count = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(AcademicYear).where(*conditions)
                )
            ).scalar_one()
        )
        if count:
            raise ConflictError("The institution already has an active academic year")

    async def _ensure_year_can_close(
        self,
        context: AuthorizationContext,
        year: AcademicYear,
    ) -> None:
        count = int(
            (
                await self.session.execute(
                    select(func.count())
                    .select_from(Enrollment)
                    .where(
                        Enrollment.institution_id == str(context.institution_id),
                        Enrollment.academic_year_id == str(year.id),
                        Enrollment.status.in_(
                            [EnrollmentStatus.PENDING, EnrollmentStatus.ACTIVE]
                        ),
                    )
                )
            ).scalar_one()
        )
        if count:
            raise ConflictError(
                "Academic year has active enrollments and cannot be closed or archived"
            )

    async def list_periods(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        academic_year_id: Optional[UUID],
        status: Optional[str],
        period_type: Optional[str],
        search: Optional[str],
    ) -> Tuple[List[AcademicPeriod], int]:
        conditions = [AcademicYear.institution_id == str(context.institution_id)]
        if academic_year_id:
            conditions.append(AcademicPeriod.academic_year_id == str(academic_year_id))
        if status:
            conditions.append(AcademicPeriod.status == status)
        if period_type:
            conditions.append(AcademicPeriod.period_type == PeriodType(period_type))
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(func.lower(AcademicPeriod.name).like(pattern))

        base = (
            select(AcademicPeriod)
            .join(AcademicYear, AcademicPeriod.academic_year_id == AcademicYear.id)
            .where(*conditions)
        )
        total = int(
            (
                await self.session.execute(
                    select(func.count())
                    .select_from(AcademicPeriod)
                    .join(AcademicYear, AcademicPeriod.academic_year_id == AcademicYear.id)
                    .where(*conditions)
                )
            ).scalar_one()
        )
        stmt = (
            base.order_by(
                AcademicYear.year.desc(),
                AcademicPeriod.sequence.asc(),
                AcademicPeriod.id.asc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_period(
        self,
        context: AuthorizationContext,
        period_id: UUID,
    ) -> AcademicPeriod:
        return await self._get_period_model(context, period_id)

    async def create_period(
        self,
        context: AuthorizationContext,
        data: AcademicPeriodCreate,
    ) -> AcademicPeriod:
        year = await self._get_year_model(context, data.academic_year_id)
        if year.status == "archived":
            raise ConflictError("Cannot add periods to an archived academic year")
        if data.start_date < year.start_date or data.end_date > year.end_date:
            raise ValidationError("Period dates must be within the academic year")
        if data.end_date <= data.start_date:
            raise ValidationError("end_date must be after start_date")
        if data.status == "active":
            await self._ensure_period_dates_free(
                year.id,
                data.start_date,
                data.end_date,
                data.period_type,
                exclude_id=None,
            )
            await self._ensure_only_active_period(year.id, exclude_id=None)

        period = AcademicPeriod(
            academic_year_id=str(year.id),
            name=data.name.strip(),
            period_type=PeriodType(data.period_type),
            start_date=data.start_date,
            end_date=data.end_date,
            status=data.status,
            sequence=data.sequence,
        )
        self.session.add(period)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError("A period with this sequence already exists") from exc
        await self.session.refresh(period)
        return period

    async def update_period(
        self,
        context: AuthorizationContext,
        period_id: UUID,
        data: AcademicPeriodUpdate,
    ) -> AcademicPeriod:
        period = await self._get_period_model(context, period_id, for_update=True)
        year = period.academic_year
        new_start = data.start_date or period.start_date
        new_end = data.end_date or period.end_date
        new_type = PeriodType(data.period_type) if data.period_type else period.period_type

        if new_start < year.start_date or new_end > year.end_date:
            raise ValidationError("Period dates must be within the academic year")
        if new_end <= new_start:
            raise ValidationError("end_date must be after start_date")

        dates_changed = new_start != period.start_date or new_end != period.end_date
        if dates_changed:
            dependency_count = int(
                (
                    await self.session.execute(
                        select(func.count())
                        .select_from(Assessment)
                        .where(Assessment.period_id == str(period.id))
                    )
                ).scalar_one()
            )
            if dependency_count:
                raise ConflictError(
                    "Period has assessments and its dates cannot be changed silently"
                )
            await self._ensure_period_dates_free(
                period.academic_year_id,
                new_start,
                new_end,
                new_type,
                exclude_id=period.id,
            )

        if data.status is not None:
            _validate_transition(period.status, data.status, PERIOD_TRANSITIONS)
            if data.status == "active":
                await self._ensure_only_active_period(
                    period.academic_year_id,
                    exclude_id=period.id,
                )

        if data.name is not None:
            period.name = data.name.strip()
        period.period_type = new_type
        period.start_date = new_start
        period.end_date = new_end
        if data.sequence is not None:
            period.sequence = data.sequence
        if data.status is not None:
            period.status = data.status

        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError("A period with this sequence already exists") from exc
        return period

    async def _ensure_only_active_period(
        self,
        academic_year_id: str,
        *,
        exclude_id: Optional[str],
    ) -> None:
        conditions = [
            AcademicPeriod.academic_year_id == str(academic_year_id),
            AcademicPeriod.status == "active",
        ]
        if exclude_id:
            conditions.append(AcademicPeriod.id != str(exclude_id))
        count = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(AcademicPeriod).where(*conditions)
                )
            ).scalar_one()
        )
        if count:
            raise ConflictError("The academic year already has an active period")

    async def _ensure_period_dates_free(
        self,
        academic_year_id: str,
        start_date: date,
        end_date: date,
        period_type: PeriodType,
        *,
        exclude_id: Optional[str],
    ) -> None:
        conditions = [
            AcademicPeriod.academic_year_id == str(academic_year_id),
            AcademicPeriod.period_type == period_type,
            AcademicPeriod.start_date <= end_date,
            AcademicPeriod.end_date >= start_date,
            AcademicPeriod.status != "archived",
        ]
        if exclude_id:
            conditions.append(AcademicPeriod.id != str(exclude_id))
        count = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(AcademicPeriod).where(*conditions)
                )
            ).scalar_one()
        )
        if count:
            raise ConflictError("Period overlaps another period of the same type")

    async def list_grades(
        self,
        *,
        status: Optional[str],
        include_inactive: bool,
    ) -> List[Grade]:
        stmt = select(Grade)
        if status:
            stmt = stmt.where(Grade.status == status)
        elif not include_inactive:
            stmt = stmt.where(Grade.status == "active")
        stmt = stmt.order_by(Grade.sequence.asc(), Grade.number.asc())
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_grade(self, grade_id: UUID) -> Grade:
        grade = (
            await self.session.execute(select(Grade).where(Grade.id == str(grade_id)))
        ).scalars().first()
        if not grade:
            raise NotFoundError("Grade not found")
        return grade

    async def list_sections(
        self,
        *,
        grade_id: Optional[UUID],
        status: Optional[str],
        page: int,
        page_size: int,
    ) -> Tuple[List[Section], int]:
        conditions = []
        if grade_id:
            conditions.append(Section.grade_id == str(grade_id))
        if status:
            conditions.append(Section.status == status)
        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(Section).where(*conditions)
                )
            ).scalar_one()
        )
        stmt = (
            select(Section)
            .where(*conditions)
            .order_by(Section.name.asc(), Section.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all()), total

    async def get_section(self, section_id: UUID) -> Section:
        section = (
            await self.session.execute(select(Section).where(Section.id == str(section_id)))
        ).scalars().first()
        if not section:
            raise NotFoundError("Section not found")
        return section

    async def create_section(self, data: SectionCreate) -> Section:
        await self.get_grade(data.grade_id)
        section = Section(
            grade_id=str(data.grade_id),
            name=data.name.strip().upper(),
            name_short=data.name_short.strip().upper() if data.name_short else None,
            capacity=data.capacity,
            status=data.status,
        )
        self.session.add(section)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError("A section with this name already exists for the grade") from exc
        await self.session.refresh(section)
        return section

    async def update_section(self, section_id: UUID, data: SectionUpdate) -> Section:
        section = await self.get_section(section_id)
        if data.name is not None:
            section.name = data.name.strip().upper()
        if data.name_short is not None:
            section.name_short = data.name_short.strip().upper()
        if data.capacity is not None:
            section.capacity = data.capacity
        if data.status is not None:
            section.status = data.status
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError("A section with this name already exists for the grade") from exc
        return section
