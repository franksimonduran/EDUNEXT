"""Authentication endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Cookie, Header
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session_dependency
from app.db.models import AuthSession, SessionStatus, User, UserCredential, Institution
from app.dependencies.auth import (
    get_auth_service,
    get_current_user,
    get_current_session,
    get_authorization_context,
    verify_csrf_protection,
    enforce_login_rate_limit,
    rate_limiter,
    login_rate_limit_key,
)
from app.services.auth_service import AuthService, AuthServiceError
from app.services.authorization_service import AuthorizationService
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    TokenRefreshResponse,
    LogoutAllRequest,
    CurrentUserResponse,
    SessionInfo,
    SessionsResponse,
    CSRFResponse,
    UserPublic,
    InstitutionPublic,
    PasswordChangeRequest,
    PasswordChangeResponse,
)
from app.schemas.permission import AuthorizationContext
from app.core.config import settings
from app.core.security import verify_password
from app.core.logging import get_logger

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = get_logger(__name__)


def _set_auth_cookies(response: Response, refresh_token: str, signed_csrf: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path=settings.REFRESH_COOKIE_PATH,
    )
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=signed_csrf,
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(settings.REFRESH_COOKIE_NAME, path=settings.REFRESH_COOKIE_PATH)
    response.delete_cookie(settings.CSRF_COOKIE_NAME, path="/")


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    response: Response,
    login_data: LoginRequest,
    session: AsyncSession = Depends(get_async_session_dependency),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Authenticate a user and create a server-side session."""
    await enforce_login_rate_limit(request, login_data.identifier)

    user, error = await auth_service.authenticate_user(
        identifier=login_data.identifier,
        password=login_data.password,
    )

    if error or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error or "Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    institution_id = UUID(user.institution_id)

    try:
        auth_session, access_token, refresh_token = await auth_service.create_session(
            user=user,
            institution_id=institution_id,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
            remember_me=login_data.remember_me,
        )
    except AuthServiceError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active membership in this institution",
        )

    csrf_token, signed_csrf = auth_service.generate_csrf_tokens()
    _set_auth_cookies(response, refresh_token, signed_csrf)
    rate_limiter.reset(login_rate_limit_key(request, login_data.identifier))

    inst_stmt = select(Institution).where(Institution.id == str(institution_id))
    inst_result = await session.execute(inst_stmt)
    institution = inst_result.scalars().first()

    authorization = AuthorizationService(session)
    roles = await authorization.get_user_roles(user.id, institution_id)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        csrf_token=csrf_token,
        user=UserPublic(
            id=UUID(user.id),
            username=user.username,
            display_name=user.display_name,
            email=user.email,
            status=user.status.value,
            roles=roles,
            created_at=user.created_at,
        ),
        institution=InstitutionPublic(
            id=UUID(institution.id),
            name=institution.name,
            code=institution.code,
        ) if institution else InstitutionPublic(
            id=institution_id,
            name="Unknown",
            code=None,
        ),
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    request: Request,
    response: Response,
    refresh_token_cookie: Optional[str] = Cookie(None, alias=settings.REFRESH_COOKIE_NAME),
    csrf_header: Optional[str] = Header(None, alias=settings.CSRF_HEADER_NAME),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Rotate the refresh token and issue a new access token."""
    if not refresh_token_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not provided",
        )

    cookie_csrf = request.cookies.get(settings.CSRF_COOKIE_NAME)
    if not cookie_csrf or not csrf_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token required",
        )

    raw_cookie_csrf = auth_service.verify_signed_csrf(cookie_csrf)
    if not raw_cookie_csrf or not auth_service.verify_csrf(csrf_header, raw_cookie_csrf):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF token",
        )

    new_access_token, new_refresh_token, error = await auth_service.refresh_access_token(
        refresh_token_raw=refresh_token_cookie,
        csrf_token=csrf_header,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    if error or not new_access_token or not new_refresh_token:
        _clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error or "Token refresh failed",
        )

    new_csrf_token, new_signed_csrf = auth_service.generate_csrf_tokens()
    _set_auth_cookies(response, new_refresh_token, new_signed_csrf)

    return TokenRefreshResponse(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        csrf_token=new_csrf_token,
    )


@router.post("/logout")
async def logout(
    response: Response,
    current_session: AuthSession = Depends(get_current_session),
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
    csrf_verified: bool = Depends(verify_csrf_protection),
):
    """Logout the current session."""
    await auth_service.logout_session(
        session_id=UUID(current_session.id),
        user_id=UUID(current_user.id),
        reason="user_logout",
    )
    _clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.post("/logout-all")
async def logout_all(
    response: Response,
    logout_data: LogoutAllRequest,
    current_user: User = Depends(get_current_user),
    current_session: AuthSession = Depends(get_current_session),
    auth_service: AuthService = Depends(get_auth_service),
    session: AsyncSession = Depends(get_async_session_dependency),
    csrf_verified: bool = Depends(verify_csrf_protection),
):
    """Logout all sessions after confirming the current password."""
    cred_stmt = select(UserCredential).where(UserCredential.user_id == str(current_user.id))
    cred_result = await session.execute(cred_stmt)
    credential = cred_result.scalars().first()

    if not credential or not verify_password(logout_data.password, credential.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )

    revoked_count = await auth_service.logout_all_sessions(
        user_id=UUID(current_user.id),
        current_session_id=UUID(current_session.id),
        reason="logout_all",
    )
    _clear_auth_cookies(response)
    return {"message": f"Logged out from {revoked_count} sessions"}


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    current_session: AuthSession = Depends(get_current_session),
    auth_context: AuthorizationContext = Depends(get_authorization_context),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    """Get information about the current authenticated user."""
    inst_stmt = select(Institution).where(Institution.id == current_session.institution_id)
    inst_result = await session.execute(inst_stmt)
    institution = inst_result.scalars().first()

    return CurrentUserResponse(
        user=UserPublic(
            id=UUID(current_user.id),
            username=current_user.username,
            display_name=current_user.display_name,
            email=current_user.email,
            status=current_user.status.value,
            roles=auth_context.roles,
            created_at=current_user.created_at,
        ),
        institution=InstitutionPublic(
            id=UUID(institution.id),
            name=institution.name,
            code=institution.code,
        ) if institution else InstitutionPublic(
            id=UUID(current_session.institution_id),
            name="Unknown",
            code=None,
        ),
        roles=auth_context.roles,
        permissions=auth_context.permissions,
        session_id=UUID(current_session.id),
        session_expires_at=current_session.expires_at,
    )


@router.get("/sessions", response_model=SessionsResponse)
async def get_active_sessions(
    current_user: User = Depends(get_current_user),
    current_session: AuthSession = Depends(get_current_session),
    session: AsyncSession = Depends(get_async_session_dependency),
):
    """Get all active sessions for the current user."""
    stmt = (
        select(AuthSession)
        .where(
            and_(
                AuthSession.user_id == str(current_user.id),
                AuthSession.status == SessionStatus.ACTIVE,
            )
        )
        .order_by(AuthSession.last_seen_at.desc())
    )
    result = await session.execute(stmt)
    sessions = result.scalars().all()

    institution_ids = {s.institution_id for s in sessions}
    institutions_result = await session.execute(
        select(Institution).where(Institution.id.in_(institution_ids))
    )
    institutions = {str(i.id): i for i in institutions_result.scalars().all()}

    session_infos = []
    for auth_session in sessions:
        institution = institutions.get(auth_session.institution_id)
        session_infos.append(
            SessionInfo(
                id=UUID(auth_session.id),
                institution_id=UUID(auth_session.institution_id),
                institution_name=institution.name if institution else "Unknown",
                status=auth_session.status.value,
                created_at=auth_session.created_at,
                last_seen_at=auth_session.last_seen_at,
                expires_at=auth_session.expires_at,
                user_agent=auth_session.user_agent,
                ip_address=str(auth_session.ip_address) if auth_session.ip_address else None,
                is_current=auth_session.id == current_session.id,
            )
        )

    return SessionsResponse(sessions=session_infos)


@router.get("/csrf", response_model=CSRFResponse)
async def get_csrf_token(
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Issue a new CSRF token pair for state-changing requests."""
    csrf_token, signed_csrf = auth_service.generate_csrf_tokens()
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=signed_csrf,
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )
    return CSRFResponse(
        csrf_token=csrf_token,
        csrf_cookie_name=settings.CSRF_COOKIE_NAME,
        csrf_header_name=settings.CSRF_HEADER_NAME,
    )


@router.post("/change-password", response_model=PasswordChangeResponse)
async def change_password(
    response: Response,
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
    csrf_verified: bool = Depends(verify_csrf_protection),
):
    """Change the current user's password and revoke other sessions."""
    success, error = await auth_service.change_password(
        user_id=UUID(current_user.id),
        current_password=password_data.current_password,
        new_password=password_data.new_password,
        revoke_sessions=True,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )

    _clear_auth_cookies(response)
    return PasswordChangeResponse(
        message="Password changed successfully",
        sessions_revoked=True,
    )

