"""Local filesystem storage implementation."""

import aiofiles
import aiofiles.os
import asyncio
import hashlib
import os
from pathlib import Path, PureWindowsPath
import tempfile
from urllib.parse import quote
from typing import BinaryIO, Optional
from uuid import UUID

from app.storage.base_storage import BaseStorage, StorageConfig


class LocalStorage(BaseStorage):
    """Local filesystem storage backend."""

    def __init__(self, config: StorageConfig):
        self.config = config
        self._ensure_base_path()

    def _ensure_base_path(self) -> None:
        """Ensure the base storage path exists."""
        Path(self.config.base_path).mkdir(parents=True, exist_ok=True)

    def _get_full_path(self, path: str, *, allow_root: bool = False) -> Path:
        """Get the full filesystem path."""
        if not isinstance(path, str) or "\x00" in path or Path(path).is_absolute() or PureWindowsPath(path).drive or PureWindowsPath(path).root:
            raise ValueError("Invalid path")
        parts = [part for part in path.replace("\\", "/").split("/") if part]
        reserved = {"CON", "PRN", "AUX", "NUL", *(f"COM{i}" for i in range(1, 10)), *(f"LPT{i}" for i in range(1, 10))}
        if any(part in {".", ".."} or part.rstrip(" .") != part
               or any(char in part for char in '<>:"|?*')
               or part.split(".")[0].upper() in reserved for part in parts):
            raise ValueError("Invalid path")
        base = Path(self.config.base_path).resolve()
        candidate = base.joinpath(*parts).resolve()
        if not candidate.is_relative_to(base) or (candidate == base and not allow_root):
            raise ValueError("Path is outside the configured storage root")
        return candidate

    @staticmethod
    def _read_bounded(file: BinaryIO, maximum: int) -> bytes:
        chunks, remaining = [], maximum + 1
        while remaining > 0:
            chunk = file.read(min(65536, remaining))
            if not isinstance(chunk, bytes):
                raise ValueError("A binary file is required")
            if not chunk:
                break
            chunks.append(chunk)
            remaining -= len(chunk)
        if remaining <= 0:
            raise ValueError(f"File size exceeds maximum ({maximum} bytes)")
        return b"".join(chunks)

    @staticmethod
    def _atomic_write(full_path: Path, data: bytes) -> None:
        """Replace only after the complete bounded payload is written and flushed."""
        full_path.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temporary = tempfile.mkstemp(prefix=".aithron-upload-", dir=full_path.parent)
        try:
            with os.fdopen(descriptor, "wb") as stream:
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(temporary, full_path)
        finally:
            # This helper owns only this newly created temporary file, never caller data.
            if os.path.exists(temporary):
                os.unlink(temporary)

    async def save(self, path: str, file: BinaryIO, content_type: str) -> str:
        """Save a file to local storage."""
        self._get_full_path(path)
        # Read at most the accepted limit plus one byte, before opening any destination.
        content = await asyncio.to_thread(self._read_bounded, file, self.config.max_file_size)
        return await self.save_bytes(path, content, content_type)

    async def save_bytes(self, path: str, data: bytes, content_type: str) -> str:
        """Save bytes to local storage."""
        full_path = self._get_full_path(path)
        if len(data) > self.config.max_file_size:
            raise ValueError(f"File size exceeds maximum ({self.config.max_file_size} bytes)")
        await asyncio.to_thread(self._atomic_write, full_path, data)
        
        return path

    async def get(self, path: str) -> Optional[BinaryIO]:
        """Get a file from local storage."""
        full_path = self._get_full_path(path)
        if not await aiofiles.os.path.exists(full_path):
            return None
        return await aiofiles.open(full_path, "rb")

    async def get_bytes(self, path: str) -> Optional[bytes]:
        """Get file content as bytes."""
        full_path = self._get_full_path(path)
        if not await aiofiles.os.path.exists(full_path):
            return None
        async with aiofiles.open(full_path, "rb") as f:
            data = await f.read(self.config.max_file_size + 1)
            if len(data) > self.config.max_file_size:
                raise ValueError("Stored file exceeds the configured read limit")
            return data

    async def delete(self, path: str) -> bool:
        """Delete a file from local storage."""
        full_path = self._get_full_path(path)
        if await aiofiles.os.path.exists(full_path):
            await aiofiles.os.remove(full_path)
            return True
        return False

    async def exists(self, path: str) -> bool:
        """Check if a file exists in local storage."""
        full_path = self._get_full_path(path)
        return await aiofiles.os.path.exists(full_path)

    async def get_url(self, path: str, expires_in: int = 3600) -> str:
        """Get a URL for local file access."""
        # For local storage, return the API endpoint URL
        self._get_full_path(path)
        return f"{self.config.base_url}/{quote(path.replace(chr(92), '/'), safe='/')}/download"

    async def get_metadata(self, path: str) -> dict:
        """Get file metadata."""
        full_path = self._get_full_path(path)
        if not await aiofiles.os.path.exists(full_path):
            return {}
        
        stat = await aiofiles.os.stat(full_path)
        
        # Calculate checksum
        digest = hashlib.sha256()
        async with aiofiles.open(full_path, "rb") as f:
            while chunk := await f.read(65536):
                digest.update(chunk)
        
        return {
            "size": stat.st_size,
            "checksum": digest.hexdigest(),
            "checksum_algorithm": "sha256",
            "modified_at": stat.st_mtime,
        }

    async def list_files(self, prefix: str = "") -> list[str]:
        """List files under a prefix."""
        base = self._get_full_path(prefix, allow_root=True)
        if not await aiofiles.os.path.exists(base):
            return []
        
        files = []
        async for root, dirs, filenames in aiofiles.os.walk(base):
            for filename in filenames:
                full = Path(root) / filename
                rel = full.relative_to(self.config.base_path)
                files.append(str(rel))
        return files
