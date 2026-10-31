"""Opt-in Google AI Studio REST adapter. No SDK, redirects, tools or retries."""
import asyncio
import json
import re

import httpx

from app.core.config import settings
from app.providers.base_provider import ProviderFailure, ProviderResult, TextProvider
from app.schemas.ai import ModelAnswer


class GeminiProvider(TextProvider):
    code = "gemini_online"
    capabilities = frozenset({"generate_text"})

    def __init__(self, *, model=None, api_key=None, transport=None):
        self.model = model if model is not None else settings.AI_MODEL
        self._key = api_key if api_key is not None else settings.GEMINI_API_KEY.get_secret_value()
        if not re.fullmatch(r"gemini-[a-zA-Z0-9._-]{1,100}", self.model or "") or not self._key or any(c in self._key for c in "\r\n"):
            raise ProviderFailure("Gemini configuration unavailable")
        self.transport = transport

    async def _json(self, method, suffix="", body=None):
        # Key in a header, never in URLs, error bodies, evidence or public configuration.
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}{suffix}"
        try:
            async with asyncio.timeout(settings.AI_TIMEOUT_SECONDS):
                async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS, transport=self.transport,
                    trust_env=False, follow_redirects=False) as client:
                    async with client.stream(method, url, headers={"x-goog-api-key": self._key}, json=body) as response:
                        if response.status_code != 200:
                            raise ProviderFailure("Gemini request unavailable")
                        raw = bytearray()
                        async for chunk in response.aiter_bytes():
                            raw.extend(chunk)
                            if len(raw) > 65536:
                                raise ProviderFailure("Gemini response exceeded limit")
                        data = json.loads(raw)
                        if not isinstance(data, dict):
                            raise ValueError()
                        return data
        except (httpx.HTTPError, TimeoutError, ValueError, ProviderFailure):
            raise ProviderFailure("Gemini request unavailable or invalid") from None

    async def available(self):
        try:
            data = await self._json("GET")
            return data.get("name") == f"models/{self.model}" and "generateContent" in data.get("supportedGenerationMethods", [])
        except (ProviderFailure, TypeError):
            return False

    async def generate_text(self, *, system, payload, max_tokens):
        if type(max_tokens) is not int or not 32 <= max_tokens <= 512:
            raise ProviderFailure("Invalid generation limit")
        data = await self._json("POST", ":generateContent", {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": json.dumps(payload, ensure_ascii=False)}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": max_tokens,
                "responseMimeType": "application/json",
                "responseSchema": {"type": "OBJECT", "properties": {"answer": {"type": "STRING"}}, "required": ["answer"]}},
        })
        try:
            if data.get("promptFeedback", {}).get("blockReason"):
                raise ValueError()
            candidates = data["candidates"]
            if not isinstance(candidates, list) or len(candidates) != 1:
                raise ValueError()
            candidate = candidates[0]
            if candidate.get("finishReason") != "STOP" or any(r.get("blocked") for r in candidate.get("safetyRatings", [])):
                raise ValueError()
            content = candidate["content"]
            if content.get("role") != "model":
                raise ValueError()
            parts = content["parts"]
            if not parts or any(not isinstance(p, dict) or set(p) != {"text"} or not isinstance(p["text"], str) for p in parts):
                raise ValueError()
            answer = ModelAnswer.model_validate_json("".join(p["text"] for p in parts))
            usage = data.get("usageMetadata", {})
            units = [usage.get("promptTokenCount"), usage.get("candidatesTokenCount")]
            if any(u is not None and (type(u) is not int or u < 0) for u in units):
                raise ValueError()
            return ProviderResult(answer.answer, *units)
        except (KeyError, ValueError, TypeError, AttributeError):
            raise ProviderFailure("Invalid structured Gemini response") from None
