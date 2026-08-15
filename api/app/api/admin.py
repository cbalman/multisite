from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_superadmin
from app.core.security import hash_password
from app.models import Site, SiteStatus, User, UserRole
from app.schemas import (
    CreateSiteRequest,
    SiteAdminOut,
    SiteCreatedOut,
    SlugCheckOut,
    UserOut,
    validate_slug,
)

router = APIRouter()


def _site_admin_out(site: Site, owner: User) -> SiteAdminOut:
    return SiteAdminOut(
        id=site.id,
        slug=site.slug,
        name=site.name,
        status=site.status.value,
        owner_id=owner.id,
        owner_name=owner.name,
        owner_email=owner.email,
        created_at=site.created_at.isoformat() if site.created_at else None,
    )


@router.get("/slug-available/{slug}", response_model=SlugCheckOut)
def check_slug(
    slug: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_superadmin),
):
    try:
        clean = validate_slug(slug)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    exists = db.scalar(select(Site.id).where(Site.slug == clean))
    return SlugCheckOut(
        slug=clean,
        available=exists is None,
        full_host=f"{clean}.{settings.APP_DOMAIN}",
    )


@router.get("/sites", response_model=list[SiteAdminOut])
def list_sites(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_superadmin),
):
    sites = db.scalars(
        select(Site).options(selectinload(Site.owner)).order_by(Site.id.desc())
    ).all()
    return [_site_admin_out(site, site.owner) for site in sites]


@router.post("/sites", response_model=SiteCreatedOut, status_code=status.HTTP_201_CREATED)
def create_site(
    payload: CreateSiteRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_superadmin),
):
    email_taken = db.scalar(select(User.id).where(User.email == payload.email.lower()))
    if email_taken:
        raise HTTPException(status_code=400, detail="Ese email ya está registrado")

    slug_taken = db.scalar(select(Site.id).where(Site.slug == payload.slug))
    if slug_taken:
        raise HTTPException(status_code=400, detail="Esa dirección ya está en uso")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=UserRole.USER,
    )
    db.add(user)
    db.flush()

    site = Site(
        owner_id=user.id,
        slug=payload.slug,
        name=payload.site_name.strip(),
        status=SiteStatus.ACTIVE,
    )
    db.add(site)
    db.commit()
    db.refresh(user)
    db.refresh(site)

    return SiteCreatedOut(
        user=UserOut.model_validate(user),
        site=_site_admin_out(site, user),
        full_host=f"{site.slug}.{settings.APP_DOMAIN}",
        message="Vidriera creada. El cliente ingresa en su panel: "
        + f"{site.slug}.{settings.APP_DOMAIN}/panel",
    )
