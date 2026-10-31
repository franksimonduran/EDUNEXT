from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class ProviderResult:
    text: str
    input_units: int | None = None
    output_units: int | None = None


class ProviderFailure(Exception):
    """Sanitized adapter failure; never expose provider bodies to public clients."""


class TextProvider(ABC):
    code = "unconfigured"
    capabilities = frozenset()

    @abstractmethod
    async def available(self) -> bool:
        ...

    @abstractmethod
    async def generate_text(self, *, system: str, payload: dict, max_tokens: int) -> ProviderResult:
        ...
