"""Limited, opt-in protocol. Success is returned only after individual commit."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.endpoints.reports import private
from app.db.session import get_async_session_dependency
from app.core.config import settings
from app.core.exceptions import AithronException, ConflictError, ServiceUnavailableError
from app.dependencies.auth import get_authorization_context
from app.schemas.permission import AuthorizationContext
from app.schemas.sync import SyncBatch, SyncReceiptRead
from app.services.sync_service import SyncService

router = APIRouter(prefix="/sync", tags=["Sync"], dependencies=[Depends(private)])


async def sync_database():
    async for session in get_async_session_dependency():
        try:
            yield session
        except SQLAlchemyError:
            await session.rollback()
            raise ServiceUnavailableError("Sync persistence is unavailable") from None


def enabled():
    if not (settings.SYNC_ENABLED and settings.SYNC_PROTOCOL_V1_ENABLED):
        raise ServiceUnavailableError("Sync writes await isolated integration validation and operator authorization")


@router.get("/status")
async def status(context: AuthorizationContext = Depends(get_authorization_context), session=Depends(sync_database)):
    await SyncService(session).identity(context)
    return {"protocol_version": 1, "server_time": datetime.now(timezone.utc),
            "available": settings.SYNC_ENABLED and settings.SYNC_PROTOCOL_V1_ENABLED, "max_batch_operations": 25,
            "operation_types": ["lesson.progress.complete"] if settings.SYNC_ENABLED and settings.SYNC_PROTOCOL_V1_ENABLED else [],
            "packages": "not_available", "change_feed": "not_available"}


@router.get("/bootstrap", dependencies=[Depends(enabled)])
async def bootstrap(context: AuthorizationContext = Depends(get_authorization_context), session=Depends(sync_database)):
    await SyncService(session).authorize(context)
    return {"protocol_version": 1, "account_context_id": str(context.user_id),
            "institution_context_id": str(context.institution_id), "operation_types": ["lesson.progress.complete"],
            "max_batch_operations": 25, "change_feed": "not_available", "packages": "not_available"}


@router.post("/operations", dependencies=[Depends(enabled)], response_model=list[SyncReceiptRead])
async def operations(data: SyncBatch, context: AuthorizationContext = Depends(get_authorization_context), session=Depends(sync_database)):
    # Identity assertions are preconditions, never sources of authorization.
    if str(data.expected_account_id) != str(context.user_id) or str(data.expected_institution_id) != str(context.institution_id):
        raise ConflictError("Sync account context changed; pending work was not reassigned")
    results = []
    for operation in data.operations:
        try:
            receipt = await SyncService(session).apply(context, operation)
            await session.commit()
            results.append(receipt)
        except AithronException as error:
            await session.rollback()
            results.append(SyncReceiptRead(client_operation_id=operation.client_operation_id,
                status="conflict" if error.status_code == 409 else "retryable" if error.status_code >= 500 else "rejected",
                error_code=error.code))
        except SQLAlchemyError:
            await session.rollback()
            results.append(SyncReceiptRead(client_operation_id=operation.client_operation_id,
                status="retryable", error_code="SYNC_PERSISTENCE_UNAVAILABLE"))
    return results


@router.get("/operations/{operation_id}", dependencies=[Depends(enabled)], response_model=SyncReceiptRead)
async def receipt(operation_id: UUID, context: AuthorizationContext = Depends(get_authorization_context), session=Depends(sync_database)):
    return await SyncService(session).lookup(context, operation_id)
