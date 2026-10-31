"""Strict public inputs. Provider/model/identity/grades are never client-controlled."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AIInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class TutorRequest(AIInput):
    text: str = Field(min_length=2, max_length=1500)
    lesson_id: UUID
    classroom_id: UUID | None = None
    action: Literal["explain", "hint", "example", "rephrase"] = "explain"


class TranslationRequest(AIInput):
    text: str = Field(min_length=1, max_length=1000)
    source_language: Literal["es", "en"]
    target_language: Literal["es", "en"]

    @model_validator(mode="after")
    def different_languages(self):
        if self.source_language == self.target_language:
            raise ValueError("Select different source and target languages")
        return self


class AIConfigurationUpdate(AIInput):
    expected_revision: int = Field(ge=0)
    tutor_enabled: bool
    translation_enabled: bool
    dictionary_enabled: bool
    provider_approved: bool
    daily_user_limit: int = Field(ge=1, le=100)
    daily_institution_limit: int = Field(ge=1, le=2000)
    max_input_characters: int = Field(ge=100, le=1500)
    max_output_tokens: int = Field(ge=32, le=512)


class ModelAnswer(AIInput):
    answer: str = Field(min_length=1, max_length=6000)


class AISource(BaseModel):
    lesson_id: UUID
    version_id: UUID
    course_id: UUID
    title: str


class AIResult(BaseModel):
    service: Literal["tutor", "translation"]
    text: str
    origin: Literal["local_model", "remote_model"] = "local_model"
    status: str = "generated_unverified"
    generated_at: datetime
    sources: list[AISource] = Field(default_factory=list)
    source_language: str | None = None
    target_language: str | None = None
    detected_language: str | None = None
    operation_id: UUID
    warning: str = "Contenido generado: puede contener errores. Verifica con tu Monitor."


class PronunciationCreate(AIInput):
    dictionary_entry_id: str = Field(min_length=2, max_length=80)


class Capability(BaseModel):
    service: str
    state: str
    origin: str
    languages: list[str]
    reason: str | None = None


class UsageRead(BaseModel):
    requests_today: int
    daily_limit: int
    input_units: int | None = None
    output_units: int | None = None
    estimated_cost: float | None = None
    currency: str | None = None
    retention_days: int = 30
