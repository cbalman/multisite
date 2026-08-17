import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings

IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
VIDEO_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
}


def _size_limit(kind: str) -> int:
    mb = settings.MAX_IMAGE_MB if kind == "image" else settings.MAX_VIDEO_MB
    return mb * 1024 * 1024


def save_upload(site_id: int, kind: str, file: UploadFile) -> str:
    if kind not in {"image", "video"}:
        raise HTTPException(status_code=400, detail="Tipo de archivo inválido")

    content_type = (file.content_type or "").lower()
    mapping = IMAGE_TYPES if kind == "image" else VIDEO_TYPES
    ext = mapping.get(content_type)
    if not ext:
        allowed = ", ".join(mapping.keys())
        raise HTTPException(status_code=400, detail=f"Formato no permitido. Usá: {allowed}")

    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="El archivo está vacío")
    if len(data) > _size_limit(kind):
        limit = settings.MAX_IMAGE_MB if kind == "image" else settings.MAX_VIDEO_MB
        raise HTTPException(status_code=400, detail=f"El archivo supera {limit} MB")

    folder = Path(settings.MEDIA_ROOT) / f"site_{site_id}"
    folder.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    (folder / name).write_bytes(data)
    return f"/media/site_{site_id}/{name}"
