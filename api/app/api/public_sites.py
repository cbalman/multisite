from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Publication, PublicationStatus, Site, SiteStatus
from app.schemas import PublicationPublicOut, SitePublicOut

router = APIRouter()


def _site_public(site: Site) -> SitePublicOut:
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


@router.get("/sites/by-host", response_model=SitePublicOut)
def get_site_by_host(request: Request, db: Session = Depends(get_db)):
    """Resolve public site from Host header (maria.localhost / maria.tudominio.com)."""
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or ""
    host = host.split(":")[0].lower()
    parts = host.split(".")

    # maria.localhost OR maria.sitioweb.com
    if len(parts) < 2:
        raise HTTPException(status_code=404, detail="Sitio no encontrado")

    slug = parts[0]
    if slug in {"www", "localhost", "api", "app"}:
        raise HTTPException(status_code=404, detail="No es un sitio público")

    site = db.scalar(
        select(Site)
        .where(Site.slug == slug)
        .options(selectinload(Site.socials))
    )
    if not site or site.status != SiteStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="Este sitio no se encuentra disponible actualmente.")

    return _site_public(site)


@router.get("/sites/{slug}", response_model=SitePublicOut)
def get_site_by_slug(slug: str, db: Session = Depends(get_db)):
    site = db.scalar(
        select(Site)
        .where(Site.slug == slug)
        .options(selectinload(Site.socials))
    )
    if not site or site.status != SiteStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="Este sitio no se encuentra disponible actualmente.")
    return _site_public(site)


@router.get("/sites/{slug}/publications", response_model=list[PublicationPublicOut])
def list_public_publications(slug: str, db: Session = Depends(get_db)):
    site = db.scalar(select(Site).where(Site.slug == slug, Site.status == SiteStatus.ACTIVE))
    if not site:
        raise HTTPException(status_code=404, detail="Sitio no encontrado")

    pubs = db.scalars(
        select(Publication)
        .where(
            Publication.site_id == site.id,
            Publication.status == PublicationStatus.PUBLISHED,
        )
        .order_by(Publication.created_at.desc())
    ).all()
    return pubs
