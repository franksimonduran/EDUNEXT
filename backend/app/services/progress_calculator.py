"""Deterministic completion arithmetic, independent of instrument scores."""

import hashlib
from decimal import Decimal, ROUND_HALF_UP

from app.core.exceptions import ValidationError


ACHIEVEMENTS = (
    {"code": "first_lesson", "name": "Primera lección revisada", "description": "Una lección marcada como revisada; no acredita dominio.", "threshold": 1},
    {"code": "five_lessons", "name": "Cinco lecciones revisadas", "description": "Cinco lecciones distintas marcadas como revisadas; no es una calificación.", "threshold": 5},
)


def completion_percentage(completed, applicable):
    if completed < 0 or applicable < 0 or completed > applicable:
        raise ValidationError("Invalid lesson completion counts")
    if not applicable:
        return None
    return float((Decimal(completed) * 100 / Decimal(applicable)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def catalog_reference(versions):
    # Hash of real stable/version identifiers, not a claim about binary integrity.
    pairs = sorted((str(lesson_id), str(version_id)) for lesson_id, version_id in versions)
    return hashlib.sha256("\n".join(f"{a}:{b}" for a, b in pairs).encode()).hexdigest()
