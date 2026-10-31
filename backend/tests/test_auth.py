"""Authentication tests."""

import pytest
from httpx import AsyncClient, ASGITransport
from uuid import uuid4

from app.main import create_app
from app.core.security import hash_password, verify_password
from app.core.password_policy import validate_password, DEFAULT_POLICY


@pytest.fixture
async def client():
    """Create test client."""
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestPasswordHashing:
    """Test password hashing and verification."""
    
    def test_hash_password(self):
        """Test that password hashing produces a valid hash."""
        password = "TestPassword123!"
        hashed = hash_password(password)
        
        assert hashed is not None
        assert len(hashed) > 0
        assert hashed.startswith("$argon2id$")
    
    def test_verify_password_correct(self):
        """Test verifying correct password."""
        password = "TestPassword123!"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_password_incorrect(self):
        """Test verifying incorrect password."""
        password = "TestPassword123!"
        hashed = hash_password(password)
        
        assert verify_password("WrongPassword", hashed) is False
    
    def test_different_hashes_for_same_password(self):
        """Test that two hashes of the same password are different (salt)."""
        password = "TestPassword123!"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestPasswordPolicy:
    """Test password policy validation."""
    
    def test_valid_password(self):
        """Test valid long password."""
        password = "ThisIsAVeryLongPassphrase123!"
        is_valid, errors = validate_password(password, DEFAULT_POLICY)
        
        assert is_valid is True
        assert len(errors) == 0
    
    def test_password_too_short(self):
        """Test password below minimum length."""
        password = "Short1!"
        is_valid, errors = validate_password(password, DEFAULT_POLICY)
        
        assert is_valid is False
        assert any("at least 15" in e for e in errors)
    
    def test_common_password_blocked(self):
        """Test common passwords are blocked."""
        # Use a password that's definitely in the common list
        password = "password"
        is_valid, errors = validate_password(password, DEFAULT_POLICY)
        
        assert is_valid is False
        assert any("too common" in e.lower() for e in errors)
    
    def test_repeating_characters_blocked(self):
        """Test repeating characters are blocked."""
        password = "aaaaaaaaaaaaaaa"  # 15 'a's
        is_valid, errors = validate_password(password, DEFAULT_POLICY)
        
        assert is_valid is False
        assert any("repeating" in e.lower() for e in errors)
    
    def test_sequential_characters_blocked(self):
        """Test sequential characters are blocked."""
        password = "abcd12345678901"  # Has 'abcd' and '1234'
        is_valid, errors = validate_password(password, DEFAULT_POLICY)
        
        assert is_valid is False
        assert any("sequential" in e.lower() for e in errors)


class TestAuthEndpoints:
    """Test authentication endpoints (require database)."""
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self, client):
        """Test health endpoint works."""
        response = await client.get("/api/v1/health/live")
        assert response.status_code == 200
        assert response.json()["status"] == "alive"
    
    @pytest.mark.asyncio
    async def test_login_missing_credentials(self, client):
        """Test login with missing credentials."""
        response = await client.post("/api/v1/auth/login", json={})
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"identifier": "nonexistent", "password": "wrong"}
        )
        # Should return 401 or 422 but not reveal if user exists
        assert response.status_code in [401, 422]
    
    @pytest.mark.asyncio
    async def test_me_unauthenticated(self, client):
        """Test /me endpoint without authentication."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_refresh_without_token(self, client):
        """Test refresh without refresh token."""
        response = await client.post("/api/v1/auth/refresh")
        assert response.status_code in [401, 422]
    
    @pytest.mark.asyncio
    async def test_logout_unauthenticated(self, client):
        """Test logout without authentication."""
        response = await client.post("/api/v1/auth/logout")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_csrf_endpoint(self, client):
        """Test CSRF token endpoint."""
        response = await client.get("/api/v1/auth/csrf")
        # May require auth or may be public
        assert response.status_code in [200, 401]


class TestSecurityUtilities:
    """Test security utility functions."""
    
    def test_csrf_token_generation(self):
        """Test CSRF token generation."""
        from app.core.security import generate_csrf_token, create_csrf_token_pair, verify_csrf_token
        
        token1 = generate_csrf_token()
        token2 = generate_csrf_token()
        
        assert token1 != token2
        assert len(token1) > 20
    
    def test_csrf_token_verification(self):
        """Test CSRF token verification."""
        from app.core.security import create_csrf_token_pair, verify_csrf_token
        
        token, signed = create_csrf_token_pair()
        
        assert verify_csrf_token(token, token) is True
        assert verify_csrf_token(token, "wrong") is False
    
    def test_token_hashing(self):
        """Test token hashing."""
        from app.core.security import generate_refresh_token, hash_token
        
        raw_token, token_hash = generate_refresh_token()
        
        assert len(raw_token) > 20
        assert len(token_hash) == 64  # SHA256 hex
        
        # Verify hash matches
        assert hash_token(raw_token) == token_hash
    
    def test_jwt_token_creation_and_decoding(self):
        """Test JWT token creation and decoding."""
        from app.core.security import create_access_token, decode_access_token
        
        token = create_access_token(
            subject="test-user-id",
            session_id="test-session-id",
            institution_id="test-inst-id",
            roles=["student"],
            permissions=["courses.read"],
        )
        
        assert token is not None
        assert len(token) > 0
        
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "test-user-id"
        assert payload["sid"] == "test-session-id"
        assert payload["inst"] == "test-inst-id"
        assert payload["roles"] == ["student"]
        assert payload["perms"] == ["courses.read"]
        assert payload["type"] == "access"


class TestAuthorization:
    """Test authorization logic."""
    
    @pytest.mark.asyncio
    async def test_permission_constants_exist(self):
        """Test that permission constants are defined."""
        from app.schemas.permission import Permissions
        
        # Check some key permissions exist
        assert hasattr(Permissions, "PROFILE_READ_OWN")
        assert hasattr(Permissions, "COURSES_READ")
        assert hasattr(Permissions, "ASSESSMENTS_SUBMIT_OWN")
        assert hasattr(Permissions, "STUDENTS_READ_INSTITUTION")
        assert hasattr(Permissions, "SYSTEM_ADMIN")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])