"""Practice feedback service."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import PracticeResult, PracticeFeedback, Exercise
from app.schemas.practice import PracticeFeedbackRead


class PracticeFeedbackService:
    """Service for managing practice feedback."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_feedback_for_result(self, result_id: UUID) -> List[PracticeFeedback]:
        """Get all feedback items for a result."""
        stmt = (
            select(PracticeFeedback)
            .where(PracticeFeedback.result_id == str(result_id))
            .order_by(PracticeFeedback.created_at.asc())
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def add_feedback(
        self,
        result_id: UUID,
        feedback_type: str,
        title: str,
        message: str,
        is_positive: bool = True,
        exercise_id: Optional[UUID] = None,
        resources_recommended: Optional[List[UUID]] = None,
        lessons_recommended: Optional[List[UUID]] = None,
    ) -> PracticeFeedback:
        """Add a feedback item to a result."""
        feedback = PracticeFeedback(
            result_id=str(result_id),
            exercise_id=str(exercise_id) if exercise_id else None,
            feedback_type=feedback_type,
            title=title,
            message=message,
            is_positive=is_positive,
            resources_recommended=resources_recommended or [],
            lessons_recommended=lessons_recommended or [],
        )
        self.session.add(feedback)
        await self.session.flush()
        await self.session.refresh(feedback)
        return feedback

    async def add_manual_feedback(
        self,
        context_user_id: UUID,
        result_id: UUID,
        exercise_id: UUID,
        feedback_type: str,
        title: str,
        message: str,
        is_positive: bool,
        resources_recommended: Optional[List[UUID]] = None,
        lessons_recommended: Optional[List[UUID]] = None,
    ) -> PracticeFeedback:
        """Add manual feedback from a monitor/reviewer."""
        feedback = PracticeFeedback(
            result_id=str(result_id),
            exercise_id=str(exercise_id),
            feedback_type=feedback_type,
            title=title,
            message=message,
            is_positive=is_positive,
            resources_recommended=resources_recommended or [],
            lessons_recommended=lessons_recommended or [],
        )
        self.session.add(feedback)
        
        # Update result to mark manual feedback added
        from app.db.models import PracticeResult
        stmt = select(PracticeResult).where(PracticeResult.id == str(result_id))
        result = (await self.session.execute(stmt)).scalars().first()
        if result:
            result.manual_feedback_added = True
            result.feedback_status = "reviewed"
        
        await self.session.flush()
        await self.session.refresh(feedback)
        return feedback

    async def get_student_feedback(
        self,
        student_profile_id: UUID,
        *,
        page: int = 1,
        page_size: int = 20,
    ) -> List[PracticeFeedback]:
        """Get all feedback for a student across all their results."""
        from app.db.models import PracticeResult
        stmt = (
            select(PracticeFeedback)
            .join(PracticeResult, PracticeFeedback.result_id == PracticeResult.id)
            .where(PracticeResult.student_profile_id == str(student_profile_id))
            .order_by(PracticeFeedback.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_recommendations_for_student(
        self,
        student_profile_id: UUID,
    ) -> dict:
        """Get recommended resources and lessons based on feedback patterns."""
        # Get all incorrect feedback for student
        stmt = (
            select(PracticeFeedback)
            .join(PracticeResult, PracticeFeedback.result_id == PracticeResult.id)
            .where(
                PracticeResult.student_profile_id == str(student_profile_id),
                PracticeFeedback.is_positive == False,
            )
        )
        feedback_items = list((await self.session.execute(stmt)).scalars().all())
        
        # Collect recommended resources and lessons
        resources = set()
        lessons = set()
        
        for fb in feedback_items:
            resources.update(fb.resources_recommended or [])
            lessons.update(fb.lessons_recommended or [])
        
        return {
            "resources": list(resources),
            "lessons": list(lessons),
            "weak_areas_count": len(feedback_items),
        }