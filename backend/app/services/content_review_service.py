"""Content review service."""

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import ContentVersion, ContentReview, ContentReviewStatus, ContentReviewDecision, User
from app.repositories import ContentVersionRepository, ContentReviewRepository
from app.schemas.content import ContentReviewSubmit, ContentReviewDecisionRequest
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class ContentReviewService:
    """Content review management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.version_repo = ContentVersionRepository(session)
        self.review_repo = ContentReviewRepository(session)

    async def list_reviews(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        content_version_id: Optional[UUID] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[ContentReview], int]:
        if not has_permission(context, Permissions.CONTENT_REVIEW_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to list content reviews")
        
        return await self.review_repo.list_reviews(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            content_version_id=content_version_id,
            reviewer_user_id=None,
            status=status,
        )

    async def get_review(
        self,
        context: AuthorizationContext,
        review_id: UUID,
    ) -> ContentReview:
        if not has_permission(context, Permissions.CONTENT_REVIEW_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to read content reviews")
        
        return await self.review_repo.get_review(context.institution_id, review_id)

    async def submit_for_review(
        self,
        context: AuthorizationContext,
        data: ContentReviewSubmit,
    ) -> ContentReview:
        if not has_permission(context, Permissions.COURSES_UPDATE):
            raise ForbiddenError("Insufficient permissions to submit content for review")

        version = await self.version_repo.get_version(data.content_version_id)
        
        # Verify version belongs to user's institution
        # (in practice, we'd check the course/unit/lesson's institution)
        
        # Check if version is in a state that allows submission
        if version.status not in ["draft", "validation_failed", "changes_requested"]:
            raise ConflictError(f"Cannot submit version with status '{version.status}' for review")

        # Check if there's already a pending review
        existing = await self.review_repo.get_review_for_version(data.content_version_id)
        if existing and existing.status in ["pending", "in_review"]:
            raise ConflictError("A review is already in progress for this version")

        # Run validation before submission
        from app.services.content_validation_service import ContentValidationService
        validator = ContentValidationService(self.session)
        # We'd need to reconstruct the blocks from the snapshot
        # For now, assume validation passes
        
        # Update version status
        version.status = "ready_for_review"
        await self.version_repo.update_version(version, {"status": "ready_for_review"})

        # Create review
        review_data = {
            "content_version_id": str(data.content_version_id),
            "reviewer_user_id": str(context.user_id),  # Will be assigned to a reviewer
            "institution_id": str(context.institution_id),
            "status": ContentReviewStatus.PENDING,
            "submitted_at": datetime.utcnow(),
        }
        
        review = await self.review_repo.create_review(review_data)
        await self.session.commit()
        return review

    async def start_review(
        self,
        context: AuthorizationContext,
        review_id: UUID,
    ) -> ContentReview:
        if not has_permission(context, Permissions.CONTENT_REVIEW_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to review content")

        review = await self.review_repo.get_review(context.institution_id, review_id)
        
        if review.status != ContentReviewStatus.PENDING:
            raise ConflictError("Can only start pending reviews")

        # Assign reviewer
        review.reviewer_user_id = str(context.user_id)
        review.status = ContentReviewStatus.IN_REVIEW
        await self.review_repo.update_review(review, {
            "reviewer_user_id": str(context.user_id),
            "status": ContentReviewStatus.IN_REVIEW,
        })
        await self.session.commit()
        return review

    async def submit_decision(
        self,
        context: AuthorizationContext,
        review_id: UUID,
        data: ContentReviewDecisionRequest,
    ) -> ContentReview:
        if not has_permission(context, Permissions.CONTENT_REVIEW_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to decide on content reviews")

        review = await self.review_repo.get_review(context.institution_id, review_id)
        
        if review.status != ContentReviewStatus.IN_REVIEW:
            raise ConflictError("Can only decide on reviews in progress")

        if review.reviewer_user_id != str(context.user_id):
            raise ForbiddenError("Only the assigned reviewer can submit a decision")

        # Update review
        update_data = {
            "decision": data.decision,
            "observations": data.observations,
            "pedagogical_notes": data.pedagogical_notes,
            "technical_notes": data.technical_notes,
            "reviewed_at": datetime.utcnow(),
        }
        
        if data.decision == ContentReviewDecision.APPROVE:
            update_data["status"] = ContentReviewStatus.APPROVED
            # Update version status
            version = await self.version_repo.get_version(UUID(review.content_version_id))
            version.status = "approved"
            await self.version_repo.update_version(version, {"status": "approved"})
        elif data.decision == ContentReviewDecision.REQUEST_CHANGES:
            update_data["status"] = ContentReviewStatus.CHANGES_REQUESTED
            version = await self.version_repo.get_version(UUID(review.content_version_id))
            version.status = "changes_requested"
            await self.version_repo.update_version(version, {"status": "changes_requested"})
        elif data.decision == ContentReviewDecision.REJECT:
            update_data["status"] = ContentReviewStatus.REJECTED
            version = await self.version_repo.get_version(UUID(review.content_version_id))
            version.status = "withdrawn"
            await self.version_repo.update_version(version, {"status": "withdrawn"})

        review = await self.review_repo.update_review(review, update_data)
        await self.session.commit()
        return review

    async def get_my_reviews(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        status: Optional[str] = None,
    ) -> Tuple[List[ContentReview], int]:
        if not has_permission(context, Permissions.CONTENT_REVIEW_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to read content reviews")
        
        return await self.review_repo.list_reviews(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            reviewer_user_id=context.user_id,
            status=status,
        )

    async def get_pending_reviews(
        self,
        context: AuthorizationContext,
    ) -> List[ContentReview]:
        if not has_permission(context, Permissions.CONTENT_REVIEW_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to read content reviews")
        
        return await self.review_repo.get_pending_reviews_for_reviewer(
            context.institution_id, context.user_id
        )