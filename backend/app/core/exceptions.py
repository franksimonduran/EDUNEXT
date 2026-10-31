"""Custom exceptions for the application."""

from typing import Any, Dict, Optional


class AithronException(Exception):
    """Base exception for EDUNEXT application."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class ConfigurationError(AithronException):
    """Raised when configuration is invalid."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, code="CONFIGURATION_ERROR", status_code=500, details=details)


class ValidationError(AithronException):
    """Raised when input validation fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, code="VALIDATION_ERROR", status_code=422, details=details)


class NotFoundError(AithronException):
    """Raised when a resource is not found."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, code="NOT_FOUND", status_code=404, details=details)


class UnauthorizedError(AithronException):
    """Raised when authentication is required."""

    def __init__(self, message: str = "Authentication required", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, code="UNAUTHORIZED", status_code=401, details=details)


class ForbiddenError(AithronException):
    """Raised when access is forbidden."""

    def __init__(self, message: str = "Access forbidden", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, code="FORBIDDEN", status_code=403, details=details)


class ConflictError(AithronException):
    """Raised when a unique resource already exists."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, code="CONFLICT", status_code=409, details=details)


class ServiceUnavailableError(AithronException):
    """Raised when a required service is unavailable."""

    def __init__(self, message: str = "Service temporarily unavailable", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, code="SERVICE_UNAVAILABLE", status_code=503, details=details)


class NotImplementedError(AithronException):
    """Raised when a feature is not yet implemented."""

    def __init__(self, message: str = "Feature not implemented", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, code="NOT_IMPLEMENTED", status_code=501, details=details)


from typing import Any, Dict, Optional