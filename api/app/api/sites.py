from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.deps import get_owned_site
from app.core.phones import normalize_phone
from app.models import Category, Site, SiteSocial
from app.schemas import SitePublicOut, SiteUpdateRequest, SocialsUpdateRequest
from app.services.serializers import SOCIAL_PLATFORMS, site_out

router = APIRouter()


@router.get("/site", response_model=SitePublicOut)
def my_site(site: Site = Depends(get_owned_site), db: Session = Depends(get_db)):
    return site_out(site, db)


@router.patch("/site", response_model=SitePublicOut)
def update_site(
    payload: SiteUpdateRequest,
    site: Site = Depends(get_owned_site),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)

    if "category_id" in data:
        category_id = data["category_id"]
        if category_id is not None:
            category = db.get(Category, category_id)
            if not category or not category.is_active:
                raise HTTPException(status_code=400, detail="Categoría inválida")

    if "whatsapp" in data:
        data["whatsapp"] = normalize_phone(data["whatsapp"], "WhatsApp")
    if "phone1" in data:
        data["phone1"] = normalize_phone(data["phone1"], "teléfono")
    if "phone2" in data:
        data["phone2"] = normalize_phone(data["phone2"], "teléfono secundario")

    for key, value in data.items():
        setattr(site, key, value)

    db.commit()
    site = db.scalar(
        select(Site)
        .where(Site.id == site.id)
        .options(selectinload(Site.socials), selectinload(Site.category))
    )
    return site_out(site, db)


@router.put("/site/socials", response_model=SitePublicOut)
def update_socials(
    payload: SocialsUpdateRequest,
    site: Site = Depends(get_owned_site),
    db: Session = Depends(get_db),
):
    cleaned: list[tuple[str, str]] = []
    seen: set[str] = set()
    for item in payload.socials:
        platform = item.platform.strip().lower()
        url = item.url.strip()
        if not url:
            continue
        if platform not in SOCIAL_PLATFORMS:
            raise HTTPException(status_code=400, detail=f"Red no permitida: {platform}")
        if not url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail="La URL de la red debe empezar con http")
        if platform in seen:
            continue
        seen.add(platform)
        cleaned.append((platform, url))

    site.socials.clear()
    db.flush()
    for platform, url in cleaned:
        site.socials.append(SiteSocial(platform=platform, url=url))
    db.commit()

    site = db.scalar(
        select(Site)
        .where(Site.id == site.id)
        .options(selectinload(Site.socials), selectinload(Site.category))
    )
    return site_out(site, db)
