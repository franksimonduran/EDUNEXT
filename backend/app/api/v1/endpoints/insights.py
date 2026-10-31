"""Read-only Insights using Reports authorization, snapshot and privacy controls."""

from fastapi import APIRouter, Depends

from app.api.v1.endpoints.reports import FILTER_DOCS, private, report_database, report_filters
from app.dependencies.auth import get_authorization_context
from app.schemas.permission import AuthorizationContext
from app.schemas.report import ReportFilters
from app.services.insights_service import InsightsService

router = APIRouter(prefix="/insights", tags=["Insights"], dependencies=[Depends(private)])


@router.get("/rules/catalog")
async def catalog(context: AuthorizationContext = Depends(get_authorization_context), session=Depends(report_database)):
    return await InsightsService(session).catalog(context)


@router.get("/{scope}/{kind}", openapi_extra={"parameters": FILTER_DOCS})
async def read_insights(scope: str, kind: str, filters: ReportFilters = Depends(report_filters),
                        context: AuthorizationContext = Depends(get_authorization_context), session=Depends(report_database)):
    result = await InsightsService(session).generate(context, scope, kind, filters)
    await session.commit()  # Reuse Reports access audit; never change academic records.
    return result
