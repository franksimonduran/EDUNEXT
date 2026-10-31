"""Objective decimal scoring foundation, independent of competency achievement."""

from dataclasses import dataclass
from decimal import Decimal, DecimalException, InvalidOperation, localcontext

from app.core.exceptions import ValidationError
from app.schemas.assessment import StudentOption, StudentQuestion


def finite_decimal(value):
    if isinstance(value, bool):
        raise ValidationError("A boolean is not a numeric answer")
    try:
        parsed = Decimal(str(value).strip().replace(",", "."))
    except (InvalidOperation, ValueError):
        raise ValidationError("A valid decimal is required") from None
    if not parsed.is_finite():
        raise ValidationError("A finite decimal is required")
    # Bound arithmetic cost and precision before performing subtraction or division.
    if len(parsed.as_tuple().digits) > 80 or abs(parsed.as_tuple().exponent) > 80:
        raise ValidationError("Decimal precision or exponent exceeds the supported limit")
    return parsed


@dataclass(frozen=True)
class ObjectiveScore:
    earned: Decimal | None
    maximum: Decimal
    status: str


def score_numeric(answer, expected, tolerance, maximum):
    """Inclusive tolerance; decimal comma supported, no thousands separators."""
    maximum = finite_decimal(maximum)
    tolerance = finite_decimal(tolerance)
    if maximum <= 0 or tolerance < 0:
        raise ValidationError("Maximum must be positive and tolerance nonnegative")
    expected = finite_decimal(expected)
    if answer is None:
        return ObjectiveScore(Decimal(0), maximum, "unanswered")
    value = finite_decimal(answer)
    with localcontext() as context:
        context.prec = 250
        return ObjectiveScore(maximum if abs(value - expected) <= tolerance else Decimal(0), maximum, "scored")


def pending_manual_score(maximum):
    maximum = finite_decimal(maximum)
    if maximum <= 0:
        raise ValidationError("Maximum must be positive")
    return ObjectiveScore(None, maximum, "pending_review")


def summarize_scores(scores):
    """Pending questions are excluded from the reviewed denominator, not counted as wrong."""
    scores = list(scores)
    for score in scores:
        maximum = finite_decimal(score.maximum)
        earned = finite_decimal(score.earned) if score.earned is not None else None
        if not isinstance(score.maximum, Decimal) or (score.earned is not None and not isinstance(score.earned, Decimal)):
            raise ValidationError("Scoring results must use decimal values")
        if maximum <= 0 or (earned is not None and not Decimal(0) <= earned <= maximum):
            raise ValidationError("Invalid scoring result")
    with localcontext() as context:
        context.prec = 250
        try:
            return _summarize_validated_scores(scores)
        except DecimalException:
            raise ValidationError("Scoring totals exceed supported arithmetic limits") from None


def _summarize_validated_scores(scores):
    reviewed = [score for score in scores if score.earned is not None]
    earned = sum((score.earned for score in reviewed), Decimal(0))
    maximum = sum((score.maximum for score in reviewed), Decimal(0))
    return {
        "score": earned,
        "reviewed_maximum": maximum,
        "instrument_maximum": sum((score.maximum for score in scores), Decimal(0)),
        "percentage": (earned * 100 / maximum).quantize(Decimal("0.01")) if maximum else None,
        "reviewed_questions": len(reviewed),
        "pending_questions": len(scores) - len(reviewed),
        "status": "pending_review" if len(reviewed) != len(scores) else "reviewed",
    }


def student_question(question):
    """Build an allowlisted view even when nested options contain secret metadata."""
    return StudentQuestion(
        id=question.id,
        question_type=getattr(question.question_type, "value", question.question_type),
        prompt=question.prompt,
        options=[StudentOption(id=str(option["id"]), text=option["text"]) for option in question.options],
    )
