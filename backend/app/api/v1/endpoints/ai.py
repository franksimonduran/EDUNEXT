"""AI Gateway boundary: authorized local inference and explicitly non-AI resources."""

from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Response
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import NotFoundError, ServiceUnavailableError
from app.db.models.ai import AIUsageEvent
from app.db.session import get_async_session_dependency
from app.dependencies.auth import get_authorization_context
from app.repositories import dictionary_repository as dictionary
from app.schemas.ai import AIConfigurationUpdate, AIResult, PronunciationCreate, TranslationRequest, TutorRequest, UsageRead
from app.schemas.permission import AuthorizationContext
from app.services.ai_context_service import AIContextService
from app.services.ai_gateway_service import AIGatewayService, permission


def private(response: Response):
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["Vary"] = "Authorization, Cookie"
    response.headers["X-Content-Type-Options"] = "nosniff"


async def ai_database():
    async for session in get_async_session_dependency():
        try:
            yield session
        except SQLAlchemyError:
            await session.rollback()
            raise ServiceUnavailableError("La persistencia del servicio IA no está disponible") from None


router = APIRouter(prefix="/ai", tags=["EDUNEXT AI"], dependencies=[Depends(private)])
Auth = Depends(get_authorization_context)
Database = Depends(ai_database)


@router.get("/capabilities")
@router.get("/status")
async def capabilities(context: AuthorizationContext = Auth, session=Database):
    return await AIGatewayService(session).capabilities(context)


@router.get("/configuration")
async def configuration(context: AuthorizationContext = Auth, session=Database):
    return await AIGatewayService(session).config(context)


@router.patch("/configuration")
async def configure(data: AIConfigurationUpdate, context: AuthorizationContext = Auth, session=Database):
    return await AIGatewayService(session).update_config(context, data)


@router.get("/tutor/contexts")
async def tutor_contexts(classroom_id: UUID | None = None, context: AuthorizationContext = Auth, session=Database):
    await AIGatewayService(session).identity(context)
    rows = await AIContextService(session).catalog(context, classroom_id=classroom_id)
    return {"items": [{"lesson_id": r.lesson_id, "version_id": r.version_id, "course_id": r.course_id,
                       "title": r.snapshot.get("title", "Lección publicada")} for r in rows], "limit": 100}


@router.post("/tutor/messages", response_model=AIResult)
async def tutor(data: TutorRequest, operation_id: UUID = Header(alias="Idempotency-Key"), context: AuthorizationContext = Auth, session=Database):
    return await AIGatewayService(session).generate(context, data, operation_id, service="tutor")


@router.get("/tutor/conversations")
async def conversations(context: AuthorizationContext = Auth, session=Database):
    permission(context, "ai.tutor.use_own", "ai.tutor.use_assigned_context")
    await AIGatewayService(session).identity(context)
    return {"items": [], "total": 0, "retention": "disabled", "reason": "No se guardan preguntas ni respuestas en servidor"}


@router.get("/tutor/conversations/{conversation_id}")
async def conversation(conversation_id: UUID, context: AuthorizationContext = Auth, session=Database):
    permission(context, "ai.tutor.use_own", "ai.tutor.use_assigned_context")
    await AIGatewayService(session).identity(context)
    raise NotFoundError("El historial de conversaciones no está habilitado")


@router.post("/translate", response_model=AIResult)
async def translate(data: TranslationRequest, operation_id: UUID = Header(alias="Idempotency-Key"), context: AuthorizationContext = Auth, session=Database):
    return await AIGatewayService(session).generate(context, data, operation_id, service="translation")


@router.get("/dictionary/search")
async def dictionary_search(q: str = Query(min_length=1, max_length=80), language: Literal["es", "en"] = "es",
                            page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=50),
                            context: AuthorizationContext = Auth, session=Database):
    await AIGatewayService(session).dictionary_access(context)
    return dictionary.search(q, language, page, page_size)


@router.get("/dictionary/entries/{entry_id}")
async def dictionary_entry(entry_id: str, context: AuthorizationContext = Auth, session=Database):
    await AIGatewayService(session).dictionary_access(context)
    return dictionary.get_entry(entry_id)


@router.post("/pronunciation/sessions", status_code=201)
async def pronunciation_begin(data: PronunciationCreate, context: AuthorizationContext = Auth, session=Database):
    return await AIGatewayService(session).begin_pronunciation(context, data)


@router.get("/pronunciation/references")
async def pronunciation_references(context: AuthorizationContext = Auth, session=Database):
    await AIGatewayService(session).dictionary_access(context, pronunciation=True)
    return dictionary.search("", "es", 1, 50)


@router.get("/pronunciation/references/{entry_id}")
async def pronunciation_reference(entry_id: str, context: AuthorizationContext = Auth, session=Database):
    await AIGatewayService(session).dictionary_access(context, pronunciation=True)
    return dictionary.get_entry(entry_id)


@router.get("/pronunciation/sessions/{session_id}")
async def pronunciation_read(session_id: UUID, context: AuthorizationContext = Auth, session=Database):
    return await AIGatewayService(session).pronunciation(context, session_id)


@router.post("/pronunciation/sessions/{session_id}/attempts")
async def pronunciation_attempt(session_id: UUID, context: AuthorizationContext = Auth, session=Database):
    await AIGatewayService(session).pronunciation(context, session_id)
    # No audio is read or persisted without an operational, authorized speech engine.
    raise ServiceUnavailableError("No hay reconocimiento de voz ni análisis fonético configurado; no se recibe audio")


@router.get("/usage/me", response_model=UsageRead)
async def usage(context: AuthorizationContext = Auth, session=Database):
    return await AIGatewayService(session).usage(context)


@router.get("/usage/institution")
async def institutional_usage(context: AuthorizationContext = Auth, session=Database):
    permission(context, "ai.usage.read_institution_aggregates")
    await AIGatewayService(session).identity(context)
    count, people = (await session.execute(select(func.count(), func.count(func.distinct(AIUsageEvent.user_id))).where(
        AIUsageEvent.institution_id == str(context.institution_id)))).one()
    if 0 < people < 5:
        return {"requests": None, "data_status": "suppressed_small_cohort", "estimated_cost": None}
    return {"requests": count, "data_status": "confirmed_technical_metadata" if count else "no_records",
            "estimated_cost": None, "contents": "not_stored", "scope": "retained institution events"}
