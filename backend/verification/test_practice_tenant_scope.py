"""Read access to exercise/version IDs must remain inside the caller institution.

Uses synthetic IDs and repository mocks; full end-to-end tenancy remains pending.
"""

from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.core.exceptions import NotFoundError
from app.schemas.permission import Permissions
from app.services.exercise_service import ExerciseService
from app.services.practice_version_service import PracticeVersionService


def author_context():
    return SimpleNamespace(institution_id=uuid4(), permissions=[Permissions.CONTENT_READ])


@pytest.mark.asyncio
async def test_exercise_read_rejects_a_foreign_parent_practice():
    context = author_context()
    practice_id, exercise_id = uuid4(), uuid4()
    service = ExerciseService(None)
    service.exercise_repo.get_exercise_with_options = AsyncMock(
        return_value=SimpleNamespace(practice_id=str(practice_id))
    )
    service.practice_repo.get_practice = AsyncMock(
        side_effect=NotFoundError("Practice not found")
    )

    with pytest.raises(NotFoundError):
        await service.get_exercise(context, exercise_id)

    service.practice_repo.get_practice.assert_awaited_once_with(
        context.institution_id, practice_id
    )


@pytest.mark.asyncio
async def test_exercise_read_returns_only_after_parent_scope_check():
    context = author_context()
    practice_id, exercise_id = uuid4(), uuid4()
    exercise = SimpleNamespace(practice_id=str(practice_id))
    service = ExerciseService(None)
    service.exercise_repo.get_exercise_with_options = AsyncMock(return_value=exercise)
    service.practice_repo.get_practice = AsyncMock(return_value=SimpleNamespace(id=practice_id))

    assert await service.get_exercise(context, exercise_id) is exercise
    service.practice_repo.get_practice.assert_awaited_once_with(context.institution_id, practice_id)


@pytest.mark.asyncio
async def test_version_read_rejects_a_foreign_parent_practice():
    context = author_context()
    practice_id, version_id = uuid4(), uuid4()
    service = PracticeVersionService(None)
    service.version_repo.get_version_with_relations = AsyncMock(
        return_value=SimpleNamespace(practice_id=str(practice_id))
    )
    service.practice_repo.get_practice = AsyncMock(
        side_effect=NotFoundError("Practice not found")
    )

    with pytest.raises(NotFoundError):
        await service.get_version(context, version_id)

    service.practice_repo.get_practice.assert_awaited_once_with(
        context.institution_id, practice_id
    )


@pytest.mark.asyncio
async def test_version_read_returns_only_after_parent_scope_check():
    context = author_context()
    practice_id, version_id = uuid4(), uuid4()
    version = SimpleNamespace(practice_id=str(practice_id))
    service = PracticeVersionService(None)
    service.version_repo.get_version_with_relations = AsyncMock(return_value=version)
    service.practice_repo.get_practice = AsyncMock(return_value=SimpleNamespace(id=practice_id))

    assert await service.get_version(context, version_id) is version
    service.practice_repo.get_practice.assert_awaited_once_with(context.institution_id, practice_id)
