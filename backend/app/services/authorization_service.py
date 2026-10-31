"""Authorization service for RBAC and resource access control."""

from typing import List, Optional, Set
from uuid import UUID
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import User, Role, Permission, UserRole, RolePermission
from app.schemas.permission import Permissions


class AuthorizationService:
    """Service for checking permissions and authorization."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_user_permissions(
        self,
        user_id: UUID,
        institution_id: UUID
    ) -> Set[str]:
        """Get all effective permissions for a user in an institution."""
        # Get active user roles in the institution
        stmt = select(UserRole).where(
            and_(
                UserRole.user_id == str(user_id),
                UserRole.institution_id == str(institution_id),
                UserRole.is_active == True,
            )
        ).options(selectinload(UserRole.role).selectinload(Role.role_permissions).selectinload(RolePermission.permission))
        
        result = await self.session.execute(stmt)
        user_roles = result.scalars().all()
        
        permissions = set()
        for user_role in user_roles:
            role = user_role.role
            # Add role's direct permissions
            permissions.update(role.permissions or [])
            # Add permissions from role_permissions relationship
            for rp in role.role_permissions:
                if rp.permission:
                    permissions.add(rp.permission.code)
        
        return permissions
    
    async def get_user_roles(
        self,
        user_id: UUID,
        institution_id: UUID
    ) -> List[str]:
        """Get all active role codes for a user in an institution."""
        stmt = select(UserRole).where(
            and_(
                UserRole.user_id == str(user_id),
                UserRole.institution_id == str(institution_id),
                UserRole.is_active == True,
            )
        ).options(selectinload(UserRole.role))
        
        result = await self.session.execute(stmt)
        user_roles = result.scalars().all()
        
        return [ur.role.code for ur in user_roles if ur.role]
    
    async def has_permission(
        self,
        user_id: UUID,
        institution_id: UUID,
        permission_code: str
    ) -> bool:
        """Check if user has a specific permission in an institution."""
        permissions = await self.get_user_permissions(user_id, institution_id)
        return permission_code in permissions
    
    async def has_any_permission(
        self,
        user_id: UUID,
        institution_id: UUID,
        permission_codes: List[str]
    ) -> bool:
        """Check if user has any of the specified permissions."""
        permissions = await self.get_user_permissions(user_id, institution_id)
        return any(p in permissions for p in permission_codes)
    
    async def has_all_permissions(
        self,
        user_id: UUID,
        institution_id: UUID,
        permission_codes: List[str]
    ) -> bool:
        """Check if user has all of the specified permissions."""
        permissions = await self.get_user_permissions(user_id, institution_id)
        return all(p in permissions for p in permission_codes)
    
    async def can_access_institution(
        self,
        user_id: UUID,
        institution_id: UUID
    ) -> bool:
        """Check if user has any role in the institution."""
        roles = await self.get_user_roles(user_id, institution_id)
        return len(roles) > 0
    
    async def can_access_resource(
        self,
        user_id: UUID,
        institution_id: UUID,
        resource_type: str,
        resource_id: UUID,
        action: str
    ) -> bool:
        """Check if user can perform action on a specific resource.
        
        This implements resource-level authorization beyond RBAC.
        """
        # No generic ownership resolver exists. A permission name alone cannot
        # authorize an arbitrary resource ID. Use domain-specific scoped services.
        # This helper has no current consumers; fail closed for future callers.
        return False


# Dependency for FastAPI
async def get_authorization_service(session: AsyncSession) -> AuthorizationService:
    """FastAPI dependency for authorization service."""
    return AuthorizationService(session)
