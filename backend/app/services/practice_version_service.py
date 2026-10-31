"""Practice version service."""

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import Practice, PracticeVersion, Exercise
from app.repositories import PracticeRepository, PracticeVersionRepository, ExerciseRepository
from app.schemas.practice import PracticeVersionRead
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class PracticeVersionService:
    """Practice version management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.practice_repo = PracticeRepository(session)
        self.version_repo = PracticeVersionRepository(session)
        self.exercise_repo = ExerciseRepository(session)

    async def list_versions(
        self,
        context: AuthorizationContext,
        practice_id: UUID,
        *,
        page: int,
        page_size: int,
        status: Optional[str] = None,
    ) -> Tuple[List[PracticeVersion], int]:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read practice versions")

        practice = await self.practice_repo.get_practice(context.institution_id, practice_id)
        
        return await self.version_repo.list_versions(
            practice_id=practice_id,
            page=page,
            page_size=page_size,
            status=status,
        )

    async def get_version(
        self,
        context: AuthorizationContext,
        version_id: UUID,
    ) -> PracticeVersion:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read practice versions")
        return await self.version_repo.get_version_with_relations(version_id)

    async def get_latest_version(
        self,
        context: AuthorizationContext,
        practice_id: UUID,
    ) -> Optional[PracticeVersion]:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read practice versions")
        
        practice = await self.practice_repo.get_practice(context.institution_id, practice_id)
        return await self.version_repo.get_latest_version(practice_id)

    async def get_published_version(
        self,
        context: AuthorizationContext,
        practice_id: UUID,
    ) -> Optional[PracticeVersion]:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read practice versions")
        
        practice = await self.practice_repo.get_practice(context.institution_id, practice_id)
        return await self.version_repo.get_published_version(practice_id)

    async def create_version(
        self,
        context: AuthorizationContext,
        practice_id: UUID,
    ) -> PracticeVersion:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to create practice versions")

        practice = await self.practice_repo.get_practice(context.institution_id, practice_id)
        
        if practice.status == "archived":
            raise ConflictError("Cannot create versions for archived practice")

        # Get next version number
        version_number = await self.version_repo.get_next_version_number(practice_id)
        
        # Create snapshot from current practice
        practice_snapshot = {
            "id": str(practice.id),
            "title": practice.title,
            "description": practice.description,
            "practice_type": practice.practice_type.value,
            "difficulty": practice.difficulty.value,
            "max_attempts": practice.max_attempts,
            "time_limit_minutes": practice.time_limit_minutes,
            "shuffle_questions": practice.shuffle_questions,
            "shuffle_options": practice.shuffle_options,
            "show_solutions_after": practice.show_solutions_after,
            "allow_partial_progress": practice.allow_partial_progress,
            "show_hints": practice.show_hints,
            "max_score": practice.max_score,
            "passing_score": practice.passing_score,
            "partial_scoring": practice.partial_scoring,
            "tags": practice.tags,
        }
        
        config_snapshot = {
            "max_attempts": practice.max_attempts,
            "time_limit_minutes": practice.time_limit_minutes,
            "shuffle_questions": practice.shuffle_questions,
            "shuffle_options": practice.shuffle_options,
            "show_solutions_after": practice.show_solutions_after,
            "allow_partial_progress": practice.allow_partial_progress,
            "show_hints": practice.show_hints,
            "max_score": practice.max_score,
            "passing_score": practice.passing_score,
            "partial_scoring": practice.partial_scoring,
        }
        
        # Get exercises for snapshot
        exercises, _ = await self.exercise_repo.list_exercises(
            version_id=UUID(practice_id),
            page=1,
            page_size=1000,
        )
        exercises_snapshot = []
        for ex in exercises:
            options = ex.options
            exercises_snapshot.append({
                "id": str(ex.id),
                "exercise_type": ex.exercise_type.value,
                "prompt": ex.prompt,
                "content": ex.content,
                "sequence": ex.sequence,
                "points": ex.points,
                "scoring_rule": ex.scoring_rule,
                "feedback_config": ex.feedback_config,
                "hints": ex.hints,
                "difficulty": ex.difficulty.value if ex.difficulty else None,
                "tags": ex.tags,
                "learning_objective": ex.learning_objective,
                "resource_ids": [str(r) for r in ex.resource_ids],
                "options": [
                    {
                        "id": str(opt.id),
                        "text": opt.text,
                        "sequence": opt.sequence,
                        "is_correct": opt.is_correct,
                        "feedback": opt.feedback,
                        "metadata": opt.metadata_,
                    }
                    for opt in ex.options
                ],
            })

        version_data = {
            "practice_id": str(practice_id),
            "version_number": version_number,
            "status": "draft",
            "snapshot": practice_snapshot,
            "config_snapshot": config_snapshot,
            "exercises_snapshot": exercises_snapshot,
            "author_id": str(context.user_id),
        }
        
        version = await self.version_repo.create_version(version_data)
        await self.session.commit()
        return version

    async def update_version(
        self,
        context: AuthorizationContext,
        version_id: UUID,
        data: dict,
    ) -> PracticeVersion:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to update practice versions")

        version = await self.version_repo.get_version(version_id)
        
        if version.status not in ["draft"]:
            raise ConflictError("Can only update draft versions")

        update_data = {k: v for k, v in data.items() if v is not None}
        
        protected_fields = ["id", "practice_id", "version_number", "author_id", "created_at"]
        for field in protected_fields:
            update_data.pop(field, None)

        version = await self.version_repo.update_version(version, update_data)
        await self.session.commit()
        return version

    async def publish_version(
        self,
        context: AuthorizationContext,
        version_id: UUID,
    ) -> PracticeVersion:
        if not has_permission(context, Permissions.CONTENT_PUBLISH_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to publish practice versions")

        version = await self.version_repo.get_version(version_id)
        
        if version.status != "approved":
            raise ConflictError("Can only publish approved versions")

        version = await self.version_repo.update_version(version, {
            "status": "published",
            "published_at": datetime.utcnow(),
        })
        await self.session.commit()
        return version

    async def delete_version(
        self,
        context: AuthorizationContext,
        version_id: UUID,
    ) -> None:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to delete practice versions")

        version = await self.version_repo.get_version(version_id)
        
        if version.status == "published":
            raise ConflictError("Cannot delete a published version")

        # Delete associated exercises first
        from app.repositories import ExerciseRepository
        exercise_repo = ExerciseRepository(self.session)
        exercises, _ = await exercise_repo.list_exercises(version_id=version_id, page=1, page_size=1000)
        for exercise in exercises:
            await exercise_repo.delete_exercise(exercise)
        
        await self.version_repo.delete_version(version)
        await self.session.commit()