"""Code-owned descriptive rules. No SQL, personal inference or executable parameters."""

from dataclasses import dataclass
from hashlib import sha256
import json


@dataclass(frozen=True)
class InsightRule:
    code: str
    report_code: str
    metric: str
    explanation: str
    suggestion: str
    version: int = 1


RULES = (
    InsightRule("tasks.pending", "me.activities", "pending_count",
                "Hay {count} destinatarios-tarea con entrega o revisión solicitada pendiente.",
                "Puedes consultar las instrucciones y el estado de la tarea."),
    InsightRule("tasks.review_pending", "monitor.assignments", "review_pending_count",
                "Hay {count} entregas pendientes de revisión docente.",
                "Puedes abrir las entregas desde el módulo de tareas."),
    InsightRule("content.no_published_lessons", "institution.courses", "published_applicable_lessons_count",
                "Este curso no tiene lecciones publicadas aplicables en el catálogo consultado.",
                "Puedes revisar el flujo editorial del curso."),
)


def evaluate(rule, value):
    """None means no verified condition, never a negative personal judgment."""
    if type(value) is not int or value < 0:
        return {"data_status": "insufficient_data", "observed_value": None,
                "explanation": "La fuente no proporciona un conteo entero válido.", "suggestion": None}
    matched = value == 0 if rule.code == "content.no_published_lessons" else value > 0
    if not matched:
        return None
    return {"data_status": "available", "observed_value": value,
            "explanation": rule.explanation.format(count=value), "suggestion": rule.suggestion}


def insight_id(institution_id, rule, filters, reference, definition_version, value):
    """Stable snapshot identity, not an authorization token or persistent review ID."""
    payload = [str(institution_id), rule.code, rule.version, filters, str(reference), definition_version, value]
    return sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()
