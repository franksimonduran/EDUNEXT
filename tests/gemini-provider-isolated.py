"""Standalone: synthetic key, MockTransport, no DB, no dotenv, no Google calls."""
import asyncio
import hashlib
import json
import os
from pathlib import Path
import sys
import types

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from pydantic import SecretStr
import httpx

settings = types.SimpleNamespace(AI_MODEL="gemini-synthetic-test", GEMINI_API_KEY=SecretStr("synthetic-not-a-real-key"),
    AI_TIMEOUT_SECONDS=2, AITHRON_AI_ENABLED=False, AI_REMOTE_PROCESSING_APPROVED=False,
    AI_LOCAL_ONLY_ATTESTED=False, AI_PROVIDER_CODE="gemini_online", AI_OLLAMA_URL="http://127.0.0.1:11434", AI_ARGOS_PACKAGES_DIR="")
fake_config = types.ModuleType("app.core.config")
fake_config.settings = settings
sys.modules["app.core.config"] = fake_config
from app.providers.gemini_provider import GeminiProvider
from app.providers.base_provider import ProviderFailure
from app.providers import provider_registry


async def main():
    checks = []
    async def check(name, run):
        await run()
        checks.append({"name": name, "pass": True})

    async def gates():
        assert provider_registry.configured_provider() is None
        settings.AITHRON_AI_ENABLED = True
        assert provider_registry.configured_provider() is None
        settings.AI_REMOTE_PROCESSING_APPROVED = True
        settings.AI_LOCAL_ONLY_ATTESTED = True
        assert provider_registry.configured_provider() is None
        settings.AI_LOCAL_ONLY_ATTESTED = False
        assert isinstance(provider_registry.configured_provider(), GeminiProvider)
        settings.GEMINI_API_KEY = SecretStr("")
        assert provider_registry.configured_provider() is None
        settings.GEMINI_API_KEY = SecretStr("synthetic-not-a-real-key")
    await check("Disabled by default; remote approval and non-local declaration required", gates)

    async def valid():
        def handler(request):
            assert request.url.host == "generativelanguage.googleapis.com"
            assert not request.url.query
            assert request.headers["x-goog-api-key"] == "synthetic-not-a-real-key"
            if request.method == "GET":
                return httpx.Response(200, json={"name": "models/gemini-synthetic-test", "supportedGenerationMethods": ["generateContent"]})
            body = json.loads(request.content)
            assert "tools" not in body and len(body["contents"]) == 1
            assert body["generationConfig"]["maxOutputTokens"] == 128
            return httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"role": "model", "parts": [{"text": '{"answer":"Una pista educativa."}'}]}}], "usageMetadata": {"promptTokenCount": 10, "candidatesTokenCount": 5}})
        provider = GeminiProvider(transport=httpx.MockTransport(handler))
        assert await provider.available()
        result = await provider.generate_text(system="Synthetic instruction", payload={"question": "Synthetic question"}, max_tokens=128)
        assert result.text == "Una pista educativa." and result.output_units == 5
    await check("Fixed HTTPS endpoint, key header, bounded structured output and usage", valid)

    async def invalid():
        for response in [httpx.Response(401, text="synthetic-not-a-real-key"),
                         httpx.Response(302, headers={"location": "https://example.invalid"}),
                         httpx.Response(200, content=b"x" * 65537),
                         httpx.Response(200, json={"promptFeedback": {"blockReason": "SAFETY"}}),
                         httpx.Response(200, json={"candidates": [{"finishReason": "MAX_TOKENS"}]}),
                         httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"role": "model", "parts": [{"functionCall": {"name": "x"}}]}}]})]:
            calls = []
            def handler(request):
                calls.append(request)
                return response
            provider = GeminiProvider(transport=httpx.MockTransport(handler))
            try:
                await provider.generate_text(system="test", payload={}, max_tokens=128)
                raise AssertionError("Invalid output accepted")
            except ProviderFailure as error:
                assert "synthetic-not-a-real-key" not in str(error)
            assert len(calls) == 1
    await check("Errors sanitized; redirects, oversized, blocked, truncated and tool responses rejected without retries", invalid)

    async def model_names():
        for name in ["../gemini", "gemini-test?key=x", "https://example.invalid", ""]:
            try:
                GeminiProvider(model=name)
                raise AssertionError("Unsafe model accepted")
            except ProviderFailure:
                pass
    await check("Model cannot change endpoint or inject URL parameters", model_names)
    files = ["backend/app/providers/gemini_provider.py", "backend/app/providers/provider_registry.py", "backend/app/core/config.py",
        "backend/app/services/ai_gateway_service.py", "backend/app/repositories/ai_repository.py", "backend/app/schemas/ai.py"]
    hashes = {file: hashlib.sha256((ROOT / file).read_bytes()).hexdigest() for file in files}
    report = {"pass": True, "scope": "Synthetic isolated provider/registry tests; no credentials, dotenv, database, real API calls or E2E.", "checks": checks, "hashes": hashes}
    if os.environ.get("AITHRON_FINAL_VALIDATION") == "1":
        import time
        directory = ROOT / "docs/final/evidence" / f"gemini-provider-{time.time_ns()}"
        directory.mkdir()
        (directory / "GEMINI_PROVIDER.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
