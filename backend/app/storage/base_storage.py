"""Base storage interface for resource files."""

from abc import ABC, abstractmethod
from typing import BinaryIO, Optional
from uuid import UUID


class BaseStorage(ABC):
    """Abstract base class for storage backends."""

    @abstractmethod
    async def save(self, path: str, file: BinaryIO, content_type: str) -> str:
        """Save a file and return the storage path."""
        pass

    @abstractmethod
    async def get(self, path: str) -> Optional[BinaryIO]:
        """Get a file by path."""
        pass

    @abstractmethod
    async def delete(self, path: str) -> bool:
        """Delete a file by path."""
        pass

    @abstractmethod
    async def exists(self, path: str) -> bool:
        """Check if a file exists."""
        pass

    @abstractmethod
    async def get_url(self, path: str, expires_in: int = 3600) -> str:
        """Get a signed URL for temporary access."""
        pass

    @abstractmethod
    async def get_metadata(self, path: str) -> dict:
        """Get file metadata (size, checksum, etc.)."""
        pass


class StorageConfig:
    """Configuration for storage backends."""

    def __init__(
        self,
        base_path: str = "/var/lib/athron-edu/resources",
        base_url: str = "/api/v1/resources",
        max_file_size: int = 100 * 1024 * 1024,
    ):
        self.base_path = base_path
        self.base_url = base_url
        self.max_file_size = max_file_size