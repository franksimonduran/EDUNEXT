"""Scoped receipt queries. All callers hold the existing student profile lock."""

from sqlalchemy import select

from app.db.models.sync_receipt import SyncOperationReceipt


class SyncRepository:
    def __init__(self, session):
        self.session = session

    async def receipt(self, context, operation_id):
        return (await self.session.execute(select(SyncOperationReceipt).where(
            SyncOperationReceipt.institution_id == str(context.institution_id),
            SyncOperationReceipt.actor_user_id == str(context.user_id),
            SyncOperationReceipt.client_operation_id == str(operation_id),
        ))).scalars().first()
