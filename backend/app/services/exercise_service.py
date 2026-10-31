"""Exercise service."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import Practice, PracticeVersion, Exercise
from app.repositories import PracticeRepository, PracticeVersionRepository, ExerciseRepository, ExerciseOptionRepository
from app.schemas.practice import ExerciseCreate, ExerciseUpdate, ExerciseOptionCreate
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class ExerciseService:
    """Exercise management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.practice_repo = PracticeRepository(session)
        self.version_repo = PracticeVersionRepository(session)
        self.exercise_repo = ExerciseRepository(session)
        self.option_repo = ExerciseOptionRepository(session)

    async def list_exercises(
        self,
        context: AuthorizationContext,
        version_id: UUID,
        *,
        page: int,
        page_size: int,
        exercise_type: Optional[str] = None,
    ) -> Tuple[List[Exercise], int]:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read exercises")

        version = await self.version_repo.get_version(version_id)
        practice = await self.practice_repo.get_practice(context.institution_id, UUID(version.practice_id))
        
        return await self.exercise_repo.list_exercises(
            version_id=version_id,
            page=page,
            page_size=page_size,
            exercise_type=exercise_type,
        )

    async def get_exercise(self, context: AuthorizationContext, exercise_id: UUID) -> Exercise:
        if not has_permission(context, Permissions.CONTENT_READ) and not has_permission(context, Permissions.COURSES_READ):
            raise ForbiddenError("Insufficient permissions to read exercises")
        return await self.exercise_repo.get_exercise_with_options(exercise_id)

    async def create_exercise(
        self,
        context: AuthorizationContext,
        version_id: UUID,
        data: ExerciseCreate,
    ) -> Exercise:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to create exercises")

        version = await self.version_repo.get_version(version_id)
        practice = await self.practice_repo.get_practice(context.institution_id, UUID(version.practice_id))
        
        if version.status != "draft":
            raise ConflictError("Can only add exercises to draft versions")

        # Check for duplicate sequence
        exercises, _ = await self.exercise_repo.list_exercises(
            version_id=version_id,
            page=1,
            page_size=1000,
        )
        for ex in exercises:
            if ex.sequence == data.sequence:
                raise ConflictError("An exercise with this sequence already exists in the version")

        # Validate exercise type specific requirements
        await self._validate_exercise_data(data)

        exercise_data = data.model_dump()
        exercise_data["version_id"] = str(version_id)
        exercise_data["practice_id"] = str(version.practice_id)
        
        exercise = await self.exercise_repo.create_exercise(exercise_data)
        await self.session.commit()
        return exercise

    async def update_exercise(
        self,
        context: AuthorizationContext,
        exercise_id: UUID,
        data: ExerciseUpdate,
    ) -> Exercise:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to update exercises")

        exercise = await self.exercise_repo.get_exercise(exercise_id)
        version = await self.version_repo.get_version(UUID(exercise.version_id))
        
        if version.status != "draft":
            raise ConflictError("Can only update exercises in draft versions")

        update_data = data.model_dump(exclude_unset=True)

        # Check for duplicate sequence if changing
        if "sequence" in update_data:
            exercises, _ = await self.exercise_repo.list_exercises(
                version_id=UUID(exercise.version_id),
                page=1,
                page_size=1000,
            )
            for ex in exercises:
                if ex.id != exercise_id and ex.sequence == update_data["sequence"]:
                    raise ConflictError("An exercise with this sequence already exists in the version")

        # Validate exercise type if changing
        if "exercise_type" in update_data:
            await self._validate_exercise_type_change(exercise, update_data["exercise_type"])

        protected_fields = ["id", "version_id", "practice_id", "created_at"]
        for field in protected_fields:
            update_data.pop(field, None)

        exercise = await self.exercise_repo.update_exercise(exercise, update_data)
        await self.session.commit()
        return exercise

    async def delete_exercise(self, context: AuthorizationContext, exercise_id: UUID) -> None:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to delete exercises")

        exercise = await self.exercise_repo.get_exercise(exercise_id)
        version = await self.version_repo.get_version(UUID(exercise.version_id))
        
        if version.status != "draft":
            raise ConflictError("Can only delete exercises from draft versions")

        await self.exercise_repo.delete_exercise(exercise)
        await self.session.commit()

    async def reorder_exercises(
        self,
        context: AuthorizationContext,
        version_id: UUID,
        exercise_ids: List[UUID],
    ) -> List[Exercise]:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to reorder exercises")

        version = await self.version_repo.get_version(version_id)
        if version.status != "draft":
            raise ConflictError("Can only reorder exercises in draft versions")

        exercises = await self.exercise_repo.reorder_exercises(version_id, exercise_ids)
        await self.session.commit()
        return exercises

    async def add_option(
        self,
        context: AuthorizationContext,
        exercise_id: UUID,
        data: ExerciseOptionCreate,
    ) -> dict:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to add options")

        exercise = await self.exercise_repo.get_exercise(exercise_id)
        version = await self.version_repo.get_version(UUID(exercise.version_id))
        
        if version.status != "draft":
            raise ConflictError("Can only add options to exercises in draft versions")

        # Validate based on exercise type
        if exercise.exercise_type in ["single_choice", "true_false"]:
            if data.is_correct:
                # Check if there's already a correct option
                for opt in exercise.options:
                    if opt.is_correct:
                        raise ConflictError("Single choice and true/false exercises can only have one correct option")

        option_data = data.model_dump()
        option_data["exercise_id"] = str(exercise_id)
        
        option = await self.option_repo.create_option(option_data)
        await self.session.commit()
        return option

    async def update_option(
        self,
        context: AuthorizationContext,
        option_id: UUID,
        data: dict,
    ) -> dict:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to update options")

        option = await self.option_repo.get_option(option_id)
        if not option:
            raise NotFoundError("Option not found")
        
        exercise = await self.exercise_repo.get_exercise(UUID(option.exercise_id))
        version = await self.version_repo.get_version(UUID(exercise.version_id))
        
        if version.status != "draft":
            raise ConflictError("Can only update options in draft versions")

        # Validate correct option logic
        if "is_correct" in data and data["is_correct"]:
            if exercise.exercise_type in ["single_choice", "true_false"]:
                for opt in exercise.options:
                    if opt.id != option_id and opt.is_correct:
                        raise ConflictError("Single choice and true/false exercises can only have one correct option")

        option = await self.option_repo.update_option(option, data)
        await self.session.commit()
        return option

    async def delete_option(
        self,
        context: AuthorizationContext,
        option_id: UUID,
    ) -> None:
        if not has_permission(context, Permissions.CONTENT_UPDATE):
            raise ForbiddenError("Insufficient permissions to delete options")

        option = await self.option_repo.get_option(option_id)
        if not option:
            raise NotFoundError("Option not found")
        
        exercise = await self.exercise_repo.get_exercise(UUID(option.exercise_id))
        version = await self.version_repo.get_version(UUID(exercise.version_id))
        
        if version.status != "draft":
            raise ConflictError("Can only delete options from draft versions")

        await self.option_repo.delete_option(option)
        await self.session.commit()

    async def _validate_exercise_data(self, data: ExerciseCreate) -> None:
        """Validate exercise data based on type."""
        if data.exercise_type in ["single_choice", "true_false", "multiple_choice"]:
            if not data.content or "options" not in data.content:
                raise ValidationError(f"{data.exercise_type.value} exercises must have options in content")
            
            options = data.content.get("options", [])
            if len(options) < 2:
                raise ValidationError("Choice exercises must have at least 2 options")
            
            correct_count = sum(1 for opt in options if opt.get("is_correct"))
            if data.exercise_type in ["single_choice", "true_false"] and correct_count != 1:
                raise ValidationError(f"{data.exercise_type.value} exercises must have exactly one correct option")
            elif data.exercise_type == "multiple_choice" and correct_count == 0:
                raise ValidationError("Multiple choice exercises must have at least one correct option")

        elif data.exercise_type == "matching":
            if not data.content or "pairs" not in data.content:
                raise ValidationError("Matching exercises must have pairs in content")
            pairs = data.content.get("pairs", [])
            if len(pairs) < 2:
                raise ValidationError("Matching exercises must have at least 2 pairs")

        elif data.exercise_type == "ordering":
            if not data.content or "items" not in data.content:
                raise ValidationError("Ordering exercises must have items in content")
            items = data.content.get("items", [])
            if len(items) < 2:
                raise ValidationError("Ordering exercises must have at least 2 items")

        elif data.exercise_type == "numeric":
            if not data.content:
                raise ValidationError("Numeric exercises must have content with answer and tolerance")
            if "answer" not in data.content:
                raise ValidationError("Numeric exercises must have an answer")
            if "tolerance" not in data.content:
                data.content["tolerance"] = 0

        elif data.exercise_type == "fill_blank":
            if not data.content or "text" not in data.content:
                raise ValidationError("Fill blank exercises must have text with blanks")
            if "answers" not in data.content:
                raise ValidationError("Fill blank exercises must have answers for each blank")

        elif data.exercise_type == "classification":
            if not data.content or "categories" not in data.content or "items" not in data.content:
                raise ValidationError("Classification exercises must have categories and items")

    async def _validate_exercise_type_change(self, exercise: Exercise, new_type: str) -> None:
        """Validate that exercise type change is compatible with existing data."""
        if exercise.exercise_type.value == new_type:
            return
        
        # Check if existing options are compatible
        if exercise.exercise_type in ["single_choice", "true_false", "multiple_choice"]:
            if new_type not in ["single_choice", "true_false", "multiple_choice"]:
                raise ValidationError("Cannot change choice exercise to non-choice type with existing options")