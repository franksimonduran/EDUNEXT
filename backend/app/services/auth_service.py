"""Authentication service for login, session management, and token operations."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, List
from uuid import UUID

from sqlalchemy import select, and_, or_, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import (
    User,
    UserStatus,
    UserCredential,
    CredentialStatus,
    StudentProfile,
    AuthSession,
    RefreshToken,
    SecurityEvent,
    SessionStatus,
    RefreshTokenStatus,
    SecurityEventType,
    SecurityEventSeverity,
)
from app.core.security import (
    verify_password,
    hash_password,
    needs_rehash,
    create_access_token,
    generate_refresh_token,
    hash_token,
    create_csrf_token_pair,
    verify_csrf_token,
    verify_signed_csrf_token,
)
from app.core.config import settings
from app.core.password_policy import validate_password, DEFAULT_POLICY, STUDENT_POLICY, ADMIN_POLICY
from app.services.authorization_service import AuthorizationService


DUMMY_PASSWORD_HASH = hash_password(secrets.token_urlsafe(24))


class AuthServiceError(Exception):
    """Raised when an authentication operation cannot be completed."""


class AuthService:
    """Service for authentication operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    @staticmethod
    def _identifier_hash(identifier: str) -> str:
        return hashlib.sha256(identifier.strip().lower().encode()).hexdigest()

    async def authenticate_user(
        self,
        identifier: str,
        password: str,
        institution_id: Optional[UUID] = None,
    ) -> Tuple[Optional[User], Optional[str]]:
        """Authenticate a user by email, username, or student code."""
        normalized = identifier.strip().lower()

        stmt = (
            select(User)
            .outerjoin(StudentProfile, StudentProfile.user_id == User.id)
            .where(
                or_(
                    func.lower(User.email) == normalized,
                    func.lower(User.username) == normalized,
                    func.lower(StudentProfile.student_code) == normalized,
                )
            )
        )
        if institution_id:
            stmt = stmt.where(User.institution_id == str(institution_id))

        result = await self.session.execute(stmt)
        user = result.scalars().first()

        if not user:
            verify_password(password, DUMMY_PASSWORD_HASH)
            await self._log_security_event(
                event_type=SecurityEventType.LOGIN_FAILED,
                severity=SecurityEventSeverity.WARNING,
                user_id=None,
                institution_id=institution_id,
                description="Login attempt with unknown identifier",
                metadata={"identifier_hash": self._identifier_hash(identifier)},
            )
            await self.session.commit()
            return None, "Invalid credentials"

        now = datetime.now(timezone.utc)

        if user.status != UserStatus.ACTIVE:
            verify_password(password, DUMMY_PASSWORD_HASH)
            await self._log_security_event(
                event_type=SecurityEventType.LOGIN_FAILED,
                severity=SecurityEventSeverity.WARNING,
                user_id=user.id,
                institution_id=user.institution_id,
                description="Login attempt on inactive account",
                metadata={"status": user.status.value},
            )
            await self.session.commit()
            return None, "Invalid credentials"

        cred_stmt = select(UserCredential).where(UserCredential.user_id == user.id)
        cred_result = await self.session.execute(cred_stmt)
        credential = cred_result.scalars().first()

        if not credential:
            verify_password(password, DUMMY_PASSWORD_HASH)
            await self._log_security_event(
                event_type=SecurityEventType.LOGIN_FAILED,
                severity=SecurityEventSeverity.WARNING,
                user_id=user.id,
                institution_id=user.institution_id,
                description="Login attempt on account without credentials",
            )
            await self.session.commit()
            return None, "Invalid credentials"

        if credential.locked_until and credential.locked_until > now:
            verify_password(password, DUMMY_PASSWORD_HASH)
            await self._log_security_event(
                event_type=SecurityEventType.ACCOUNT_LOCKED,
                severity=SecurityEventSeverity.WARNING,
                user_id=user.id,
                institution_id=user.institution_id,
                description="Login attempt on locked account",
            )
            await self.session.commit()
            return None, "Invalid credentials"

        if credential.locked_until and credential.locked_until <= now:
            credential.locked_until = None
            credential.status = CredentialStatus.ACTIVE

        if credential.status != CredentialStatus.ACTIVE:
            verify_password(password, DUMMY_PASSWORD_HASH)
            await self._log_security_event(
                event_type=SecurityEventType.LOGIN_FAILED,
                severity=SecurityEventSeverity.WARNING,
                user_id=user.id,
                institution_id=user.institution_id,
                description="Login attempt with inactive credential",
                metadata={"credential_status": credential.status.value},
            )
            await self.session.commit()
            return None, "Invalid credentials"

        if not verify_password(password, credential.password_hash):
            credential.failed_attempts += 1

            if credential.failed_attempts >= settings.LOGIN_RATE_LIMIT:
                credential.locked_until = now + timedelta(minutes=15)
                credential.status = CredentialStatus.LOCKED
                await self._log_security_event(
                    event_type=SecurityEventType.ACCOUNT_LOCKED,
                    severity=SecurityEventSeverity.WARNING,
                    user_id=user.id,
                    institution_id=user.institution_id,
                    description="Account locked due to failed attempts",
                    metadata={"failed_attempts": credential.failed_attempts},
                )
            else:
                await self._log_security_event(
                    event_type=SecurityEventType.LOGIN_FAILED,
                    severity=SecurityEventSeverity.WARNING,
                    user_id=user.id,
                    institution_id=user.institution_id,
                    description="Invalid password",
                    metadata={"failed_attempts": credential.failed_attempts},
                )

            await self.session.commit()
            return None, "Invalid credentials"

        credential.failed_attempts = 0
        credential.locked_until = None
        credential.status = CredentialStatus.ACTIVE
        credential.last_used_at = now

        if needs_rehash(credential.password_hash):
            credential.password_hash = hash_password(password)
            credential.password_changed_at = now

        await self._log_security_event(
            event_type=SecurityEventType.LOGIN_SUCCESS,
            severity=SecurityEventSeverity.INFO,
            user_id=user.id,
            institution_id=user.institution_id,
            description="Successful login",
        )
        await self.session.commit()

        return user, None

    async def create_session(
        self,
        user: User,
        institution_id: UUID,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        remember_me: bool = False,
    ) -> Tuple[AuthSession, str, str]:
        """Create a new authentication session and return tokens."""
        authorization = AuthorizationService(self.session)
        roles = await authorization.get_user_roles(user.id, institution_id)

        if not roles:
            raise AuthServiceError("User has no active membership in this institution")

        permissions = await authorization.get_user_permissions(user.id, institution_id)
        now = datetime.now(timezone.utc)

        if remember_me:
            expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        else:
            expires_delta = timedelta(hours=12)

        session = AuthSession(
            user_id=str(user.id),
            institution_id=str(institution_id),
            status=SessionStatus.ACTIVE,
            expires_at=now + expires_delta,
            last_seen_at=now,
            user_agent=(user_agent or "")[:500] or None,
            ip_address=ip_address,
            created_by_method="password",
        )
        self.session.add(session)
        await self.session.flush()

        access_token = create_access_token(
            subject=str(user.id),
            session_id=str(session.id),
            institution_id=str(institution_id),
            roles=roles,
            permissions=sorted(permissions),
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        refresh_token_raw, refresh_token_hash = generate_refresh_token()
        refresh_token = RefreshToken(
            session_id=str(session.id),
            token_hash=refresh_token_hash,
            status=RefreshTokenStatus.VALID,
            expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            user_agent=(user_agent or "")[:500] or None,
            ip_address=ip_address,
        )
        self.session.add(refresh_token)

        await self.session.commit()
        await self.session.refresh(session)

        return session, access_token, refresh_token_raw

    async def refresh_access_token(
        self,
        refresh_token_raw: str,
        csrf_token: Optional[str] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """Rotate a refresh token and issue a new access token."""
        token_hash = hash_token(refresh_token_raw)

        stmt = (
            select(RefreshToken)
            .where(
                and_(
                    RefreshToken.token_hash == token_hash,
                    RefreshToken.status == RefreshTokenStatus.VALID,
                )
            )
            .with_for_update()
            .options(selectinload(RefreshToken.session))
        )
        result = await self.session.execute(stmt)
        refresh_token = result.scalars().first()

        if not refresh_token:
            used_stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
            used_result = await self.session.execute(used_stmt)
            used_token = used_result.scalars().first()

            if used_token and used_token.status in {
                RefreshTokenStatus.USED,
                RefreshTokenStatus.REVOKED,
                RefreshTokenStatus.REPLACED,
            }:
                await self._handle_token_reuse(used_token)

            return None, None, "Invalid or expired refresh token"

        now = datetime.now(timezone.utc)

        if refresh_token.expires_at <= now:
            refresh_token.status = RefreshTokenStatus.EXPIRED
            await self.session.commit()
            return None, None, "Refresh token expired"

        session = refresh_token.session
        if not session or not session.is_active:
            return None, None, "Session is no longer active"

        user_stmt = select(User).where(User.id == session.user_id)
        user_result = await self.session.execute(user_stmt)
        user = user_result.scalars().first()

        if not user or user.status != UserStatus.ACTIVE:
            return None, None, "User account is not active"

        authorization = AuthorizationService(self.session)
        institution_id = UUID(session.institution_id)
        roles = await authorization.get_user_roles(UUID(session.user_id), institution_id)

        if not roles:
            return None, None, "User has no active membership in this institution"

        permissions = await authorization.get_user_permissions(
            UUID(session.user_id), institution_id
        )

        new_refresh_raw, new_refresh_hash = generate_refresh_token()

        refresh_token.status = RefreshTokenStatus.USED
        refresh_token.used_at = now

        new_refresh_token = RefreshToken(
            session_id=str(session.id),
            token_hash=new_refresh_hash,
            status=RefreshTokenStatus.VALID,
            expires_at=refresh_token.expires_at,
            user_agent=(user_agent or "")[:500] or None,
            ip_address=ip_address,
        )
        self.session.add(new_refresh_token)
        await self.session.flush()

        refresh_token.replaced_by_id = new_refresh_token.id
        session.last_seen_at = now

        new_access_token = create_access_token(
            subject=str(user.id),
            session_id=str(session.id),
            institution_id=str(session.institution_id),
            roles=roles,
            permissions=sorted(permissions),
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        await self._log_security_event(
            event_type=SecurityEventType.TOKEN_REFRESH,
            severity=SecurityEventSeverity.INFO,
            user_id=user.id,
            institution_id=institution_id,
            session_id=session.id,
            description="Refresh token rotated",
            metadata={"token_id": str(new_refresh_token.id)},
        )

        await self.session.commit()

        return new_access_token, new_refresh_raw, None

    async def _handle_token_reuse(self, used_token: RefreshToken) -> None:
        """Revoke the whole session when refresh token reuse is detected."""
        session_stmt = select(AuthSession).where(AuthSession.id == used_token.session_id)
        session_result = await self.session.execute(session_stmt)
        session = session_result.scalars().first()
        now = datetime.now(timezone.utc)

        if session:
            session.status = SessionStatus.REVOKED
            session.revoked_at = now
            session.revoke_reason = "Token reuse detected"

        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.session_id == used_token.session_id)
            .values(
                status=RefreshTokenStatus.REVOKED,
                revoked_at=now,
                revoke_reason="Token reuse detected",
            )
        )

        await self._log_security_event(
            event_type=SecurityEventType.TOKEN_REUSE_DETECTED,
            severity=SecurityEventSeverity.CRITICAL,
            user_id=session.user_id if session else None,
            institution_id=session.institution_id if session else None,
            session_id=used_token.session_id,
            description="Refresh token reuse detected - session revoked",
            metadata={"original_token_id": str(used_token.id)},
        )

        await self.session.commit()

    async def logout_session(
        self,
        session_id: UUID,
        user_id: UUID,
        reason: str = "user_logout",
    ) -> bool:
        """Revoke a specific session."""
        stmt = select(AuthSession).where(
            and_(
                AuthSession.id == str(session_id),
                AuthSession.user_id == str(user_id),
            )
        )
        result = await self.session.execute(stmt)
        session = result.scalars().first()

        if not session:
            return False

        now = datetime.now(timezone.utc)
        session.status = SessionStatus.REVOKED
        session.revoked_at = now
        session.revoke_reason = reason

        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.session_id == str(session_id))
            .values(
                status=RefreshTokenStatus.REVOKED,
                revoked_at=now,
                revoke_reason=reason,
            )
        )

        await self._log_security_event(
            event_type=SecurityEventType.LOGOUT,
            severity=SecurityEventSeverity.INFO,
            user_id=user_id,
            institution_id=session.institution_id,
            session_id=session_id,
            description="User logged out",
        )

        await self.session.commit()
        return True

    async def logout_all_sessions(
        self,
        user_id: UUID,
        current_session_id: Optional[UUID] = None,
        reason: str = "logout_all",
    ) -> int:
        """Revoke all active sessions for a user."""
        stmt = select(AuthSession).where(
            and_(
                AuthSession.user_id == str(user_id),
                AuthSession.status == SessionStatus.ACTIVE,
            )
        )

        if current_session_id:
            stmt = stmt.where(AuthSession.id != str(current_session_id))

        result = await self.session.execute(stmt)
        sessions = result.scalars().all()
        now = datetime.now(timezone.utc)

        for session in sessions:
            session.status = SessionStatus.REVOKED
            session.revoked_at = now
            session.revoke_reason = reason

            await self.session.execute(
                update(RefreshToken)
                .where(RefreshToken.session_id == str(session.id))
                .values(
                    status=RefreshTokenStatus.REVOKED,
                    revoked_at=now,
                    revoke_reason=reason,
                )
            )

        await self._log_security_event(
            event_type=SecurityEventType.LOGOUT_ALL,
            severity=SecurityEventSeverity.INFO,
            user_id=user_id,
            description=f"Revoked {len(sessions)} sessions",
            metadata={"revoked_count": len(sessions)},
        )

        await self.session.commit()
        return len(sessions)

    async def change_password(
        self,
        user_id: UUID,
        current_password: str,
        new_password: str,
        revoke_sessions: bool = True,
    ) -> Tuple[bool, Optional[str]]:
        """Change a user's password after verifying the current one."""
        cred_stmt = select(UserCredential).where(UserCredential.user_id == str(user_id))
        cred_result = await self.session.execute(cred_stmt)
        credential = cred_result.scalars().first()

        if not credential:
            return False, "No credential found"

        if not verify_password(current_password, credential.password_hash):
            return False, "Current password is incorrect"

        user_stmt = select(User).where(User.id == str(user_id))
        user_result = await self.session.execute(user_stmt)
        user = user_result.scalars().first()

        if not user:
            return False, "User not found"

        authorization = AuthorizationService(self.session)
        roles = await authorization.get_user_roles(user.id, UUID(user.institution_id))

        if "ADMIN" in roles:
            policy = ADMIN_POLICY
        elif "STUDENT" in roles:
            policy = STUDENT_POLICY
        else:
            policy = DEFAULT_POLICY

        is_valid, errors = validate_password(
            new_password,
            policy,
            {"display_name": user.display_name, "email": user.email or ""},
        )
        if not is_valid:
            return False, "; ".join(errors)

        now = datetime.now(timezone.utc)
        credential.password_hash = hash_password(new_password)
        credential.password_changed_at = now
        credential.password_algorithm = "argon2id"
        credential.failed_attempts = 0
        credential.locked_until = None
        credential.status = CredentialStatus.ACTIVE

        await self._log_security_event(
            event_type=SecurityEventType.PASSWORD_CHANGED,
            severity=SecurityEventSeverity.INFO,
            user_id=user_id,
            institution_id=user.institution_id,
            description="Password changed successfully",
        )

        await self.session.commit()

        if revoke_sessions:
            await self.logout_all_sessions(user_id, reason="password_changed")

        return True, None

    async def validate_session(
        self,
        session_id: UUID,
        access_token_jti: Optional[str] = None,
    ) -> Optional[AuthSession]:
        """Validate that a session is active and not revoked."""
        stmt = select(AuthSession).where(AuthSession.id == str(session_id))
        result = await self.session.execute(stmt)
        session = result.scalars().first()

        if not session or not session.is_active:
            return None

        return session

    def generate_csrf_tokens(self) -> Tuple[str, str]:
        """Generate a CSRF token pair."""
        return create_csrf_token_pair()

    def verify_csrf(self, token: str, expected: str) -> bool:
        """Verify a CSRF token."""
        return verify_csrf_token(token, expected)

    def verify_signed_csrf(self, signed_token: str) -> Optional[str]:
        """Verify a signed CSRF token from a cookie."""
        return verify_signed_csrf_token(signed_token)

    async def _log_security_event(
        self,
        event_type: SecurityEventType,
        severity: SecurityEventSeverity,
        description: str,
        user_id: Optional[UUID] = None,
        institution_id: Optional[UUID] = None,
        session_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> None:
        """Add a security event to the current transaction."""
        event = SecurityEvent(
            event_type=event_type,
            severity=severity,
            user_id=str(user_id) if user_id else None,
            institution_id=str(institution_id) if institution_id else None,
            session_id=str(session_id) if session_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            description=description,
            metadata_=metadata or {},
            occurred_at=datetime.now(timezone.utc),
        )
        self.session.add(event)
