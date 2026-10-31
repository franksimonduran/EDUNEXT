"""Finite reports contract: no client SQL, institution overrides or implicit filters."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator


class ReportFilters(BaseModel):
    model_config = ConfigDict(extra="forbid")
    academic_year_id: UUID | None = None
    academic_period_id: UUID | None = None
    classroom_id: UUID | None = None
    course_id: UUID | None = None
    grade_id: UUID | None = None
    since: AwareDatetime | None = None
    until: AwareDatetime | None = None
    cutoff: AwareDatetime | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(25, ge=1, le=100)

    @model_validator(mode="after")
    def bounded_dates(self):
        if bool(self.since) != bool(self.until):
            raise ValueError("Both date boundaries are required")
        if self.since and (self.until < self.since or (self.until-self.since).days > 366):
            raise ValueError("History range must be ordered and at most 366 days")
        return self


class ReportMetric(BaseModel):
    id: str
    value: int | float | None
    unit: str
    numerator: int | None = None
    denominator: int | None = None
    data_status: str = "calculated_from_server_records"


class ReportMetadata(BaseModel):
    report_id: str
    definition_version: int = 1
    institution_id: UUID
    generated_at: datetime
    timezone: str
    filters: dict[str, Any]
    population_definition: str
    data_status: str
    sources: list[str]
    limitations: list[str] = Field(default_factory=list)
    official_document: bool = False


class ReportRead(BaseModel):
    metadata: ReportMetadata
    metrics: list[ReportMetric] = Field(default_factory=list)
    rows: list[dict[str, Any]] = Field(default_factory=list)
    columns: list[str] = Field(default_factory=list)
    total: int | None = None
    page: int = 1
    page_size: int = 25
    definitions: dict[str, Any] = Field(default_factory=dict)


class ReportExportInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    report_code: str = Field(min_length=3, max_length=80)
    format: Literal["csv"] = "csv"
    filters: ReportFilters = Field(default_factory=ReportFilters)

    @model_validator(mode="after")
    def bounded_export(self):
        if self.filters.page != 1:
            raise ValueError("Exports must start on page one")
        return self
