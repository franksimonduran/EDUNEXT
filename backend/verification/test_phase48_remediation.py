"""Controlled security checks: own synthetic files only; no PostgreSQL or provider."""

import asyncio
from datetime import datetime, timezone
import io
from pathlib import Path
import tempfile
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
from datetime import timedelta
from uuid import uuid4

import pytest

from app.dependencies.auth import RateLimiter, login_rate_limit_key
from app.storage.base_storage import StorageConfig
from app.storage.local_storage import LocalStorage
from app.core.config import settings
from app.core.security import create_access_token, decode_access_token, validate_access_token_claims, create_csrf_token_pair, verify_signed_csrf_token, hash_password, verify_password
from jose import jwt


def test_rate_limit_bounds_key_cardinality_without_evicting_active_counters():
    limiter = RateLimiter(max_keys=2)
    assert limiter.check_rate_limit("a", 1, 300)[0]
    assert limiter.check_rate_limit("b", 1, 300)[0]
    assert not limiter.check_rate_limit("c", 1, 300)[0]
    assert len(limiter.attempts) == 2
    assert not limiter.check_rate_limit("a", 1, 300)[0]


def test_rate_limit_recovers_expired_capacity_with_monotonic_clock():
    now = [0.0]
    limiter = RateLimiter(max_keys=1, clock=lambda: now[0])
    assert limiter.check_rate_limit("a", 1, 2)[0]
    now[0] = 1
    assert not limiter.check_rate_limit("a", 1, 2)[0]
    now[0] = 2
    assert limiter.check_rate_limit("b", 1, 2)[0]
    assert list(limiter.attempts) == ["b"]


def test_rate_limit_reset_is_explicit_and_uses_oldest_active_attempt():
    now = [0.0]
    limiter = RateLimiter(max_keys=2, clock=lambda: now[0])
    assert limiter.check_rate_limit("a", 1, 10)[0]
    now[0] = 4
    allowed, info = limiter.check_rate_limit("a", 1, 10)
    assert not allowed
    assert 4 <= (info.reset_at - datetime.now(timezone.utc)).total_seconds() <= 7
    limiter.reset("a")
    assert limiter.check_rate_limit("a", 1, 10)[0]


def test_login_limiter_does_not_keep_plain_identifier_in_key():
    request = SimpleNamespace(client=SimpleNamespace(host="127.0.0.1"))
    key = login_rate_limit_key(request, "synthetic-pupil@example.test")
    assert "synthetic-pupil" not in key
    assert "127.0.0.1" not in key
    assert key == login_rate_limit_key(request, " SYNTHETIC-PUPIL@example.test ")


def test_concurrent_rate_checks_preserve_the_single_process_budget():
    limiter = RateLimiter()
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(lambda _: limiter.check_rate_limit("same-key", 5, 300)[0], range(64)))
    assert sum(results) == 5


def synthetic_token():
    return create_access_token(str(uuid4()), str(uuid4()), str(uuid4()), [], [])


def test_jwt_roundtrip_and_explicit_algorithm_allowlist():
    token = synthetic_token()
    payload = decode_access_token(token)
    assert validate_access_token_claims(payload)
    alternative = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS512")
    assert decode_access_token(alternative) is None


@pytest.mark.parametrize("missing", ["aud", "iss", "exp", "iat", "nbf"])
def test_jwt_required_security_claims_cannot_be_omitted(missing):
    payload = jwt.get_unverified_claims(synthetic_token())  # Only used to build a synthetic test token.
    del payload[missing]
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    assert decode_access_token(token) is None


def test_jwt_expiry_audience_and_issuer_are_verified():
    expired = create_access_token(str(uuid4()), str(uuid4()), str(uuid4()), [], [], expires_delta=timedelta(seconds=-1))
    assert decode_access_token(expired) is None
    for field in ("aud", "iss"):
        payload = jwt.get_unverified_claims(synthetic_token())
        payload[field] = "synthetic-wrong-context"
        assert decode_access_token(jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)) is None


def test_csrf_signature_is_required_and_tampering_rejected():
    raw, signed = create_csrf_token_pair()
    assert verify_signed_csrf_token(signed) == raw
    assert verify_signed_csrf_token(signed + "tampered") is None
    assert verify_signed_csrf_token(raw) is None


def test_passwords_use_argon2id_and_verify_without_plain_storage():
    password = "synthetic-phase48-password-for-test-only"
    encoded = hash_password(password)
    assert encoded.startswith("$argon2id$")
    assert password not in encoded
    assert verify_password(password, encoded)
    assert not verify_password("synthetic-wrong-password", encoded)


@pytest.fixture
def storage():
    # Use the host OS temporary directory (Windows, Linux and CI runners).
    with tempfile.TemporaryDirectory(prefix="phase48-files-") as directory:
        yield LocalStorage(StorageConfig(base_path=str(Path(directory) / "resources"), max_file_size=4))


def test_oversized_stream_cannot_truncate_existing_file(storage):
    async def check():
        await storage.save_bytes("work.txt", b"safe", "text/plain")
        with pytest.raises(ValueError):
            await storage.save("work.txt", io.BytesIO(b"oversized"), "text/plain")
        assert await storage.get_bytes("work.txt") == b"safe"
    asyncio.run(check())


def test_upload_stream_read_is_bounded(storage):
    class BoundedInput(io.BytesIO):
        def read(self, size=-1):
            assert 0 <= size <= 5, "unbounded stream read"
            return super().read(size)
    with pytest.raises(ValueError):
        asyncio.run(storage.save("too-large.txt", BoundedInput(b"oversized"), "text/plain"))


@pytest.mark.parametrize("value", ["../escape", "nested/../../escape", "C:relative-drive.txt", "file.txt:alternate", "NUL", "nested/CON.txt", "trailing. "])
def test_unsafe_storage_paths_are_rejected(storage, value):
    with pytest.raises(ValueError):
        storage._get_full_path(value)


def test_paths_remain_in_resolved_storage_root(storage):
    root = Path(storage.config.base_path).resolve()
    assert storage._get_full_path("nested/file.txt").is_relative_to(root)
    with pytest.raises(ValueError):
        storage._get_full_path("")


def test_partial_stream_reads_are_not_mistaken_for_end_of_file(storage):
    class PartialInput(io.BytesIO):
        def read(self, size=-1):
            return super().read(min(size, 1))
    asyncio.run(storage.save("partial.txt", PartialInput(b"safe"), "text/plain"))
    assert asyncio.run(storage.get_bytes("partial.txt")) == b"safe"
    with pytest.raises(ValueError):
        asyncio.run(storage.save("partial.txt", PartialInput(b"oversized"), "text/plain"))
    assert asyncio.run(storage.get_bytes("partial.txt")) == b"safe"


def test_storage_write_failure_preserves_previous_file(storage, monkeypatch):
    async def check():
        await storage.save_bytes("work.txt", b"safe", "text/plain")
        def fail(*args, **kwargs):
            raise OSError("synthetic atomic replace failure")
        monkeypatch.setattr("app.storage.local_storage.os.replace", fail)
        with pytest.raises(OSError):
            await storage.save_bytes("work.txt", b"new", "text/plain")
        assert await storage.get_bytes("work.txt") == b"safe"
        assert not list(Path(storage.config.base_path).glob(".aithron-upload-*"))
    asyncio.run(check())
