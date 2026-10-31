"""No database. Synthetic gateway doubles are NOT PostgreSQL/RBAC E2E evidence."""

import asyncio
from pathlib import Path
import os
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.core.config import settings
from app.core.exceptions import ForbiddenError, ServiceUnavailableError
from app.providers.argos_provider import ArgosProvider
from app.providers.base_provider import ProviderFailure
from app.providers import provider_registry
from app.schemas.ai import TranslationRequest, TutorRequest
from app.services.ai_gateway_service import AIGatewayService


@pytest.mark.asyncio
async def test_missing_models_fail_closed_and_never_download(tmp_path):
    provider = ArgosProvider(packages_dir=str(tmp_path))
    assert not await provider.available()
    assert not list(tmp_path.iterdir())


def test_explicit_absolute_local_directory_required():
    for path in ("", "relative/models", "https://models.example.invalid"):
        with pytest.raises(ProviderFailure):
            ArgosProvider(packages_dir=path)


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", [
    {"question": "Tutor question"},
    {"text": "Hello", "source_language": "en", "target_language": "fr"},
    {"text": "Hello", "source_language": "en", "target_language": "en"},
    {"text": "x" * 1001, "source_language": "en", "target_language": "es"},
])
async def test_invalid_input_never_starts_a_worker(tmp_path, monkeypatch, payload):
    provider = ArgosProvider(packages_dir=str(tmp_path))
    invoke = AsyncMock()
    monkeypatch.setattr(provider, "_invoke", invoke)
    with pytest.raises(ProviderFailure):
        await provider.generate_text(system="", payload=payload, max_tokens=64)
    invoke.assert_not_awaited()


@pytest.mark.asyncio
async def test_timeout_kills_own_child_and_releases_slot(tmp_path, monkeypatch):
    import sys
    original = asyncio.create_subprocess_exec
    children = []
    async def launch(*args, **kwargs):
        child = await original(sys.executable, "-I", "-c", "import time; time.sleep(60)", **kwargs)
        children.append(child)
        return child
    monkeypatch.setattr(asyncio, "create_subprocess_exec", launch)
    provider = ArgosProvider(packages_dir=str(tmp_path), timeout=0.3)
    with pytest.raises(ProviderFailure):
        await provider._invoke({"operation": "check"})
    assert children and children[0].returncode is not None and not provider._busy


@pytest.mark.asyncio
async def test_cancel_kills_child_without_caching_text(tmp_path, monkeypatch):
    import sys
    original = asyncio.create_subprocess_exec
    children, ready = [], asyncio.Event()
    async def launch(*args, **kwargs):
        child = await original(sys.executable, "-I", "-c", "import time; time.sleep(60)", **kwargs)
        children.append(child)
        ready.set()
        return child
    monkeypatch.setattr(asyncio, "create_subprocess_exec", launch)
    provider = ArgosProvider(packages_dir=str(tmp_path), timeout=5)
    task = asyncio.create_task(provider._invoke({"operation": "check"}))
    await ready.wait()
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    assert children[0].returncode is not None and not provider._busy


@pytest.mark.asyncio
async def test_busy_rejects_instead_of_queueing(tmp_path):
    provider = ArgosProvider(packages_dir=str(tmp_path))
    provider._busy = True
    with pytest.raises(ProviderFailure):
        await provider._invoke({"operation": "check"})


def test_registry_keeps_both_operator_gates_and_no_tutor_capability(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "AI_PROVIDER_CODE", "argos_local")
    monkeypatch.setattr(settings, "AI_ARGOS_PACKAGES_DIR", str(tmp_path))
    monkeypatch.setattr(settings, "AITHRON_AI_ENABLED", False)
    monkeypatch.setattr(settings, "AI_LOCAL_ONLY_ATTESTED", True)
    assert provider_registry.configured_provider() is None
    monkeypatch.setattr(settings, "AITHRON_AI_ENABLED", True)
    monkeypatch.setattr(settings, "AI_LOCAL_ONLY_ATTESTED", False)
    assert provider_registry.configured_provider() is None
    monkeypatch.setattr(settings, "AI_LOCAL_ONLY_ATTESTED", True)
    provider = provider_registry.configured_provider()
    assert isinstance(provider, ArgosProvider)
    assert provider.capabilities == frozenset({"translate_text"})
    monkeypatch.setattr(provider_registry, "_provider", None)
    monkeypatch.setattr(provider_registry, "_configuration", None)


