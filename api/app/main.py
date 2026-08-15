from pathlib import Path
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.bootstrap import ensure_schema_patches, ensure_superadmin
from app.core.config import settings
from app.core.database import Base, engine


def _bootstrap_runtime() -> None:
    """Skipped when TESTING=1 — tests manage schema themselves."""
    if os.getenv("TESTING") == "1":
        return
    Base.metadata.create_all(bind=engine)
    ensure_schema_patches()
    Path(settings.MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
    ensure_superadmin()


_bootstrap_runtime()

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Media folder must exist even in tests (StaticFiles checks at mount time)
Path(settings.MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")
app.include_router(api_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
