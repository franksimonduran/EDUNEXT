"""Content publication service."""

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import ContentVersion, ContentReview, ContentPublication, ContentPublicationStatus, ContentVisibility
from app.repositories import ContentVersionRepository, ContentReviewRepository, ContentPublicationRepository
from app.schemas.content import ContentPublicationCreate, ContentPublicationUpdate, ContentPublicationWithdraw
from app.schemas.permission import AuthorizationContext, Permissions
from app.services.academic_common import has_permission


class ContentPublicationService:
    """Content publication management service."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.version_repo = ContentVersionRepository(session)
        self.review_repo = ContentReviewRepository(session)
        self.publication_repo = ContentPublicationRepository(session)

    async def list_publications(
        self,
        context: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        content_version_id: Optional[UUID] = None,
        status: Optional[str] = None,
        visibility: Optional[str] = None,
    ) -> Tuple[List[ContentPublication], int]:
        if not has_permission(context, Permissions.CONTENT_PUBLISH_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to list content publications")
        
        return await self.publication_repo.list_publications(
            institution_id=context.institution_id,
            page=page,
            page_size=page_size,
            content_version_id=content_version_id,
            status=status,
            visibility=visibility,
        )

    async def get_publication(
        self,
        context: AuthorizationContext,
        publication_id: UUID,
    ) -> ContentPublication:
        if not has_permission(context, Permissions.CONTENT_PUBLISH_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to read content publications")
        
        return await self.publication_repo.get_publication(context.institution_id, publication_id)

    async def publish_version(
        self,
        context: AuthorizationContext,
        data: ContentPublicationCreate,
    ) -> ContentPublication:
        if not has_permission(context, Permissions.CONTENT_PUBLISH_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to publish content")

        version = await self.version_repo.get_version_with_relations(data.content_version_id)
        
        # Check if version is approved
        if version.status != "approved":
            raise ConflictError("Can only publish approved versions")

        # Check if there's an approved review
        approved_review = None
        for review in version.reviews:
            if review.status == "approved":
                approved_review = review
                break
        
        if not approved_review:
            raise ConflictError("No approved review found for this version")

        # Check if already published
        existing = await self.publication_repo.get_publication_for_version(data.content_version_id)
        if existing and existing.status == ContentPublicationStatus.PUBLISHED:
            raise ConflictError("This version is already published")

        # Create or update publication
        publication_data = data.model_dump()
        publication_data.update({
            "institution_id": str(context.institution_id),
            "published_by_user_id": str(context.user_id),
            "review_id": str(approved_review.id),
            "status": ContentPublicationStatus.PUBLISHED,
            "published_at": datetime.utcnow(),
        })

        if existing:
            # Update existing
            existing = await self.publication_repo.update_publication(existing, publication_data)
            publication = existing
        else:
            publication = await self.publication_repo.create_publication(publication_data)

        # Update version
        version.is_published = True
        version.published_at = datetime.utcnow()
        version.status = "published"
        await self.version_repo.update_version(version, {
            "is_published": True,
            "published_at": datetime.utcnow(),
            "status": "published",
        })

        await self.session.commit()
        return publication

    async def update_publication(
        self,
        context: AuthorizationContext,
        publication_id: UUID,
        data: ContentPublicationUpdate,
    ) -> ContentPublication:
        if not has_permission(context, Permissions.CONTENT_PUBLISH_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to update publications")

        publication = await self.publication_repo.get_publication(context.institution_id, publication_id)
        
        if publication.status != ContentPublicationStatus.PUBLISHED:
            raise ConflictError("Can only update published publications")

        update_data = data.model_dump(exclude_unset=True)
        
        # If visibility changed to shared, validate shared_institution_ids
        if "visibility" in update_data and update_data["visibility"] == ContentVisibility.SHARED:
            if not update_data.get("shared_institution_ids"):
                raise ValidationError("Shared publications must specify shared institution IDs")

        publication = await self.publication_repo.update_publication(publication, update_data)
        await self.session.commit()
        return publication

    async def withdraw_publication(
        self,
        context: AuthorizationContext,
        publication_id: UUID,
        data: ContentPublicationWithdraw,
    ) -> ContentPublication:
        if not has_permission(context, Permissions.CONTENT_PUBLISH_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to withdraw publications")

        publication = await self.publication_repo.get_publication(context.institution_id, publication_id)
        
        if publication.status != ContentPublicationStatus.PUBLISHED:
            raise ConflictError("Can only withdraw published publications")

        publication = await self.publication_repo.update_publication(publication, {
            "status": ContentPublicationStatus.WITHDRAWN,
            "withdrawn_at": datetime.utcnow(),
            "withdrawal_reason": data.withdrawal_reason,
        })

        # Update version
        version = await self.version_repo.get_version(UUID(publication.content_version_id))
        version.is_published = False
        version.status = "withdrawn"
        await self.version_repo.update_version(version, {
            "is_published": False,
            "status": "withdrawn",
        })

        await self.session.commit()
        return publication

    async def supersede_publication(
        self,
        context: AuthorizationContext,
        old_publication_id: UUID,
        new_version_id: UUID,
    ) -> ContentPublication:
        if not has_permission(context, Permissions.CONTENT_PUBLISH_INSTITUTION):
            raise ForbiddenError("Insufficient permissions to supersede publications")

        old_pub = await self.publication_repo.get_publication(context.institution_id, old_publication_id)
        new_version = await self.version_repo.get_version_with_relations(new_version_id)
        
        if old_pub.status != ContentPublicationStatus.PUBLISHED:
            raise ConflictError("Can only supersede published publications")
        
        if new_version.status != "approved":
            raise ConflictError("New version must be approved before superseding")

        # Supersede old publication
        old_pub = await self.publication_repo.update_publication(old_pub, {
            "status": ContentPublicationStatus.SUPERSEDED,
        })

        # Create new publication with same settings
        new_pub_data = {
            "content_version_id": str(new_version_id),
            "institution_id": str(context.institution_id),
            "published_by_user_id": str(context.user_id),
            "status": ContentPublicationStatus.PUBLISHED,
            "visibility": old_pub.visibility,
            "shared_institution_ids": old_pub.shared_institution_ids,
            "published_at": datetime.utcnow(),
        }
        
        new_pub = await self.publication_repo.create_publication(new_pub_data)

        # Update versions
        old_version = await self.version_repo.get_version(UUID(old_pub.content_version_id))
        old_version.is_published = False
        old_version.status = "superseded"
        await self.version_repo.update_version(old_version, {
            "is_published": False,
            "status": "superseded",
        })

        new_version.is_published = True
        new_version.published_at = datetime.utcnow()
        new_version.status = "published"
        await self.version_repo.update_version(new_version, {
            "is_published": True,
            "published_at": datetime.utcnow(),
            "status": "published",
        })

        await self.session.commit()
        return new_pub