def gateway(monkeypatch, provider):
    context = SimpleNamespace(user_id=uuid4(), institution_id=uuid4(), permissions=["ai.translate.use_own", "ai.tutor.use_own"])
    policy = SimpleNamespace(tutor_enabled=True, translation_enabled=True, provider_approved=True,
        dictionary_enabled=True, max_input_characters=1000, max_output_tokens=256)
    session = SimpleNamespace(execute=AsyncMock(return_value=SimpleNamespace(first=lambda: None)), commit=AsyncMock(), rollback=AsyncMock())
    service = AIGatewayService(session)
    service.identity = AsyncMock(return_value=SimpleNamespace(timezone="UTC"))
    service.repo.policy = AsyncMock(return_value=policy)
    event = SimpleNamespace()
    service.repo.reserve = AsyncMock(return_value=(event, policy))
    monkeypatch.setattr(settings, "AITHRON_AI_ENABLED", True)
    monkeypatch.setattr(provider_registry, "configured_provider", lambda: provider)
    return service, context, policy, event


@pytest.mark.asyncio
async def test_argos_never_advertises_or_accepts_tutor(tmp_path, monkeypatch):
    provider = ArgosProvider(packages_dir=str(tmp_path))
    provider.available = AsyncMock(return_value=True)
    service, context, _, _ = gateway(monkeypatch, provider)
    states = {c["service"]: c["state"] for c in (await service.capabilities(context))["capabilities"]}
    assert states["tutor"] == "unsupported_by_provider" and states["translation"] == "available"
    with pytest.raises(ServiceUnavailableError):
        await service.generate(context, TutorRequest(text="Explain fractions", lesson_id=uuid4()), uuid4(), service="tutor")
    service.repo.reserve.assert_not_awaited()


@pytest.mark.asyncio
async def test_permission_policy_and_locked_disable_are_not_bypassed(tmp_path, monkeypatch):
    provider = ArgosProvider(packages_dir=str(tmp_path))
    provider.available = AsyncMock(return_value=True)
    provider.generate_text = AsyncMock()
    service, context, policy, _ = gateway(monkeypatch, provider)
    request = TranslationRequest(text="Hello", source_language="en", target_language="es")
    context.permissions = []
    with pytest.raises(ForbiddenError):
        await service.generate(context, request, uuid4(), service="translation")
    context.permissions = ["ai.translate.use_own"]
    policy.provider_approved = False
    with pytest.raises(ServiceUnavailableError):
        await service.generate(context, request, uuid4(), service="translation")
    policy.provider_approved = True
    locked = SimpleNamespace(translation_enabled=False, provider_approved=True)
    service.repo.reserve.return_value = (SimpleNamespace(), locked)
    with pytest.raises(ServiceUnavailableError):
        await service.generate(context, request, uuid4(), service="translation")
    provider.generate_text.assert_not_awaited()
    service.session.rollback.assert_awaited_once()


def installed():
    value = os.environ.get("EDUNEXT_ARGOS_TEST_PACKAGES")
    if not value:
        pytest.skip("Explicit installed test models required; never download in tests")
    return Path(value)


@pytest.mark.asyncio
@pytest.mark.parametrize("source,target,text,expected", [("en", "es", "Hello world!", "hola"), ("es", "en", "El agua es importante.", "water")])
async def test_real_models_through_gateway_with_synthetic_policy(monkeypatch, source, target, text, expected):
    provider = ArgosProvider(packages_dir=str(installed()), timeout=60)
    assert await provider.available()
    service, context, _, event = gateway(monkeypatch, provider)
    answer = await service.generate(context, TranslationRequest(text=text, source_language=source, target_language=target), uuid4(), service="translation")
    assert expected in answer.text.casefold()
    assert answer.origin == "local_model" and answer.status == "generated_unverified"
    assert event.status == "succeeded" and event.input_units is None
    assert service.session.commit.await_count == 2


@pytest.mark.asyncio
async def test_long_output_rejected_instead_of_returning_silent_truncation():
    provider = ArgosProvider(packages_dir=str(installed()), timeout=60)
    with pytest.raises(ProviderFailure):
        await provider.generate_text(system="", payload={"text": "The students read a book in the classroom. " * 15, "source_language": "en", "target_language": "es"}, max_tokens=32)
