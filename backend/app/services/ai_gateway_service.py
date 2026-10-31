"""Controlled local AI calls and real non-generative vocabulary/reference capabilities."""

from datetime import datetime, time, timedelta, timezone
import hashlib
import hmac
import json
import time as clock
from zoneinfo import ZoneInfo

from sqlalchemy import func, select

from app.core.config import settings
from app.core.exceptions import AithronException, ConflictError, ForbiddenError, NotFoundError, ServiceUnavailableError, ValidationError
from app.db.models import Assessment, AssessmentAttempt, Course, Institution, StudentProfile, User, UserStatus
from app.db.models.ai import AIUsageEvent, PronunciationSession
from app.providers import provider_registry
from app.providers.base_provider import ProviderFailure
from app.repositories.ai_repository import AIRepository, DEFAULT_POLICY
from app.repositories import dictionary_repository as dictionary
from app.schemas.ai import AIResult, Capability, UsageRead
from app.services.ai_context_service import AIContextService
from app.services.ai_safety_service import plain_text, validate_output, TUTOR_SYSTEM, TRANSLATION_SYSTEM


def permission(context, *codes):
    if not any(code in context.permissions for code in codes):
        raise ForbiddenError("Permiso de servicio IA requerido")


class AIGatewayService:
    def __init__(self, session):
        self.session = session
        self.repo = AIRepository(session)

    async def identity(self, context):
        institution = (await self.session.execute(select(Institution).join(User, User.institution_id == Institution.id).where(
            User.id == str(context.user_id), User.status == UserStatus.ACTIVE, User.institution_id == str(context.institution_id),
            Institution.status == "active"))).scalars().first()
        if institution is None:
            raise ForbiddenError("Se requiere una cuenta activa en la institución")
        return institution

    async def config(self, context, *, manage=False):
        permission(context, "ai.config.manage_institution" if manage else "ai.config.read_institution")
        await self.identity(context)
        policy = await self.repo.policy(context.institution_id)
        return {**{key: getattr(policy, key) for key in DEFAULT_POLICY}, "provider": settings.AI_PROVIDER_CODE or None,
            "operator_enabled": settings.AITHRON_AI_ENABLED, "local_only_attested": settings.AI_LOCAL_ONLY_ATTESTED,
            "conversation_retention": "disabled", "audio_upload": "not_available",
            "can_manage": "ai.config.manage_institution" in context.permissions}

    async def update_config(self, context, data):
        permission(context, "ai.config.manage_institution")
        await self.identity(context)
        policy = await self.repo.policy(context.institution_id, lock=True)
        if policy.revision != data.expected_revision:
            raise ConflictError("La configuración cambió; vuelve a consultarla")
        for key, value in data.model_dump(exclude={"expected_revision"}).items():
            setattr(policy, key, value)
        policy.revision += 1
        policy.updated_by_user_id = str(context.user_id)
        await self.session.commit()
        return {**{key: getattr(policy, key) for key in DEFAULT_POLICY}, "origin": "institution_policy"}

    async def capabilities(self, context):
        await self.identity(context)
        permission(context, "ai.tutor.use_own", "ai.tutor.use_assigned_context", "ai.translate.use_own", "ai.translate.use",
            "ai.dictionary.read", "ai.pronunciation.use_own", "ai.config.read_institution", "ai.config.manage_institution")
        policy = await self.repo.policy(context.institution_id)
        provider = provider_registry.configured_provider()
        online = None
        result = []
        for service, codes, enabled in (
            ("tutor", ("ai.tutor.use_own", "ai.tutor.use_assigned_context"), policy.tutor_enabled),
            ("translation", ("ai.translate.use_own", "ai.translate.use"), policy.translation_enabled),
        ):
            if not any(c in context.permissions for c in codes):
                state = "not_authorized"
            elif not enabled or not settings.AITHRON_AI_ENABLED:
                state = "disabled"
            elif not policy.provider_approved:
                state = "not_approved"
            elif provider is None:
                state = "provider_not_configured"
            elif ("generate_text" if service == "tutor" else "translate_text") not in provider.capabilities:
                state = "unsupported_by_provider"
            else:
                if online is None:
                    online = await provider.available()
                state = "available" if online else "temporarily_unavailable"
            result.append(Capability(service=service, state=state, origin="remote_model" if settings.AI_PROVIDER_CODE == "gemini_online" else "local_model", languages=["es", "en"]))
        local_state = "available" if policy.dictionary_enabled else "disabled"
        try:
            dictionary.entries()
        except ServiceUnavailableError:
            local_state = "resource_unavailable"
        result.append(Capability(service="dictionary", state=local_state if "ai.dictionary.read" in context.permissions else "not_authorized",
            origin="project_local_dictionary", languages=["es", "en"], reason="Vocabulario local limitado; no es generación ni traducción contextual"))
        result.append(Capability(service="pronunciation_reference", state=local_state if "ai.pronunciation.use_own" in context.permissions else "not_authorized",
            origin="reference_text", languages=["es", "en"], reason="Práctica sin análisis de audio; voz del dispositivo solo si existe"))
        for service in ("speech_recognition", "phonetic_analysis", "server_speech_synthesis"):
            result.append(Capability(service=service, state="provider_not_configured", origin="unavailable", languages=[]))
        return {"capabilities": [r.model_dump() for r in result], "conversation_retention": "disabled",
                "remote_sync": "not_available"}

    async def dictionary_access(self, context, *, pronunciation=False):
        permission(context, "ai.pronunciation.use_own" if pronunciation else "ai.dictionary.read")
        institution = await self.identity(context)
        if not (await self.repo.policy(context.institution_id)).dictionary_enabled:
            raise ServiceUnavailableError("El vocabulario local está deshabilitado por la institución")
        return institution

    async def generate(self, context, data, operation_id, *, service):
        institution = await self.identity(context)
        permission(context, *( ("ai.tutor.use_own", "ai.tutor.use_assigned_context") if service == "tutor"
            else ("ai.translate.use_own", "ai.translate.use")))
        policy = await self.repo.policy(context.institution_id)
        if not settings.AITHRON_AI_ENABLED or not getattr(policy, "tutor_enabled" if service == "tutor" else "translation_enabled") or not policy.provider_approved:
            raise ServiceUnavailableError("Servicio generativo deshabilitado o sin aprobación institucional")
        provider = provider_registry.configured_provider()
        if provider is None:
            raise ServiceUnavailableError("Proveedor no configurado o sin habilitación operativa")
        if ("generate_text" if service == "tutor" else "translate_text") not in provider.capabilities:
            raise ServiceUnavailableError("El proveedor configurado no admite este servicio")
        value = plain_text(data.text, maximum=min(policy.max_input_characters, 1500 if service == "tutor" else 1000))
        protected_attempt = (await self.session.execute(select(AssessmentAttempt.id).join(
            StudentProfile, AssessmentAttempt.student_id == StudentProfile.id).join(
            Assessment, AssessmentAttempt.assessment_id == Assessment.id).join(Course, Assessment.course_id == Course.id).where(
            StudentProfile.user_id == str(context.user_id), Course.institution_id == str(context.institution_id),
            AssessmentAttempt.status.in_(["in_progress", "started"]), AssessmentAttempt.submitted_at.is_(None),
        ).limit(1))).first()
        if protected_attempt:
            raise ForbiddenError("La ayuda generativa está suspendida mientras exista una evaluación en curso registrada; consulta a tu Monitor")
        sources = []
        if service == "tutor":
            educational_context, source = await AIContextService(self.session).resolve(context, data.lesson_id, data.classroom_id)
            payload = {"question": value, "action": data.action, "authorized_context": educational_context}
            sources = [source]
            system = TUTOR_SYSTEM
        else:
            payload = {"text": value, "source_language": data.source_language, "target_language": data.target_language}
            system = TRANSLATION_SYSTEM
        if not await provider.available():
            raise ServiceUnavailableError("El modelo configurado no está disponible")
        fingerprint = hmac.new(settings.SECRET_KEY.encode(), json.dumps(data.model_dump(mode="json"), sort_keys=True).encode(), hashlib.sha256).hexdigest()
        event, locked_policy = await self.repo.reserve(context, operation_id, fingerprint, service, institution.timezone)
        # Recheck policy while holding the quota lock: no concurrent disable bypass.
        if not getattr(locked_policy, "tutor_enabled" if service == "tutor" else "translation_enabled") or not locked_policy.provider_approved:
            await self.session.rollback()
            raise ServiceUnavailableError("La política institucional cambió")
        if len(value) > locked_policy.max_input_characters:
            await self.session.rollback()
            raise ValidationError("El límite institucional de texto cambió; acorta la consulta")
        max_tokens = locked_policy.max_output_tokens
        await self.session.commit()  # Durable reservation BEFORE any potentially costly model generation.
        start = clock.monotonic()
        try:
            generated = await provider.generate_text(system=system, payload=payload, max_tokens=max_tokens)
            event.input_units, event.output_units = generated.input_units, generated.output_units
            answer = validate_output(generated.text)
            event.status = "succeeded"
        except (ProviderFailure, ValidationError) as error:
            event.status = "invalid_output" if isinstance(error, ValidationError) else "provider_error"
            event.latency_ms = int((clock.monotonic()-start)*1000)
            await self.session.commit()
            raise ServiceUnavailableError("No se obtuvo una respuesta válida del modelo; no se realizó un reintento automático") from None
        event.latency_ms = int((clock.monotonic()-start)*1000)
        await self.session.commit()
        return AIResult(service=service, text=answer, origin="remote_model" if provider.code == "gemini_online" else "local_model", generated_at=datetime.now(timezone.utc), sources=sources,
            operation_id=operation_id, source_language=getattr(data, "source_language", None), target_language=getattr(data, "target_language", None))

    async def usage(self, context):
        permission(context, "ai.usage.read_own", "ai.tutor.use_own", "ai.tutor.use_assigned_context", "ai.translate.use_own", "ai.translate.use")
        institution = await self.identity(context)
        policy = await self.repo.policy(context.institution_id)
        lower = datetime.combine(datetime.now(ZoneInfo(institution.timezone)).date(), time.min, ZoneInfo(institution.timezone))
        count, input_units, output_units = (await self.session.execute(select(func.count(), func.sum(AIUsageEvent.input_units),
            func.sum(AIUsageEvent.output_units)).where(AIUsageEvent.institution_id == str(context.institution_id),
            AIUsageEvent.user_id == str(context.user_id), AIUsageEvent.created_at >= lower))).one()
        return UsageRead(requests_today=count, daily_limit=policy.daily_user_limit, input_units=input_units, output_units=output_units)

    async def begin_pronunciation(self, context, data):
        await self.dictionary_access(context, pronunciation=True)
        from app.services.academic_access_service import AcademicAccessService
        await AcademicAccessService(self.session).student(context)
        entry = dictionary.get_entry(data.dictionary_entry_id)
        await self.repo.policy(context.institution_id, lock=True)
        count = (await self.session.execute(select(func.count()).select_from(PronunciationSession).where(
            PronunciationSession.institution_id == str(context.institution_id), PronunciationSession.user_id == str(context.user_id),
            PronunciationSession.expires_at > datetime.now(timezone.utc)))).scalar_one()
        if count >= 20:
            raise AithronException("Límite de sesiones de referencia alcanzado", code="AI_USAGE_LIMIT", status_code=429)
        record = PronunciationSession(institution_id=str(context.institution_id), user_id=str(context.user_id),
            dictionary_entry_id=entry["id"], language=entry["to"], expires_at=datetime.now(timezone.utc)+timedelta(days=1))
        self.session.add(record)
        await self.session.flush()
        await self.session.commit()
        return await self.pronunciation(context, record.id)

    async def pronunciation(self, context, session_id):
        await self.dictionary_access(context, pronunciation=True)
        record = (await self.session.execute(select(PronunciationSession).where(PronunciationSession.id == str(session_id),
            PronunciationSession.institution_id == str(context.institution_id), PronunciationSession.user_id == str(context.user_id),
            PronunciationSession.expires_at > datetime.now(timezone.utc)))).scalars().first()
        if record is None:
            raise NotFoundError("Sesión de práctica no disponible")
        entry = dictionary.get_entry(record.dictionary_entry_id)
        return {"id": record.id, "reference_text": entry["translation"], "language": record.language,
            "status": "reference_only", "expires_at": record.expires_at,
            "audio_upload": "not_available", "transcription": None, "phonetic_score": None,
            "origin": "project_local_dictionary", "feedback": "Lee y repite voluntariamente; no se realiza análisis de pronunciación."}
