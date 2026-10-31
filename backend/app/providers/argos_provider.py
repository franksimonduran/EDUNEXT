"""Argos model packages on CPU, isolated per call; no pulls or remote fallback."""

import asyncio
import json
from pathlib import Path
import os
import sys
import time

from app.core.config import settings
from app.providers.base_provider import ProviderFailure, ProviderResult, TextProvider


class ArgosProvider(TextProvider):
    code = "argos_local"
    capabilities = frozenset({"translate_text"})

    def __init__(self, *, packages_dir=None, timeout=None):
        value = packages_dir if packages_dir is not None else settings.AI_ARGOS_PACKAGES_DIR
        if not value or not Path(value).is_absolute() or not Path(value).is_dir():
            raise ProviderFailure("An explicit installed local Argos model directory is required")
        self.packages_dir = str(Path(value).resolve())
        self.timeout = timeout if timeout is not None else settings.AI_TIMEOUT_SECONDS
        self._busy = False
        self._checked_at = float("-inf")
        self._available = False

    async def _invoke(self, request):
        # Fail fast instead of accumulating unbounded CPU jobs. One child per provider/process.
        if self._busy:
            raise ProviderFailure("Local translation is busy")
        self._busy = True
        process = None
        try:
            # Do not pass signing keys, provider keys or arbitrary ARGOS/cloud settings.
            env = {key: os.environ[key] for key in ("SystemRoot", "WINDIR", "PATH", "TEMP", "TMP", "USERPROFILE", "LOCALAPPDATA") if key in os.environ}
            env.update({"PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8", "OMP_NUM_THREADS": "2"})
            async with asyncio.timeout(self.timeout):
                process = await asyncio.create_subprocess_exec(
                    sys.executable, "-I", "-X", "utf8", str(Path(__file__).with_name("argos_worker.py")), self.packages_dir,
                    stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.DEVNULL, env=env, limit=65536,
                )
                process.stdin.write(json.dumps(request, ensure_ascii=False).encode("utf-8"))
                await process.stdin.drain()
                process.stdin.close()
                raw = bytearray()
                while chunk := await process.stdout.read(min(8192, 65537 - len(raw))):
                    raw.extend(chunk)
                    if len(raw) > 65536:
                        raise ProviderFailure("Local translation exceeded its output limit")
                await process.wait()
                if process.returncode != 0:
                    raise ProviderFailure("Local translation model unavailable")
                response = json.loads(raw)
                if not isinstance(response, dict) or response.get("ok") is not True:
                    raise ProviderFailure("Invalid local translation response")
                return response
        except (OSError, TimeoutError, ValueError, BrokenPipeError) as error:
            raise ProviderFailure(f"Local translation unavailable ({type(error).__name__})") from None
        finally:
            # Also runs on cancellation. Never leave a timed-out inference using CPU.
            if process is not None and process.returncode is None:
                try:
                    process.kill()
                except ProcessLookupError:
                    pass
                await process.wait()
            self._busy = False

    async def available(self):
        if time.monotonic() - self._checked_at < 15:
            return self._available
        try:
            response = await self._invoke({"operation": "check"})
            self._available = response.get("pairs") == ["en-es", "es-en"]
        except ProviderFailure:
            self._available = False
        self._checked_at = time.monotonic()
        return self._available

    async def generate_text(self, *, system, payload, max_tokens):
        # System prompts are deliberately not sent: this is translation, not a chat model.
        if set(payload) != {"text", "source_language", "target_language"}:
            raise ProviderFailure("Argos supports translation payloads only")
        pair = (payload.get("source_language"), payload.get("target_language"))
        if pair not in {("es", "en"), ("en", "es")} or not isinstance(payload.get("text"), str) or not 0 < len(payload["text"]) <= 1000:
            raise ProviderFailure("Unsupported translation input")
        if type(max_tokens) is not int or not 32 <= max_tokens <= 512:
            raise ProviderFailure("Invalid local translation limit")
        response = await self._invoke({"operation": "translate", **payload, "max_tokens": max_tokens})
        text = response.get("text")
        if not isinstance(text, str) or not text.strip() or len(text) > settings.AI_MAX_OUTPUT_CHARACTERS:
            raise ProviderFailure("Invalid local translation output")
        return ProviderResult(text)
