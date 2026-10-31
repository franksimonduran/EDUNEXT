"""Security utilities for password hashing and JWT tokens."""

import secrets
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from uuid import uuid4

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings

# Import argon2 for configuration
try:
    import argon2
    ARGON2_AVAILABLE = True
except ImportError:
    argon2 = None
    ARGON2_AVAILABLE = False

# Password hashing context using Argon2id
if ARGON2_AVAILABLE:
    pwd_context = CryptContext(
        schemes=["argon2"],
        default="argon2",
        argon2__type="ID",
        argon2__time_cost=3,
        argon2__memory_cost=65536,
        argon2__parallelism=4,
        argon2__hash_len=32,
        argon2__salt_size=16,
    )
else:
    # Fallback to bcrypt if argon2 not available
    pwd_context = CryptContext(
        schemes=["bcrypt"],
        default="bcrypt",
        bcrypt__rounds=12,
    )


def hash_password(password: str) -> str:
    """Hash a password using Argon2id."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError):
        return False


def needs_rehash(hashed_password: str) -> bool:
    """Check if a password hash needs to be updated."""
    return pwd_context.needs_update(hashed_password)


def rehash_password(hashed_password: str) -> Optional[str]:
    """Rehash a password if needed. Returns new hash or None if not needed."""
    if needs_rehash(hashed_password):
        # We need the original password to rehash, which we don't have
        # This is used during login when we have the plain password
        return None
    return None


def create_access_token(
    subject: str,
    session_id: str,
    institution_id: str,
    roles: list[str],
    permissions: list[str],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "sub": subject,
        "sid": session_id,
        "inst": institution_id,
        "roles": roles,
        "perms": permissions,
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": datetime.now(timezone.utc),
        "nbf": datetime.now(timezone.utc),
        "exp": expire,
        "jti": str(uuid4()),
        "type": "access",
    }

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
            options={"verify_aud": True, "require_aud": True, "require_iss": True,
                     "require_exp": True, "require_iat": True, "require_nbf": True},
        )
        return payload
    except JWTError:
        return None


def validate_access_token_claims(payload: Dict[str, Any]) -> bool:
    """Validate required claims in access token."""
    required_claims = ["sub", "sid", "inst", "roles", "perms", "iat", "exp", "jti", "type"]
    if not all(claim in payload for claim in required_claims):
        return False
    if payload.get("type") != "access":
        return False
    return True


def generate_refresh_token() -> tuple[str, str]:
    """Generate a secure refresh token and its hash.
    
    Returns:
        tuple: (raw_token, token_hash)
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    return raw_token, token_hash


def hash_token(token: str) -> str:
    """Hash a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_csrf_token() -> str:
    """Generate a CSRF token."""
    return secrets.token_urlsafe(32)


def verify_csrf_token(token: str, expected: str) -> bool:
    """Verify a CSRF token using constant-time comparison."""
    return hmac.compare_digest(token, expected)


def create_csrf_token_pair() -> tuple[str, str]:
    """Create a CSRF token pair (token, signed_token).
    
    The signed token can be stored in a cookie and verified later.
    """
    token = generate_csrf_token()
    # Create HMAC signature for the token
    signature = hmac.new(
        settings.CSRF_SECRET_KEY.encode(),
        token.encode(),
        hashlib.sha256
    ).hexdigest()
    signed_token = f"{token}.{signature}"
    return token, signed_token


def verify_signed_csrf_token(signed_token: str) -> Optional[str]:
    """Verify a signed CSRF token and return the raw token if valid."""
    try:
        token, signature = signed_token.split(".", 1)
        expected_signature = hmac.new(
            settings.CSRF_SECRET_KEY.encode(),
            token.encode(),
            hashlib.sha256
        ).hexdigest()
        if hmac.compare_digest(signature, expected_signature):
            return token
    except ValueError:
        pass
    return None
