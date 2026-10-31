"""Assessment repository."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Assessment, AssessmentQuestion, Course
from app.core.exceptions import NotFoundError


class AssessmentRepository:
    """Assessment repository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_assessments(
        self,
        institution_id: UUID,
        *,
        page: int,
        page_size: int,
        course_id: Optional[UUID] = None,
        unit_id: Optional[UUID] = None,
        assessment_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Assessment], int]:
        query = select(Assessment).join(Course, Assessment.course_id == Course.id).where(
            Course.institution_id == str(institution_id)
        )

        if course_id:
            query = query.where(Assessment.course_id == str(course_id))
        if unit_id:
            query = query.where(Assessment.unit_id == str(unit_id))
        if assessment_type:
            query = query.where(Assessment.assessment_type == assessment_type)
        if status:
            query = query.where(Assessment.status == status)
        if search:
            query = query.where(Assessment.title.ilike(f"%{search}%"))

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(Assessment.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(query)
        items = list(result.scalars().all())
        return items, total

    async def get_assessment(self, institution_id: UUID, assessment_id: UUID) -> Assessment:
        query = (
            select(Assessment)
            .join(Course, Assessment.course_id == Course.id)
            .where(
                Assessment.id == str(assessment_id),
                Course.institution_id == str(institution_id),
            )
        )
        result = await self.session.execute(query)
        assessment = result.scalars().first()
        if not assessment:
            raise NotFoundError("Assessment not found")
        return assessment

    async def create_assessment(self, assessment_data: dict) -> Assessment:
        assessment = Assessment(**assessment_data)
        self.session.add(assessment)
        await self.session.flush()
        await self.session.refresh(assessment)
        return assessment

    async def update_assessment(self, assessment: Assessment, update_data: dict) -> Assessment:
        for key, value in update_data.items():
            setattr(assessment, key, value)
        await self.session.flush()
        await self.session.refresh(assessment)
        return assessment

    async def get_assessment_stats(self, assessment_id: str) -> dict:
        questions_query = select(func.count()).select_from(AssessmentQuestion).where(
            AssessmentQuestion.assessment_id == assessment_id
        )
        questions_result = await self.session.execute(questions_query)
        questions_count = questions_result.scalar() or 0

        return {
            "questions_count": questions_count,
            "attempts_count": 0,
        }

    async def get_questions_count(self, assessment_id: str) -> int:
        query = select(func.count()).select_from(AssessmentQuestion).where(
            AssessmentQuestion.assessment_id == assessment_id
        )
        result = await self.session.execute(query)
        return result.scalar() or 0
