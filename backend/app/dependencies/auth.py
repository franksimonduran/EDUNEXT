"""Authentication dependencies for FastAPI."""

import hmac
import hashlib
import time
from threading import RLock
from math import ceil
from typing import Optional, Callable, Tuple
from uuid import UUID
from datetime import datetime, timezone, timedelta

from fastapi import Depends, Header, HTTPException, Request, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_async_session_dependency
from app.db.models import User, UserStatus, AuthSession
from app.core.security import decode_access_token, validate_access_token_claims
from app.core.config import settings
from app.services.auth_service import AuthService
from app.services.authorization_service import AuthorizationService
from app.schemas.auth import RateLimitInfo
from app.schemas.permission import AuthorizationContext


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False,
)


async def get_auth_service(
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthService:
    """Get auth service instance."""
    return AuthService(session)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_async_session_dependency),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """Get the current authenticated user from a validated JWT and session."""
    if not token:
        raise _unauthorized("Not authenticated")

    payload = decode_access_token(token)
    if not payload or not validate_access_token_claims(payload):
        raise _unauthorized("Invalid token")

    try:
        session_id = UUID(payload["sid"])
        user_id = UUID(payload["sub"])
        institution_id = UUID(payload["inst"])
    except (KeyError, TypeError, ValueError):
        raise _unauthorized("Invalid token claims")

    validated_session = await auth_service.validate_session(session_id)
    if not validated_session:
        raise _unauthorized("Session expired or revoked")

    if UUID(validated_session.user_id) != user_id:
        raise _unauthorized("Token does not belong to this session")

    if UUID(validated_session.institution_id) != institution_id:
        raise _unauthorized("Institution context mismatch")

    user_stmt = select(User).where(User.id == str(user_id))
    user_result = await session.execute(user_stmt)
    user = user_result.scalars().first()

    if not user or user.status != UserStatus.ACTIVE:
        raise _unauthorized("User not found or inactive")

    if user.institution_id != validated_session.institution_id:
        raise _unauthorized("Institution context mismatch")

    return user


async def get_current_session(
    token: Optional[str] = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthSession:
    """Get the current session from a validated JWT."""
    if not token:
        raise _unauthorized("Not authenticated")

    payload = decode_access_token(token)
    if not payload or not validate_access_token_claims(payload):
        raise _unauthorized("Invalid token")

    try:
        session_id = UUID(payload["sid"])
        institution_id = UUID(payload["inst"])
    except (KeyError, TypeError, ValueError):
        raise _unauthorized("Invalid token claims")

    validated_session = await auth_service.validate_session(session_id)
    if not validated_session:
        raise _unauthorized("Session expired or revoked")

    if UUID(validated_session.institution_id) != institution_id:
        raise _unauthorized("Institution context mismatch")

    return validated_session


async def get_current_institution(
    current_session: AuthSession = Depends(get_current_session),
) -> UUID:
    """Get the current institution ID from the session."""
    return UUID(current_session.institution_id)


async def get_authorization_context(
    current_user: User = Depends(get_current_user),
    current_session: AuthSession = Depends(get_current_session),
    session: AsyncSession = Depends(get_async_session_dependency),
) -> AuthorizationContext:
    """Resolve the current roles and permissions from the database."""
    authorization = AuthorizationService(session)
    institution_id = UUID(current_session.institution_id)

    roles = await authorization.get_user_roles(current_user.id, institution_id)
    permissions = await authorization.get_user_permissions(current_user.id, institution_id)

    return AuthorizationContext(
        user_id=UUID(current_user.id),
        institution_id=institution_id,
        roles=roles,
        permissions=sorted(permissions),
        session_id=UUID(current_session.id),
    )


def require_permission(permission_code: str) -> Callable:
    """Return a dependency that requires a specific permission."""

    async def checker(
        context: AuthorizationContext = Depends(get_authorization_context),
    ) -> AuthorizationContext:
        if permission_code not in context.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return context

    return checker


def require_any_permission(*permission_codes: str) -> Callable:
    """Return a dependency that requires at least one permission."""

    async def checker(
        context: AuthorizationContext = Depends(get_authorization_context),
    ) -> AuthorizationContext:
        if not any(code in context.permissions for code in permission_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return context

    return checker


async def get_csrf_token_from_header(
    x_csrf_token: Optional[str] = Header(None, alias=settings.CSRF_HEADER_NAME),
) -> Optional[str]:
    """Extract the CSRF token from the request header."""
    return x_csrf_token


async def get_csrf_token_from_cookie(
    request: Request,
) -> Optional[str]:
    """Extract the signed CSRF token from the cookie."""
    return request.cookies.get(settings.CSRF_COOKIE_NAME)


async def verify_csrf_protection(
    header_token: Optional[str] = Depends(get_csrf_token_from_header),
    cookie_token: Optional[str] = Depends(get_csrf_token_from_cookie),
    auth_service: AuthService = Depends(get_auth_service),
) -> bool:
    """Verify double-submit CSRF protection using the signed cookie."""
    if not header_token or not cookie_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token required",
        )

    raw_cookie_token = auth_service.verify_signed_csrf(cookie_token)
    if not raw_cookie_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF cookie",
        )

    if not hmac.compare_digest(header_token, raw_cookie_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF token",
        )

    return True


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_async_session_dependency),
    auth_service: AuthService = Depends(get_auth_service),
) -> Optional[User]:
    """Get the current user if authenticated, otherwise None."""
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or not validate_access_token_claims(payload):
        return None

    try:
        session_id = UUID(payload["sid"])
        user_id = UUID(payload["sub"])
    except (KeyError, TypeError, ValueError):
        return None

    validated_session = await auth_service.validate_session(session_id)
    if not validated_session or validated_session.user_id != str(user_id):
        return None

    user_stmt = select(User).where(User.id == str(user_id))
    user_result = await session.execute(user_stmt)
    user = user_result.scalars().first()

    if not user or user.status != UserStatus.ACTIVE:
        return None

    return user


