"""Non-destructive foundation checks; no DB recreation fixture is loaded."""

import asyncio
import os
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest
from pydantic import ValidationError as SchemaError
from sqlalchemy.dialects import postgresql

from app.core.exceptions import ForbiddenError, ValidationError
from app.repositories.academic_access_repository import course_enrollment_query
from app.schemas.assessment import AssessmentAnswer, BooleanAnswer, CompetencyJudgmentInput, NumericAnswer
from app.services.academic_access_service import AcademicAccessService
from app.services.assessment_scoring_service import (
    ObjectiveScore, pending_manual_score, score_numeric, student_question, summarize_scores,
)


@pytest.mark.parametrize("field", ["score", "is_correct", "achievement_level", "reviewed_by", "finalized", "approved", "teacher_comment"])
def test_student_cannot_submit_privileged_fields(field):
    with pytest.raises(SchemaError):
        AssessmentAnswer(answer_data={}, expected_revision=1, **{field: True})


@pytest.mark.parametrize("value", ["true", "false", 0, 1])
def test_boolean_requires_actual_boolean(value):
    with pytest.raises(SchemaError):
        BooleanAnswer(value=value)


@pytest.mark.parametrize("value", ["NaN", "Infinity", "-Infinity", True, "not-a-number"])
def test_invalid_numeric_answers(value):
    with pytest.raises(ValidationError):
        score_numeric(value, "0.3", "0", 2)


def test_decimal_and_inclusive_tolerance():
    assert score_numeric("0,3", "0.3", "0", 2).earned == Decimal(2)
    assert score_numeric("0.31", "0.3", "0.01", 2).earned == Decimal(2)
    assert score_numeric("0.311", "0.3", "0.01", 2).earned == Decimal(0)
    with pytest.raises(ValidationError):
        score_numeric("1", "1", "-0.1", 2)


def test_numeric_schema_returns_controlled_validation_error():
    for value in ["NaN", "Infinity", "abc", "1,2,3"]:
        with pytest.raises(SchemaError):
            NumericAnswer(value=value)


def test_manual_review_not_an_incorrect_answer_or_achievement():
    summary = summarize_scores([score_numeric("1", "1", 0, 2), pending_manual_score(8)])
    assert summary["percentage"] == Decimal("100.00")
    assert summary["reviewed_maximum"] == 2
    assert summary["instrument_maximum"] == 10
    assert summary["pending_questions"] == 1
    assert summary["status"] == "pending_review"
    assert "achievement_level" not in summary
    assert summarize_scores([pending_manual_score(8)])["percentage"] is None


def test_student_presentation_removes_nested_secrets():
    question = SimpleNamespace(
        id=uuid4(), question_type="multiple_choice", prompt="Selecciona",
        options=[{"id": "a", "text": "Uno", "is_correct": True, "feedback": "solution", "metadata": {"secret": True}}],
        correct_answer={"id": "a"}, explanation="solution", settings={"secret": True},
    )
    assert student_question(question).model_dump()["options"] == [{"id": "a", "text": "Uno"}]


def test_competency_judgment_is_explicit_and_has_evidence():
    payload = dict(competency_id=uuid4(), academic_period_id=uuid4(), evidence_ids=[uuid4()],
                   achievement_level="B", justification="Evidencia revisada", expected_revision=1)
    assert CompetencyJudgmentInput(**payload).achievement_level == "B"
    with pytest.raises(SchemaError):
        CompetencyJudgmentInput(**payload, score=90)
    with pytest.raises(SchemaError):
        CompetencyJudgmentInput(**{**payload, "achievement_level": "90%"})
    with pytest.raises(SchemaError):
        CompetencyJudgmentInput(**{**payload, "evidence_ids": []})


@pytest.mark.parametrize("profile,owned", [(None, False), (True, False), (True, True)])
def test_ownership_fails_closed(profile, owned):
    student_id = uuid4()
    context = SimpleNamespace(user_id=uuid4(), institution_id=uuid4())
    attempt = SimpleNamespace(institution_id=context.institution_id,
                              student_profile_id=student_id if owned else uuid4())
    result = Mock()
    result.scalars.return_value.first.return_value = SimpleNamespace(id=student_id) if profile else None
    session = SimpleNamespace(execute=AsyncMock(return_value=result))
    operation = AcademicAccessService(session).require_owner(context, attempt)
    if owned:
        assert asyncio.run(operation).id == student_id
    else:
        with pytest.raises(ForbiddenError):
            asyncio.run(operation)


def test_enrollment_query_checks_real_offering_and_institution():
    query = course_enrollment_query(uuid4(), uuid4(), uuid4())
    sql = str(query.compile(dialect=postgresql.dialect()))
    for fragment in ["teacher_assignments", "academic_years", "classrooms.grade_id", "users.institution_id",
                     "enrollments.institution_id", "classrooms.institution_id", "academic_years.institution_id",
                     "enrollments.effective_date", "enrollments.ended_at", "EXISTS"]:
        assert fragment in sql


@pytest.mark.skipif(os.environ.get("AITHRON_ASSESSMENT_READONLY_DB") != "1",
                    reason="Requires explicit authorization for the configured read-only database")
def test_enrollment_query_executes_read_only_on_postgresql():
    # No create_all/drop_all, fixtures, seeding or commits. Random IDs cannot select a user.
    from sqlalchemy import text
    from app.db.engine import AsyncSessionLocal, async_engine

    async def verify():
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SET TRANSACTION READ ONLY"))
                assert (await session.execute(text("SELECT 1"))).scalar_one() == 1
                result = await session.execute(course_enrollment_query(uuid4(), uuid4(), uuid4()))
                assert result.scalars().first() is None
                await session.rollback()
        finally:
            await async_engine.dispose()

    asyncio.run(verify())


@pytest.mark.parametrize("value", ["1e999999", "1e-999999", "9" * 81])
def test_numeric_arithmetic_is_bounded(value):
    with pytest.raises(ValidationError):
        score_numeric(value, "1", "0", "2")


@pytest.mark.parametrize("earned,maximum", [
    (Decimal("NaN"), Decimal(2)),
    (Decimal(1), Decimal("Infinity")),
    (None, Decimal("NaN")),
    (Decimal(-1), Decimal(2)),
    (Decimal(3), Decimal(2)),
    (1.0, Decimal(2)),
])
def test_aggregate_rejects_invalid_internal_results(earned, maximum):
    with pytest.raises(ValidationError):
        summarize_scores([ObjectiveScore(earned, maximum, "scored")])


def test_numeric_tolerance_does_not_round_boundary_into_correct_answer():
    assert score_numeric("1.00000000000000000000000000001", "1", "0", "2").earned == 0
