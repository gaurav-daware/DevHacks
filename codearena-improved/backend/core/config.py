from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mongodb+srv://GauravDaware:Gaurav@99@cluster0.xs9jcju.mongodb.net/codearena"

    # Judge0
    JUDGE0_URL: str = "http://localhost:2358"

    # Gemini AI
    GEMINI_API_KEY: str = ""

    # Redis (for pub/sub in WebSockets)
    REDIS_URL: str = "redis://localhost:6379"

    # Frontend URL (for CORS)
    FRONTEND_URL: str = "http://localhost:3000"

    # JWT (for verifying NextAuth sessions if needed)
    NEXTAUTH_SECRET: str = "hackathon-secret-key-123"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
