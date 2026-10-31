"""Finite sync protocol: no arbitrary tables, scores or client identity."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SyncOperation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    client_operation_id: UUID
    operation_type: Literal["lesson.progress.complete"]
    schema_version: int = Field(strict=True, ge=1, le=1)
    resource_id: UUID
    lesson_version_id: UUID


class SyncBatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_account_id: UUID
    expected_institution_id: UUID
    operations: list[SyncOperation] = Field(min_length=1, max_length=25)

    @model_validator(mode="after")
    def distinct_operations(self):
        ids = [o.client_operation_id for o in self.operations]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate operation IDs in one batch are not permitted")
        return self


class SyncReceiptRead(BaseModel):
    client_operation_id: UUID
    status: Literal["applied", "already_applied", "rejected", "retryable", "conflict"]
    server_resource_id: UUID | None = None
    server_version: UUID | None = None
    confirmed_at: datetime | None = None
    error_code: str | None = None
