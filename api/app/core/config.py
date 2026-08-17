from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Multisite"
    APP_ENV: str = "development"
    APP_DOMAIN: str = "localhost"
    APP_URL: str = "http://localhost"

    DATABASE_URL: str = "postgresql+psycopg://multisite:multisite@db:5432/multisite"

    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    MEDIA_ROOT: str = "/app/uploads"
    MAX_IMAGE_MB: int = 5
    MAX_VIDEO_MB: int = 80
    MAX_VIDEOS_PER_PUBLICATION: int = 1
    MAX_IMAGES_PER_PUBLICATION: int = 8

    CORS_ORIGINS: str = "http://localhost,http://localhost:5173"

    SUPERADMIN_NAME: str = "Super Admin"
    SUPERADMIN_EMAIL: str = "admin@multisite.local"
    SUPERADMIN_PASSWORD: str = "admin123456"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
