"""Institutional policies and atomic daily usage reservation, without prompt storage."""

from datetime import datetime, time, timedelta, timezone
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from app.core.exceptions import AithronException, ConflictError
from app.core.config import settings
from app.db.models.ai import AIServiceConfiguration, AIUsageEvent

DEFAULT_POLICY = dict(tutor_enabled=False, translation_enabled=False, dictionary_enabled=True, provider_approved=False,
    daily_user_limit=20, daily_institution_limit=200, max_input_characters=1000, max_output_tokens=256, revision=0)


class AIRepository:
    def __init__(self, session):
        self.session = session

    async def policy(self, institution_id, *, lock=False):
        if lock:
            await self.session.execute(insert(AIServiceConfiguration).values(institution_id=str(institution_id)).on_conflict_do_nothing(index_elements=["institution_id"]))
        query = select(AIServiceConfiguration).where(AIServiceConfiguration.institution_id == str(institution_id))
        if lock:
            query = query.with_for_update().execution_options(populate_existing=True)
        result = (await self.session.execute(query)).scalars().first()
        return result or SimpleNamespace(**DEFAULT_POLICY)

    async def reserve(self, context, operation_id, fingerprint, service, zone):
        policy = await self.policy(context.institution_id, lock=True)
        previous = (await self.session.execute(select(AIUsageEvent).where(
            AIUsageEvent.institution_id == str(context.institution_id), AIUsageEvent.user_id == str(context.user_id),
            AIUsageEvent.operation_id == str(operation_id)))).scalars().first()
        if previous:
            raise ConflictError("Operation already reserved or processed; responses are not retained and no automatic retry is performed")
        now = datetime.now(timezone.utc)
        lower = datetime.combine(now.astimezone(ZoneInfo(zone)).date(), time.min, ZoneInfo(zone))
        counts = (await self.session.execute(select(func.count().label("institution"),
            func.count().filter(AIUsageEvent.user_id == str(context.user_id)).label("user")).where(
            AIUsageEvent.institution_id == str(context.institution_id), AIUsageEvent.created_at >= lower))).one()
        if counts.institution >= policy.daily_institution_limit or counts.user >= policy.daily_user_limit:
            raise AithronException("Límite diario de solicitudes alcanzado", code="AI_USAGE_LIMIT", status_code=429)
        active = (await self.session.execute(select(func.count()).select_from(AIUsageEvent).where(
            AIUsageEvent.institution_id == str(context.institution_id), AIUsageEvent.status == "reserved",
            AIUsageEvent.created_at >= now-timedelta(seconds=2*settings.AI_TIMEOUT_SECONDS)))).scalar_one()
        if active >= settings.AI_MAX_INFLIGHT_PER_INSTITUTION:
            raise AithronException("Hay solicitudes en proceso; inténtalo más tarde", code="AI_INFLIGHT_LIMIT", status_code=429)
        event = AIUsageEvent(institution_id=str(context.institution_id), user_id=str(context.user_id), operation_id=str(operation_id),
            request_fingerprint=fingerprint, service=service, provider_code=settings.AI_PROVIDER_CODE, status="reserved", expires_at=now+timedelta(days=30))
        self.session.add(event)
        await self.session.flush()
        return event, policy
