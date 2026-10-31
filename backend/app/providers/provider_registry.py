from app.core.config import settings
from app.providers.base_provider import ProviderFailure
from app.providers.ollama_provider import OllamaProvider
from app.providers.argos_provider import ArgosProvider
from app.providers.gemini_provider import GeminiProvider
import hashlib

_provider = None
_configuration = None


def configured_provider():
    global _provider, _configuration
    if not settings.AITHRON_AI_ENABLED:
        return None
    remote = settings.AI_PROVIDER_CODE == "gemini_online"
    if remote:
        if not settings.AI_REMOTE_PROCESSING_APPROVED or settings.AI_LOCAL_ONLY_ATTESTED or not settings.GEMINI_API_KEY.get_secret_value():
            return None
    elif settings.AI_PROVIDER_CODE not in {"ollama_local", "argos_local"} or not settings.AI_LOCAL_ONLY_ATTESTED:
        return None
    configuration = (settings.AI_PROVIDER_CODE, settings.AI_MODEL, settings.AI_OLLAMA_URL, settings.AI_ARGOS_PACKAGES_DIR, settings.AI_TIMEOUT_SECONDS,
        hashlib.sha256(settings.GEMINI_API_KEY.get_secret_value().encode()).digest() if remote else None)
    if _configuration != configuration or _provider is None:
        try:
            _provider = GeminiProvider() if remote else ArgosProvider() if settings.AI_PROVIDER_CODE == "argos_local" else OllamaProvider()
            _configuration = configuration
        except ProviderFailure:
            return None
    return _provider
