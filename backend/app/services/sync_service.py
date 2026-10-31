"""One whitelisted handler; progress and durable receipt share a transaction."""

from datetime import datetime, timezone
import hashlib
import json

from sqlalchemy import select

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.db.models import Institution, StudentProfile, User, UserStatus
from app.db.models.sync_receipt import SyncOperationReceipt
from app.repositories.sync_repository import SyncRepository
from app.schemas.sync import SyncReceiptRead
from app.services.progress_service import ProgressService, RECORD_PERMISSION


class SyncService:
    def __init__(self, session):
        self.session = session
        self.progress = ProgressService(session)
        self.repo = SyncRepository(session)

    async def identity(self, context):
        institution = (await self.session.execute(select(Institution.id).join(User,
            User.institution_id == Institution.id).where(User.id == str(context.user_id),
            Institution.id == str(context.institution_id), Institution.status == "active",
            User.status == UserStatus.ACTIVE))).first()
        if institution is None:
            raise ForbiddenError("Active institutional identity required")

    async def authorize(self, context):
        await self.identity(context)
        if RECORD_PERMISSION not in context.permissions:
            raise ForbiddenError("Explicit activity recording permission required")
        return await self.progress.student(context)

    async def apply(self, context, operation):
        student = await self.authorize(context)
        # Same lock/order as ProgressService: serializes duplicates across tabs/devices.
        await self.session.execute(select(StudentProfile.id).where(
            StudentProfile.id == str(student.id)).with_for_update())
        # Revalidate current authorized catalog even on retries; IDs are not permission.
        await self.progress.lesson(context, operation.resource_id)
        digest = hashlib.sha256(json.dumps(operation.model_dump(mode="json"), sort_keys=True,
                                           separators=(",", ":")).encode()).hexdigest()
        receipt = await self.repo.receipt(context, operation.client_operation_id)
        if receipt:
            if receipt.payload_digest != digest:
                raise ConflictError("Operation ID was used for different content")
            return self.read(receipt, repeated=True)
        result = await self.progress.record(context, operation.resource_id, operation.lesson_version_id, complete=True)
        receipt = SyncOperationReceipt(institution_id=str(context.institution_id), actor_user_id=str(context.user_id),
            client_operation_id=str(operation.client_operation_id), operation_type=operation.operation_type,
            payload_digest=digest, server_resource_id=str(result.lesson_id), server_version=str(result.lesson_version_id),
            applied_at=datetime.now(timezone.utc))
        self.session.add(receipt)
        await self.session.flush()
        return self.read(receipt)

    async def lookup(self, context, operation_id):
        await self.authorize(context)
        receipt = await self.repo.receipt(context, operation_id)
        if receipt is None:
            raise NotFoundError("Receipt not available")
        await self.progress.lesson(context, receipt.server_resource_id)
        return self.read(receipt, repeated=True)

    @staticmethod
    def read(receipt, *, repeated=False):
        return SyncReceiptRead(client_operation_id=receipt.client_operation_id,
            status="already_applied" if repeated else "applied", server_resource_id=receipt.server_resource_id,
            server_version=receipt.server_version, confirmed_at=receipt.applied_at)
