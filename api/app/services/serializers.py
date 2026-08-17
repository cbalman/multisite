from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.whatsapp import profile_message, publication_message, whatsapp_url
from app.models import Publication, PublicationImage, PublicationStatus, Site
from app.schemas import PublicationOwnerOut, PublicationPublicOut, SitePublicOut

ALLOWED_PUB_STATUSES = {
    PublicationStatus.DRAFT,
    PublicationStatus.PUBLISHED,
    PublicationStatus.HIDDEN,
}

SOCIAL_PLATFORMS = {"instagram", "facebook", "tiktok", "youtube", "linkedin", "x", "web"}


def site_out(site: Site, db: Session | None = None) -> SitePublicOut:
    count = None
    if db is not None:
        count = db.scalar(
            select(func.count(Publication.id)).where(
                Publication.site_id == site.id,
                Publication.status != PublicationStatus.DELETED,
            )
        )
    return SitePublicOut(
        id=site.id,
        slug=site.slug,
        name=site.name,
        description=site.description,
        logo_url=site.logo_url,
        city=site.city,
        category_id=site.category_id,
        category_name=site.category.name if site.category else None,
        status=site.status.value,
        theme=site.theme,
        primary_color=site.primary_color,
        whatsapp=site.whatsapp,
        phone1=site.phone1,
        phone2=site.phone2,
        socials=[{"platform": s.platform, "url": s.url} for s in site.socials],
        whatsapp_url=whatsapp_url(site.whatsapp, profile_message(site.name)),
        publication_count=count,
    )


def _pub_images(pub: Publication) -> list[str]:
    ordered = sorted(pub.images, key=lambda img: img.sort_order)
    return [img.url for img in ordered]


def _price(pub: Publication) -> float | None:
    return float(pub.price) if pub.price is not None else None


def publication_owner_out(pub: Publication, site: Site) -> PublicationOwnerOut:
    images = _pub_images(pub)
    return PublicationOwnerOut(
        id=pub.id,
        title=pub.title,
        description=pub.description,
        price=_price(pub),
        price_visible=pub.price_visible,
        price_on_request=pub.price_on_request,
        cover_image_url=pub.cover_image_url or (images[0] if images else None),
        video_url=pub.video_url,
        images=images,
        status=pub.status.value,
        whatsapp_url=whatsapp_url(site.whatsapp, publication_message(site.name, pub.title)),
    )


def publication_public_out(pub: Publication, site: Site) -> PublicationPublicOut:
    images = _pub_images(pub)
    return PublicationPublicOut(
        id=pub.id,
        title=pub.title,
        description=pub.description,
        price=_price(pub),
        price_visible=pub.price_visible,
        price_on_request=pub.price_on_request,
        cover_image_url=pub.cover_image_url or (images[0] if images else None),
        video_url=pub.video_url,
        images=images,
        status=pub.status.value,
        whatsapp_url=whatsapp_url(site.whatsapp, publication_message(site.name, pub.title)),
    )


def parse_pub_status(value: str) -> PublicationStatus:
    try:
        status = PublicationStatus(value)
    except ValueError as exc:
        raise ValueError("Estado de publicación inválido") from exc
    if status not in ALLOWED_PUB_STATUSES:
        raise ValueError("Estado de publicación inválido")
    return status


def replace_images(db: Session, pub: Publication, urls: list[str]) -> None:
    unique: list[str] = []
    for url in urls:
        clean = (url or "").strip()
        if clean and clean not in unique:
            unique.append(clean)
    if len(unique) > settings.MAX_IMAGES_PER_PUBLICATION:
        raise ValueError(f"Máximo {settings.MAX_IMAGES_PER_PUBLICATION} fotos por publicación")

    pub.images.clear()
    db.flush()
    for i, url in enumerate(unique):
        pub.images.append(PublicationImage(url=url, sort_order=i))
    pub.cover_image_url = unique[0] if unique else None


def load_publication(db: Session, site_id: int, publication_id: int) -> Publication | None:
    return db.scalar(
        select(Publication)
        .where(
            Publication.id == publication_id,
            Publication.site_id == site_id,
            Publication.status != PublicationStatus.DELETED,
        )
        .options(selectinload(Publication.images))
    )
