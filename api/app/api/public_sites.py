from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Publication, PublicationStatus, Site, SiteStatus
from app.schemas import PublicationPublicOut, SitePublicOut
from app.services.serializers import publication_public_out, site_out

router = APIRouter()


def _active_site(db: Session, slug: str) -> Site | None:
    return db.scalar(
        select(Site)
        .where(Site.slug == slug)
        .options(selectinload(Site.socials), selectinload(Site.category))
    )


@router.get("/sites/by-host", response_model=SitePublicOut)
def get_site_by_host(request: Request, db: Session = Depends(get_db)):
    """Resolve public site from Host header (maria.localhost / maria.tudominio.com)."""
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or ""
    host = host.split(":")[0].lower()
    parts = host.split(".")

    if len(parts) < 2:
        raise HTTPException(status_code=404, detail="Sitio no encontrado")

    slug = parts[0]
    if slug in {"www", "localhost", "api", "app"}:
        raise HTTPException(status_code=404, detail="No es un sitio público")

    site = _active_site(db, slug)
    if not site or site.status != SiteStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="Este sitio no se encuentra disponible actualmente.")
    return site_out(site, db)


@router.get("/sites/{slug}", response_model=SitePublicOut)
def get_site_by_slug(slug: str, db: Session = Depends(get_db)):
    site = _active_site(db, slug)
    if not site or site.status != SiteStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="Este sitio no se encuentra disponible actualmente.")
    return site_out(site, db)


@router.get("/sites/{slug}/publications", response_model=list[PublicationPublicOut])
def list_public_publications(slug: str, db: Session = Depends(get_db)):
    site = _active_site(db, slug)
    if not site or site.status != SiteStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="Sitio no encontrado")

    pubs = db.scalars(
        select(Publication)
        .where(
            Publication.site_id == site.id,
            Publication.status == PublicationStatus.PUBLISHED,
        )
        .options(selectinload(Publication.images))
        .order_by(Publication.created_at.desc())
    ).all()
    return [publication_public_out(pub, site) for pub in pubs]
