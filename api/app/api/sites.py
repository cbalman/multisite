from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user
from app.core.database import get_db
from app.models import Site, User
from app.schemas import SitePublicOut

router = APIRouter()


@router.get("/site", response_model=SitePublicOut)
def my_site(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    site = db.scalar(
        select(Site)
        .where(Site.owner_id == user.id)
        .options(selectinload(Site.socials))
    )
    if not site:
        raise HTTPException(status_code=404, detail="Todavía no tenés un sitio")

    return SitePublicOut(
        id=site.id,
        slug=site.slug,
        name=site.name,
        description=site.description,
        logo_url=site.logo_url,
        city=site.city,
        status=site.status.value,
        theme=site.theme,
        primary_color=site.primary_color,
        whatsapp=site.whatsapp,
        phone1=site.phone1,
        phone2=site.phone2,
        socials=[{"platform": s.platform, "url": s.url} for s in site.socials],
    )
