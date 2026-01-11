from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    """
    Application configuration settings.
    
    Loads configuration from environment variables with safe production defaults.
    This class can be imported anywhere without side effects - it only loads
    environment variables when the settings instance is created.
    
    Attributes:
        groq_api_key: API key for Groq LLM service
        env: Environment name (development, staging, production)
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    
    groq_api_key: str
    
    env: Literal["development", "staging", "production"] = "production"
    
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Global settings instance - created on first import
# Safe to import anywhere without side effects
settings = Settings()

