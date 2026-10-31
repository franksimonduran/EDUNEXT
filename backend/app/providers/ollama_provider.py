"""Documented Ollama /api/chat adapter. Strict loopback-only, no auto pulls/cloud."""

import asyncio
import json
import time
from urllib.parse import urlsplit

import httpx

from app.core.config import settings
from app.providers.base_provider import ProviderFailure, ProviderResult, TextProvider
from app.schemas.ai import ModelAnswer


class OllamaProvider(TextProvider):
    code = "ollama_local"
    capabilities = frozenset({"generate_text", "translate_text"})

    def __init__(self, *, model=None, base_url=None, transport=None):
        self.model = model if model is not None else settings.AI_MODEL
        self.url = (base_url or settings.AI_OLLAMA_URL).rstrip("/")
        parsed = urlsplit(self.url)
        if (parsed.scheme != "http" or parsed.hostname not in {"localhost", "127.0.0.1", "::1"}
            or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path):
            raise ProviderFailure("Only a loopback Ollama endpoint is permitted")
        if not self.model or len(self.model) > 128 or "cloud" in self.model.casefold():
            raise ProviderFailure("A verified installed local model must be configured")
        self.transport = transport
        self.failures = 0
        self.retry_after = 0.0

    async def _json(self, method, path, body=None):
        if time.monotonic() < self.retry_after:
            raise ProviderFailure("Provider temporarily unavailable")
        try:
            async with asyncio.timeout(settings.AI_TIMEOUT_SECONDS):
                async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS, transport=self.transport,
                    trust_env=False, follow_redirects=False) as client:
                    async with client.stream(method, self.url+path, json=body) as response:
                        if response.status_code != 200:
                            raise ProviderFailure("Provider request failed")
                        raw = bytearray()
                        async for chunk in response.aiter_bytes():
                            raw.extend(chunk)
                            if len(raw) > 65536:
                                raise ProviderFailure("Provider response exceeded its limit")
                        result = json.loads(raw)
                        if not isinstance(result, dict):
                            raise ProviderFailure("Invalid provider response")
            if method == "POST":
                self.failures = 0
            return result
        except (httpx.HTTPError, TimeoutError, ValueError, ProviderFailure):
            self.failures += 1
            if self.failures >= 3:
                self.retry_after = time.monotonic()+30
            raise ProviderFailure("Local model request unavailable or invalid") from None

    async def available(self):
        try:
            data = await self._json("GET", "/api/tags")
            return any(isinstance(item, dict) and item.get("name") == self.model
                and not item.get("remote_model") and not item.get("remote_host") for item in data.get("models", []))
        except (ProviderFailure, TypeError):
            return False

    async def generate_text(self, *, system, payload, max_tokens):
        data = await self._json("POST", "/api/chat", {
            "model": self.model, "stream": False, "keep_alive": "0",
            "format": ModelAnswer.model_json_schema(),
            "messages": [{"role": "system", "content": system},
                         {"role": "user", "content": json.dumps(payload, ensure_ascii=False)}],
            "options": {"num_predict": max_tokens, "num_ctx": 4096, "temperature": 0.2},
        })
        try:
            message = data["message"]
            if data.get("model") != self.model or data.get("done") is not True or message.get("role") != "assistant" or message.get("tool_calls"):
                raise ValueError("Incomplete or tool-bearing response")
            if data.get("done_reason") == "length":
                raise ValueError("Truncated response")
            answer = ModelAnswer.model_validate_json(message["content"])
            units = [data.get("prompt_eval_count"), data.get("eval_count")]
            if any(u is not None and (type(u) is not int or u < 0) for u in units):
                raise ValueError("Invalid usage")
            return ProviderResult(answer.answer, *units)
        except (KeyError, TypeError, ValueError, AttributeError):
            raise ProviderFailure("Invalid structured provider response") from None
