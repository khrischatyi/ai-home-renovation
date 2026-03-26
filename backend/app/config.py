from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


def _find_env_file() -> str:
    """Find .env file - works both locally and in Docker."""
    candidates = [
        Path("/app/.env"),  # Docker mount
        Path(__file__).resolve().parent.parent.parent.parent / ".env",  # Local dev
        Path(__file__).resolve().parent.parent / ".env",  # Fallback
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    return ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_find_env_file(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_home_renovation"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    DEBUG: bool = False
    APP_NAME: str = "AI Home Renovation Platform"