class RateLimiter:
    """Bounded process-local limiter; never evicts active counters to admit new keys."""

    def __init__(self, *, max_keys: int = 4096, clock=None) -> None:
        if type(max_keys) is not int or max_keys < 1:
            raise ValueError("Rate limiter capacity must be positive")
        self.max_keys = max_keys
        self.clock = clock or time.monotonic
        self.attempts: dict[str, list[float]] = {}
        self.expirations: dict[str, float] = {}
        self.next_cleanup = 0.0
        self._lock = RLock()

    def check_rate_limit(
        self,
        key: str,
        limit: int,
        window_seconds: int,
    ) -> Tuple[bool, RateLimitInfo]:
        with self._lock:
            return self._check_rate_limit(key, limit, window_seconds)

    def _check_rate_limit(
        self,
        key: str,
        limit: int,
        window_seconds: int,
    ) -> Tuple[bool, RateLimitInfo]:
        if type(limit) is not int or limit < 1 or type(window_seconds) is not int or window_seconds < 1:
            raise ValueError("Rate limit and window must be positive integers")
        now = self.clock()
        wall_now = datetime.now(timezone.utc)
        # At most one O(capacity) sweep per second, rather than per attacker key.
        if now >= self.next_cleanup:
            for expired in [key for key, expires in self.expirations.items() if expires <= now]:
                self.reset(expired)
            self.next_cleanup = now + 1
        if key not in self.attempts and len(self.attempts) >= self.max_keys:
            return False, RateLimitInfo(limit=limit, remaining=0,
                reset_at=wall_now + timedelta(seconds=max(1, self.next_cleanup - now)))
        recent = [
            attempt
            for attempt in self.attempts.get(key, [])
            if now - attempt < window_seconds
        ]
        self.attempts[key] = recent

        reset_at = wall_now + timedelta(seconds=max(0, recent[0] + window_seconds - now) if recent else window_seconds)
        remaining = max(0, limit - len(recent))

        if len(recent) >= limit:
            return False, RateLimitInfo(limit=limit, remaining=0, reset_at=reset_at)

        recent.append(now)
        self.expirations[key] = now + window_seconds
        return True, RateLimitInfo(
            limit=limit,
            remaining=max(0, limit - len(recent)),
            reset_at=reset_at,
        )

    def reset(self, key: str) -> None:
        with self._lock:
            self.attempts.pop(key, None)
            self.expirations.pop(key, None)


rate_limiter = RateLimiter()


def login_rate_limit_key(request: Request, identifier: str) -> str:
    client_ip = request.client.host if request.client else "unknown"
    value = f"login:{client_ip}:{identifier.strip().lower()}"
    return hmac.new(settings.SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()


async def enforce_login_rate_limit(request: Request, identifier: str) -> RateLimitInfo:
    allowed, info = rate_limiter.check_rate_limit(
        login_rate_limit_key(request, identifier),
        limit=settings.LOGIN_RATE_LIMIT,
        window_seconds=settings.LOGIN_RATE_WINDOW_SECONDS,
    )

    if not allowed:
        retry_after = max(
            1,
            ceil((info.reset_at - datetime.now(timezone.utc)).total_seconds()),
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    return info
