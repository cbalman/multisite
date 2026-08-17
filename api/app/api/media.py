from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.core.deps import get_owned_site
from app.core.media import save_upload
from app.models import Site
from app.schemas import UploadOut

router = APIRouter()


@router.post("/upload", response_model=UploadOut)
def upload_media(
    kind: str = Query(..., pattern="^(image|video)$"),
    file: UploadFile = File(...),
    site: Site = Depends(get_owned_site),
):
    url = save_upload(site.id, kind, file)
    return UploadOut(url=url, kind=kind)
