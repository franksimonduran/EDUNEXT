"""Resource validation utilities."""

try:
    import magic
except ImportError:
    magic = None
import os
from typing import Optional, Tuple
from uuid import UUID

from app.db.models import ResourceType


# Magic numbers for file type detection
FILE_SIGNATURES = {
    ResourceType.IMAGE: {
        b"\x89PNG\r\n\x1a\n": "image/png",
        b"\xff\xd8\xff": "image/jpeg",
        b"GIF87a": "image/gif",
        b"GIF89a": "image/gif",
        b"RIFF": "image/webp",  # WebP starts with RIFF
    },
    ResourceType.AUDIO: {
        b"ID3": "audio/mpeg",
        b"\xff\xfb": "audio/mpeg",
        b"\xff\xf3": "audio/mpeg",
        b"\xff\xf2": "audio/mpeg",
        b"RIFF": "audio/wav",  # WAV starts with RIFF
        b"OggS": "audio/ogg",
    },
    ResourceType.VIDEO: {
        b"\x00\x00\x00\x18ftypmp4": "video/mp4",
        b"\x00\x00\x00\x1cftypmp4": "video/mp4",
        b"\x00\x00\x00\x20ftypmp4": "video/mp4",
        b"RIFF": "video/webm",  # WebM starts with RIFF
    },
    ResourceType.DOCUMENT: {
        b"%PDF": "application/pdf",
        b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1": "application/msword",  # DOC
        b"PK\x03\x04": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # DOCX
    },
    ResourceType.ARCHIVE: {
        b"PK\x03\x04": "application/zip",
        b"\x1f\x8b\x08": "application/gzip",
        b"ustar": "application/x-tar",
    },
}

ALLOWED_EXTENSIONS = {
    ResourceType.IMAGE: {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"},
    ResourceType.AUDIO: {".mp3", ".wav", ".ogg", ".m4a", ".flac"},
    ResourceType.VIDEO: {".mp4", ".webm", ".ogg", ".mov", ".avi"},
    ResourceType.DOCUMENT: {".pdf", ".doc", ".docx", ".txt", ".md"},
    ResourceType.INTERACTIVE: {".json", ".html", ".js", ".css"},
    ResourceType.LINK: {".url", ".webloc"},
    ResourceType.ARCHIVE: {".zip", ".tar", ".gz", ".tar.gz"},
    ResourceType.OTHER: set(),
}

MAX_FILE_SIZES = {
    ResourceType.IMAGE: 10 * 1024 * 1024,      # 10 MB
    ResourceType.AUDIO: 20 * 1024 * 1024,      # 20 MB
    ResourceType.VIDEO: 100 * 1024 * 1024,     # 100 MB
    ResourceType.DOCUMENT: 50 * 1024 * 1024,   # 50 MB
    ResourceType.INTERACTIVE: 5 * 1024 * 1024, # 5 MB
    ResourceType.LINK: 1024,                   # 1 KB
    ResourceType.ARCHIVE: 100 * 1024 * 1024,   # 100 MB
    ResourceType.OTHER: 10 * 1024 * 1024,      # 10 MB
}


def detect_file_type(file_content: bytes) -> Tuple[Optional[ResourceType], Optional[str]]:
    """
    Detect file type from content using magic numbers.
    
    Returns:
        Tuple of (ResourceType, media_type) or (None, None) if unknown.
    """
    if file_content.startswith(b"RIFF"):
        if file_content[8:12] == b"WEBP":
            return ResourceType.IMAGE, "image/webp"
        if file_content[8:12] == b"WAVE":
            return ResourceType.AUDIO, "audio/wav"
        return None, None
    for resource_type, signatures in FILE_SIGNATURES.items():
        for signature, media_type in signatures.items():
            if signature == b"RIFF":
                continue
            if file_content.startswith(signature):
                return resource_type, media_type
    
    # Fallback to python-magic if available
    try:
        mime_type = magic.from_buffer(file_content, mime=True)
        return _mime_to_resource_type(mime_type), mime_type
    except Exception:
        pass
    
    return None, None


def _mime_to_resource_type(mime_type: str) -> Optional[ResourceType]:
    """Map MIME type to ResourceType."""
    if mime_type.startswith("image/"):
        return ResourceType.IMAGE
    elif mime_type.startswith("audio/"):
        return ResourceType.AUDIO
    elif mime_type.startswith("video/"):
        return ResourceType.VIDEO
    elif mime_type in [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
    ]:
        return ResourceType.DOCUMENT
    elif mime_type in [
        "application/zip",
        "application/x-tar",
        "application/gzip",
    ]:
        return ResourceType.ARCHIVE
    elif mime_type == "application/json":
        return ResourceType.INTERACTIVE
    return ResourceType.OTHER


def validate_file_extension(filename: str, resource_type: ResourceType) -> bool:
    """Validate file extension matches resource type."""
    ext = os.path.splitext(filename.lower())[1]
    allowed = ALLOWED_EXTENSIONS.get(resource_type, set())
    return ext in allowed if allowed else True


def validate_file_size(file_size: int, resource_type: ResourceType) -> bool:
    """Validate file size is within limits for resource type."""
    max_size = MAX_FILE_SIZES.get(resource_type, 10 * 1024 * 1024)
    return file_size <= max_size


def validate_resource_file(
    file_content: bytes,
    filename: str,
    expected_type: ResourceType,
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate a resource file completely.
    
    Returns:
        Tuple of (is_valid, detected_type, media_type)
    """
    # Check file size
    if not validate_file_size(len(file_content), expected_type):
        return False, None, None
    
    # Check extension
    if not validate_file_extension(filename, expected_type):
        return False, None, None
    
    # Detect actual type
    detected_type, media_type = detect_file_type(file_content)
    
    if detected_type != expected_type:
        # Unknown content is not proof that the declared extension/type is safe.
        return False, None, None
    
    return True, detected_type, media_type


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage."""
    # Remove path components
    name = os.path.basename(filename)
    # Keep only safe characters
    safe_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-"
    name = "".join(c if c in safe_chars else "_" for c in name)
    # Limit length
    if len(name) > 255:
        base, ext = os.path.splitext(name)
        name = base[:255 - len(ext)] + ext
    return name


def generate_resource_path(
    institution_id: UUID,
    resource_type: ResourceType,
    filename: str,
) -> str:
    """Generate a storage path for a resource."""
    safe_name = sanitize_filename(filename)
    return f"institutions/{institution_id}/resources/{resource_type.value}/{safe_name}"
