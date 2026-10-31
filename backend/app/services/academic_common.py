"""Shared helpers for academic organization services."""

import hashlib
import json
import math
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import (
    AcademicIdempotencyRecord,
    Grade,
    MonitorProfile,
    TeacherAssignment,
    User,
)
from app.schemas.permission import AuthorizationContext, Permissions


IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60


def pages(total: int, page_size: int) -> int:
    return math.ceil(total / page_size) if total else 0


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def has_permission(context: AuthorizationContext, permission: str) -> bool:
    return permission in context.permissions


def has_any_permission(context: AuthorizationContext, *permissions: str) -> bool:
    return any(permission in context.permissions for permission in permissions)


def require_institution_admin(context: AuthorizationContext) -> None:
    if not has_any_permission(
        context,
        Permissions.CLASSROOMS_MANAGE_INSTITUTION,
        Permissions.ENROLLMENTS_MANAGE_INSTITUTION,
        Permissions.USERS_MANAGE_INSTITUTION,
        Permissions.INSTITUTIONS_MANAGE,
    ):
        raise ForbiddenError("Institution administration permission required")


async def get_grade(
    session: AsyncSession,
    grade_id: UUID,
    *,
    require_active: bool = True,
) -> Grade:
    grade = (
        await session.execute(select(Grade).where(Grade.id == str(grade_id)))
    ).scalars().first()
    if not grade:
        raise NotFoundError("Grade not found")
    if require_active and grade.status != "active":
        raise ConflictError("Grade is not active")
    return grade


async def get_monitor_profile(
    session: AsyncSession,
    institution_id: UUID,
    user_id: UUID,
) -> MonitorProfile:
    stmt = (
        select(MonitorProfile)
        .join(User, MonitorProfile.user_id == User.id)
        .where(
            MonitorProfile.user_id == str(user_id),
            User.institution_id == str(institution_id),
        )
    )
    monitor = (await session.execute(stmt)).scalars().first()
    if not monitor:
        raise ForbiddenError("An active monitor profile is required")
    return monitor


async def assigned_classroom_ids(
    session: AsyncSession,
    institution_id: UUID,
    user_id: UUID,
) -> list[str]:
    stmt = (
        select(TeacherAssignment.classroom_id)
        .join(MonitorProfile, TeacherAssignment.monitor_id == MonitorProfile.id)
        .join(User, MonitorProfile.user_id == User.id)
        .where(
            TeacherAssignment.institution_id == str(institution_id),
            TeacherAssignment.status == "active",
            User.id == str(user_id),
        )
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [str(row) for row in rows]


def _fingerprint(payload: dict[str, Any]) -> str:
    serialized = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


async def find_idempotent_result(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    operation: str,
    key: Optional[str],
    payload: dict[str, Any],
) -> Optional[UUID]:
    if not key:
        return None
    if len(key) > 128:
        raise ValidationError("Idempotency-Key is too long")

    record = (
        await session.execute(
            select(AcademicIdempotencyRecord).where(
                AcademicIdempotencyRecord.institution_id == str(context.institution_id),
                AcademicIdempotencyRecord.actor_user_id == str(context.user_id),
                AcademicIdempotencyRecord.operation == operation,
                AcademicIdempotencyRecord.idempotency_key == key,
            )
        )
    ).scalars().first()
    if not record:
        return None

    if record.expires_at <= now_utc():
        await session.delete(record)
        await session.flush()
        return None

    if record.request_fingerprint != _fingerprint(payload):
        raise ConflictError("Idempotency-Key was already used with a different request")
    return UUID(record.resource_id)


async def record_idempotency(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    operation: str,
    key: Optional[str],
    payload: dict[str, Any],
    resource_type: str,
    resource_id: UUID,
) -> None:
    if not key:
        return
    session.add(
        AcademicIdempotencyRecord(
            institution_id=str(context.institution_id),
            actor_user_id=str(context.user_id),
            operation=operation,
            idempotency_key=key,
            request_fingerprint=_fingerprint(payload),
            resource_type=resource_type,
            resource_id=str(resource_id),
            expires_at=now_utc() + timedelta(seconds=IDEMPOTENCY_TTL_SECONDS),
        )
    )
    try:
        await session.flush()
    except IntegrityError as exc:
        raise ConflictError("Idempotency-Key is already being processed") from exc


def generated_idempotency_key() -> str:
    return uuid4().hex
