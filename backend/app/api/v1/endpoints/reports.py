"""Finite report routes; queries are delegated and all outputs remain private."""

from fastapi import APIRouter, Depends, Request, Response
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

from app.core.exceptions import ServiceUnavailableError, ValidationError
from app.db.session import get_async_session_dependency
from app.dependencies.auth import get_authorization_context
from app.exporters.csv_exporter import export_csv
from app.schemas.permission import AuthorizationContext
from app.schemas.report import ReportExportInput, ReportFilters, ReportRead
from app.services.report_service import ReportService


def private(response: Response):
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["Vary"] = "Authorization, Cookie"
    response.headers["X-Content-Type-Options"] = "nosniff"


async def report_database():
    async for session in get_async_session_dependency():
        try:
            # Reports use a consistent transaction snapshot across counts and pages.
            await session.connection(execution_options={"isolation_level": "REPEATABLE READ"})
            await session.execute(text("SET LOCAL statement_timeout = '10000ms'"))
            yield session
        except SQLAlchemyError:
            await session.rollback()
            raise ServiceUnavailableError("Report data or audit persistence is unavailable") from None


def report_filters(request: Request):
    if any(len(request.query_params.getlist(key)) != 1 for key in request.query_params):
        raise ValidationError("Repeated report filters are not permitted")
    try:
        return ReportFilters.model_validate(dict(request.query_params))
    except PydanticValidationError:
        raise ValidationError("Invalid or unsupported report filters") from None


router = APIRouter(prefix="/reports", tags=["Reports"], dependencies=[Depends(private)])
FILTER_DOCS = [{"name": name, "in": "query", "required": False,
                "schema": prop.get("anyOf", [prop])[0]} for name, prop in ReportFilters.model_json_schema()["properties"].items()]


@router.get("/catalog")
async def catalog(context: AuthorizationContext = Depends(get_authorization_context), session=Depends(report_database)):
    return await ReportService(session).catalog(context)


@router.post("/exports")
async def create_export(data: ReportExportInput, context: AuthorizationContext = Depends(get_authorization_context), session=Depends(report_database)):
    report = await ReportService(session).generate(context, data.report_code, data.filters, exporting=True)
    content = export_csv(report)
    await session.commit()
    name = f"aithron-{report.metadata.report_id.replace('.', '-')}-{report.metadata.generated_at:%Y%m%dT%H%M%SZ}.csv"
    return Response(content=content, media_type="text/csv; charset=utf-8", headers={
        "Content-Disposition": f'attachment; filename="{name}"', "Cache-Control": "private, no-store",
        "Vary": "Authorization, Cookie", "X-Content-Type-Options": "nosniff"})


@router.get("/monitor/context")
async def monitor_context(filters: ReportFilters = Depends(report_filters), context: AuthorizationContext = Depends(get_authorization_context), session=Depends(report_database)):
    from app.services.planner_access_service import PlannerAccessService
    return await PlannerAccessService(session).teaching_contexts(context, page=filters.page, page_size=filters.page_size,
        permission_code="reports.read_assigned")


@router.get("/institution/context")
async def institution_context(context: AuthorizationContext = Depends(get_authorization_context), session=Depends(report_database)):
    return await ReportService(session).academic_contexts(context)


@router.get("/{scope}/{kind}", response_model=ReportRead, openapi_extra={"parameters": FILTER_DOCS})
async def read_report(scope: str, kind: str, filters: ReportFilters = Depends(report_filters),
                      context: AuthorizationContext = Depends(get_authorization_context), session=Depends(report_database)):
    result = await ReportService(session).generate(context, f"{scope}.{kind}", filters)
    await session.commit()
    return result
