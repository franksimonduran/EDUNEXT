"""Read the existing project-authored resource as DATA, never execute JavaScript.

No commercial/third-party dictionary is imported. The source remains the existing
frontend vocabulary file, avoiding a divergent copy. Package it with backend deployments.
"""

import ast
from functools import lru_cache
from pathlib import Path
import re
import unicodedata

from app.core.exceptions import NotFoundError, ServiceUnavailableError

SOURCE = Path(__file__).resolve().parents[3]/"frontend/js/data/dictionary-demo.data.js"
FIELDS = {"id", "from", "to", "word", "translation", "category", "example", "exampleTranslation", "topic"}
PATTERN = re.compile(r"\b(id|from|to|word|translation|category|example|exampleTranslation|topic):\s*('(?:[^'\\]|\\.)*'|null)")


def normalize(text):
    return "".join(c for c in unicodedata.normalize("NFD", text.casefold().strip()) if not unicodedata.combining(c))


@lru_cache(maxsize=1)
def entries():
    try:
        if SOURCE.stat().st_size > 65536:
            raise ValueError("Resource too large")
        result = []
        for line in SOURCE.read_text(encoding="utf-8").splitlines():
            if not line.strip().startswith("{ id:"):
                continue
            raw = dict(PATTERN.findall(line))
            if set(raw) != FIELDS:
                raise ValueError("Unexpected dictionary format")
            entry = {key: None if value == "null" else ast.literal_eval(value) for key, value in raw.items()}
            if entry["from"] not in {"es", "en"} or entry["to"] not in {"es", "en"}:
                continue
            result.append(entry)
        if not result or len({e["id"] for e in result}) != len(result):
            raise ValueError("Invalid dictionary")
        return tuple(result)
    except (OSError, ValueError, SyntaxError):
        raise ServiceUnavailableError("El recurso local de vocabulario no está disponible") from None


def entry_read(entry):
    return {**entry, "origin": "project_local_dictionary", "version": "phase8-v1",
        "source": "EDUNEXT project-authored curated vocabulary",
        "license_status": "No third-party dataset imported; project redistribution terms not separately declared",
        "generated_by_ai": False, "coverage": "Limited curated examples, not a comprehensive dictionary"}


def get_entry(entry_id):
    match = next((entry for entry in entries() if entry["id"] == entry_id), None)
    if match is None:
        raise NotFoundError("Entrada no disponible")
    return entry_read(match)


def search(query, language, page, page_size):
    target = normalize(query)
    rows = [entry for entry in entries() if entry["from"] == language and normalize(entry["word"]).startswith(target)]
    rows.sort(key=lambda e: (normalize(e["word"]) != target, normalize(e["word"]), e["id"]))
    return {"items": [entry_read(e) for e in rows[(page-1)*page_size:page*page_size]],
            "total": len(rows), "page": page, "page_size": page_size, "origin": "project_local_dictionary"}
