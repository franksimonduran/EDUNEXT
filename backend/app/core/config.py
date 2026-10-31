"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from typing import List, Optional, Literal
from urllib.parse import urlsplit, parse_qsl

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator
from pydantic import SecretStr, AliasChoices


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        hide_input_in_errors=True,
    )

    # Application
    APP_NAME: str = "EDUNEXT Backend"
    APP_VERSION: str = "0.1.0"
    APP_ENV: Literal["development", "test", "staging", "production"] = "development"
    DEBUG: bool = True

    # API
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    TRUSTED_HOSTS: str = "localhost,127.0.0.1,api"

    # CORS (comma-separated list)
    CORS_ORIGINS: str = "http://127.0.0.1:8080,http://localhost:8080"

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "aithron-edu"
    JWT_AUDIENCE: str = "aithron-edu-web"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    SESSION_MAX_AGE_SECONDS: int = 2592000  # 30 days
    LOGIN_RATE_LIMIT: int = 5
    LOGIN_RATE_WINDOW_SECONDS: int = 300

    # CSRF
    CSRF_SECRET_KEY: str = "dev-csrf-secret-change-in-production"
    CSRF_COOKIE_NAME: str = "csrf_token"
    CSRF_HEADER_NAME: str = "X-CSRF-Token"

    # Cookie settings
    COOKIE_SECURE: bool = False  # Set to True in production with HTTPS
    COOKIE_SAMESITE: str = "lax"
    REFRESH_COOKIE_NAME: str = "refresh_token"
    REFRESH_COOKIE_PATH: str = "/api/v1/auth/refresh"

    # Database
    DATABASE_URL: Optional[str] = None
    TEST_DATABASE_URL: Optional[str] = None
    DATABASE_SSL_MODE: Literal["disable", "verify-full"] = "disable"
    DATABASE_SSL_CA_FILE: Optional[str] = None
    DATABASE_CONNECT_TIMEOUT_SECONDS: int = Field(10, ge=1, le=60)
    DATABASE_COMMAND_TIMEOUT_SECONDS: int = Field(30, ge=1, le=300)
    HEALTHCHECK_TIMEOUT_SECONDS: int = Field(3, ge=1, le=10)
    EXPECTED_ALEMBIC_REVISION: Optional[str] = None

    # Logging
    LOG_LEVEL: str = "INFO"

    # Feature Flags
    SYNC_PROTOCOL_V1_ENABLED: bool = False
    AITHRON_AI_ENABLED: bool = Field(default=False, validation_alias=AliasChoices("EDUNEXT_AI_ENABLED", "AITHRON_AI_ENABLED"))
    AI_PROVIDER_CODE: str = ""
    AI_MODEL: str = ""
    AI_ARGOS_PACKAGES_DIR: str = ""
    AI_OLLAMA_URL: str = "http://127.0.0.1:11434"
    AI_LOCAL_ONLY_ATTESTED: bool = False
    AI_REMOTE_PROCESSING_APPROVED: bool = False
    GEMINI_API_KEY: SecretStr = Field(default=SecretStr(""), repr=False)
    AI_TIMEOUT_SECONDS: int = Field(20, ge=1, le=60)
    AI_MAX_INFLIGHT_PER_INSTITUTION: int = Field(2, ge=1, le=4)
    AI_MAX_OUTPUT_CHARACTERS: int = Field(3000, ge=100, le=6000)
    AI_RETENTION_SWEEP_SECONDS: int = Field(3600, ge=60, le=86400)
    SYNC_ENABLED: bool = False
    REPORT_MIN_GROUP_SIZE: int = Field(5, ge=5, le=100)

    @model_validator(mode="after")
    def validate_security_configuration(self):
        origins = self.cors_origins_list
        if "*" in origins:
            raise ValueError("Credentialed CORS requires explicit origins")
        for origin in origins:
            parsed_origin = urlsplit(origin)
            if parsed_origin.scheme not in {"http", "https"} or not parsed_origin.hostname or parsed_origin.username or parsed_origin.password or parsed_origin.path or parsed_origin.query or parsed_origin.fragment:
                raise ValueError("CORS entries must be exact HTTP(S) origins, without credentials or paths")
        if self.DATABASE_URL:
            url = urlsplit(self.DATABASE_URL)
            if url.scheme not in {"postgresql", "postgresql+asyncpg", "postgresql+psycopg2"} or not url.hostname or not url.path.strip("/"):
                raise ValueError("Explicit PostgreSQL database URL required; value withheld")
            if any(key.lower() in {"ssl", "sslmode", "sslrootcert"} for key, _ in parse_qsl(url.query)):
                raise ValueError("Use DATABASE_SSL_MODE and DATABASE_SSL_CA_FILE, not driver-specific TLS query parameters")
        if self.DATABASE_SSL_MODE == "verify-full" and not self.DATABASE_SSL_CA_FILE:
            raise ValueError("verify-full requires an explicit CA bundle file")
        if self.APP_ENV in {"staging", "production"}:
            secrets = (self.SECRET_KEY, self.CSRF_SECRET_KEY)
            if any(len(value) < 32 or value.startswith(("dev-", "replace-")) for value in secrets):
                raise ValueError("Production requires operator-provided strong secrets")
            if self.SECRET_KEY == self.CSRF_SECRET_KEY:
                raise ValueError("Signing and CSRF secrets must be different")
            if self.DEBUG or not self.COOKIE_SECURE or not self.DATABASE_URL:
                raise ValueError("Production requires DEBUG=false, secure cookies and explicit database configuration")
            if not origins or any(not origin.startswith("https://") for origin in origins):
                raise ValueError("Production CORS requires explicit HTTPS origins")
            if self.DATABASE_SSL_MODE != "verify-full" or not self.EXPECTED_ALEMBIC_REVISION:
                raise ValueError("Staging/production require verified database TLS and expected migration revision")
            if urlsplit(self.DATABASE_URL).username in {None, "postgres"}:
                raise ValueError("Use an explicit non-administrative application database role")
            if not self.TRUSTED_HOSTS or "*" in self.TRUSTED_HOSTS or self.TRUSTED_HOSTS == "localhost,127.0.0.1,api":
                raise ValueError("Staging/production require explicit trusted hosts")
        return self

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
