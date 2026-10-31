"""Practice attempt service."""

from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import (
    Practice, PracticeVersion, Exercise, PracticeAttempt, 
    PracticeResponse, PracticeResult, PracticeFeedback,
    StudentProfile, Enrollment
)
from app.repositories import (
    PracticeRepository, PracticeVersionRepository, ExerciseRepository,
    PracticeAttemptRepository, PracticeResponseRepository, PracticeResultRepository, PracticeFeedbackRepository
)
from app.schemas.practice import PracticeAttemptCreate, PracticeResponseCreate, AttemptStatus
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission
from app.services.practice_scoring_service import PracticeScoringService
from app.services.academic_access_service import AcademicAccessService


class PracticeAttemptService:
    """Practice attempt management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.practice_repo = PracticeRepository(session)
        self.version_repo = PracticeVersionRepository(session)
        self.exercise_repo = ExerciseRepository(session)
        self.attempt_repo = PracticeAttemptRepository(session)
        self.response_repo = PracticeResponseRepository(session)
        self.result_repo = PracticeResultRepository(session)
        self.feedback_repo = PracticeFeedbackRepository(session)
        self.scoring_service = PracticeScoringService(session)
        self.access = AcademicAccessService(session)

    async def list_attempts(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        practice_id: Optional[UUID] = None,
        student_profile_id: Optional[UUID] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[PracticeAttempt], int]:
        # Students can only see their own attempts
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            if not has_permission(context, Permissions.PROGRESS_READ_OWN):
                raise ForbiddenError("Insufficient permissions to read attempts")
            student_profile_id = context.user_id  # This would need proper mapping
        
        # If student, filter to their own attempts
        if has_permission(context, Permissions.PROGRESS_READ_OWN) and not has_permission(context, Permissions.CONTENT_READ):
            student_profile = await self.session.execute(
                select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
            )
            student_profile = student_profile.scalars().first()
            if student_profile:
                student_profile_id = student_profile.id

        return await self.attempt_repo.list_attempts(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            practice_id=practice_id,
            student_profile_id=student_profile_id,
            status=status,
        )

    async def get_attempt(self, context: AuthorizationContext, attempt_id: UUID) -> PracticeAttempt:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            if not has_permission(context, Permissions.PROGRESS_READ_OWN):
                raise ForbiddenError("Insufficient permissions to read attempts")
        
        attempt = await self.attempt_repo.get_attempt(context.institution_id, attempt_id)
        
        # Check ownership for students
        student_profile = await self.session.execute(
            select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
        )
        student_profile = student_profile.scalars().first()
        if student_profile and str(attempt.student_profile_id) != str(student_profile.id):
            if not has_permission(context, Permissions.CONTENT_READ):
                raise ForbiddenError("Cannot access another student's attempt")
        
        return attempt

    async def start_attempt(
        self,
        context: AuthorizationContext,
        data: PracticeAttemptCreate,
    ) -> PracticeAttempt:
        if not has_permission(context, Permissions.PROGRESS_READ_OWN):
            raise ForbiddenError("Insufficient permissions to start attempts")

        # Get student profile
        student_profile = await self.session.execute(
            select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
        )
        student_profile = student_profile.scalars().first()
        if not student_profile:
            raise NotFoundError("Student profile not found")

        practice = await self.practice_repo.get_practice(context.institution_id, data.practice_id)
        
        # Check if practice is published
        if practice.status != "published":
            raise ConflictError("Can only start attempts on published practices")

        # Get published version
        published_version = await self.version_repo.get_published_version(practice.id)
        if not published_version:
            raise ConflictError("No published version available for this practice")

        # Check enrollment if practice has unit/lesson/course
        if practice.course_id:
            enrollment = await self.access.enrollment(context, practice.course_id)
            if not enrollment:
                raise ForbiddenError("Student not enrolled in the course for this practice")

        # Check attempt limits
        attempt_count = await self.attempt_repo.get_attempt_count(student_profile.id, published_version.id)
        if practice.max_attempts and attempt_count >= practice.max_attempts:
            raise ConflictError(f"Maximum attempts ({practice.max_attempts}) reached for this practice")

        attempt_number = await self.attempt_repo.get_next_attempt_number(student_profile.id, published_version.id)

        # Create attempt
        attempt_data = {
            "practice_id": str(practice.id),
            "version_id": str(published_version.id),
            "student_profile_id": str(student_profile.id),
            "institution_id": str(context.institution_id),
            "enrollment_id": str(enrollment.id) if enrollment else None,
            "attempt_number": attempt_number,
            "status": AttemptStatus.IN_PROGRESS,
            "max_possible_score": published_version.config_snapshot.get("max_score", practice.max_score),
        }

        attempt = await self.attempt_repo.create_attempt(attempt_data)
        await self.session.commit()
        return attempt

    async def save_response(
        self,
        context: AuthorizationContext,
        attempt_id: UUID,
        exercise_id: UUID,
        data: PracticeResponseCreate,
    ) -> PracticeResponse:
        attempt = await self.attempt_repo.get_attempt(context.institution_id, attempt_id)
        
        await self.access.require_owner(context, attempt)
        # Verify ownership
        student_profile = await self.session.execute(
            select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
        )
        student_profile = student_profile.scalars().first()
        if student_profile and str(attempt.student_profile_id) != str(student_profile.id):
            raise ForbiddenError("Cannot save response for another student's attempt")

        if attempt.status not in [AttemptStatus.IN_PROGRESS]:
            raise ConflictError("Cannot save response for completed or cancelled attempt")

        # Verify exercise belongs to the version
        exercise = await self.exercise_repo.get_exercise(exercise_id)
        if str(exercise.version_id) != str(attempt.version_id):
            raise ValidationError("Exercise does not belong to this practice version")

        # Save response
        response_data = data.model_dump()
        response_data["attempt_id"] = str(attempt_id)
        response_data["exercise_id"] = str(exercise_id)
        
        response = await self.response_repo.upsert_response(attempt_id, exercise_id, response_data)
        
        # Update attempt progress
        responses = await self.response_repo.list_responses(attempt_id)
        attempt.exercises_answered = len([r for r in responses if r.response_status == "saved"])
        
        await self.session.commit()
        return response

    async def submit_attempt(
        self,
        context: AuthorizationContext,
        attempt_id: UUID,
    ) -> PracticeAttempt:
        attempt = await self.attempt_repo.get_attempt(context.institution_id, attempt_id)
        await self.access.require_owner(context, attempt)
        
        # Verify ownership
        student_profile = await self.session.execute(
            select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
        )
        student_profile = student_profile.scalars().first()
        if student_profile and str(attempt.student_profile_id) != str(student_profile.id):
            raise ForbiddenError("Cannot submit another student's attempt")

        if attempt.status != AttemptStatus.IN_PROGRESS:
            raise ConflictError("Can only submit in-progress attempts")

        # Get all responses
        responses = await self.response_repo.list_responses(attempt_id)
        
        # Score the attempt
        scoring_result = await self.scoring_service.score_attempt(attempt, responses)
        
        # Update attempt
        attempt.status = AttemptStatus.SUBMITTED
        attempt.submitted_at = datetime.now(timezone.utc)
        attempt.score = scoring_result["score"]
        attempt.max_possible_score = scoring_result["max_score"]
        attempt.percentage = scoring_result["percentage"]
        attempt.exercises_correct = scoring_result["correct"]
        attempt.exercises_incorrect = scoring_result["incorrect"]
        attempt.exercises_pending_review = scoring_result["pending_review"]
        attempt.exercises_answered = scoring_result["answered"]
        attempt.time_spent_seconds = scoring_result["time_spent"]
        
        # Determine if auto-reviewed or needs manual review
        if scoring_result["pending_review"] > 0:
            attempt.status = AttemptStatus.NEEDS_MANUAL_REVIEW
        else:
            attempt.status = AttemptStatus.AUTO_REVIEWED

        # Create or update result
        existing_result = await self.result_repo.get_result_by_attempt(attempt_id)
        if existing_result:
            await self.result_repo.update_result(existing_result, {
                "score": attempt.score,
                "max_score": attempt.max_possible_score,
                "percentage": attempt.percentage,
                "passed": attempt.percentage >= (attempt.practice.passing_score if attempt.practice and attempt.practice.passing_score else 60),
                "total_exercises": scoring_result["total"],
                "correct_exercises": scoring_result["correct"],
                "incorrect_exercises": scoring_result["incorrect"],
                "pending_review_exercises": scoring_result["pending_review"],
                "feedback_status": "auto" if scoring_result["pending_review"] == 0 else "pending_review",
                "auto_feedback_generated": True,
                "finalized_at": datetime.now(timezone.utc),
            })
        else:
            result_data = {
                "attempt_id": str(attempt_id),
                "student_profile_id": str(attempt.student_profile_id),
                "practice_id": str(attempt.practice_id),
                "version_id": str(attempt.version_id),
                "institution_id": str(attempt.institution_id),
                "score": attempt.score,
                "max_score": attempt.max_possible_score,
                "percentage": attempt.percentage,
                "passed": attempt.percentage >= (attempt.practice.passing_score if attempt.practice and attempt.practice.passing_score else 60),
                "total_exercises": scoring_result["total"],
                "correct_exercises": scoring_result["correct"],
                "incorrect_exercises": scoring_result["incorrect"],
                "pending_review_exercises": scoring_result["pending_review"],
                "feedback_status": "auto" if scoring_result["pending_review"] == 0 else "pending_review",
                "auto_feedback_generated": True,
                "finalized_at": datetime.now(timezone.utc),
            }
            await self.result_repo.create_result(result_data)

        # Generate auto feedback
        feedback_items = await self.scoring_service.generate_feedback(attempt, responses, scoring_result)
        if feedback_items:
            await self.feedback_repo.bulk_create_feedback(feedback_items)

        await self.session.commit()
        return attempt

    async def cancel_attempt(
        self,
        context: AuthorizationContext,
        attempt_id: UUID,
    ) -> PracticeAttempt:
        attempt = await self.attempt_repo.get_attempt(context.institution_id, attempt_id)
        await self.access.require_owner(context, attempt)
        
        student_profile = await self.session.execute(
            select(StudentProfile).where(StudentProfile.user_id == str(context.user_id))
        )
        student_profile = student_profile.scalars().first()
        if student_profile and str(attempt.student_profile_id) != str(student_profile.id):
            raise ForbiddenError("Cannot cancel another student's attempt")

        if attempt.status not in [AttemptStatus.IN_PROGRESS]:
            raise ConflictError("Can only cancel in-progress attempts")

        attempt.status = AttemptStatus.CANCELLED
        await self.session.commit()
        return attempt
