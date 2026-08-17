from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.deps import get_owned_site
from app.models import Publication, PublicationStatus, Site
from app.schemas import (
    MessageOut,
    PublicationOwnerOut,
    PublicationPatchRequest,
    PublicationWriteRequest,
)
from app.services.serializers import (
    load_publication,
    parse_pub_status,
    publication_owner_out,
    replace_images,
)

router = APIRouter()


@router.get("/publications", response_model=list[PublicationOwnerOut])
def list_publications(site: Site = Depends(get_owned_site), db: Session = Depends(get_db)):
    pubs = db.scalars(
        select(Publication)
        .where(
            Publication.site_id == site.id,
            Publication.status != PublicationStatus.DELETED,
        )
        .options(selectinload(Publication.images))
        .order_by(Publication.created_at.desc())
    ).all()
    return [publication_owner_out(pub, site) for pub in pubs]


@router.post("/publications", response_model=PublicationOwnerOut, status_code=status.HTTP_201_CREATED)
def create_publication(
    payload: PublicationWriteRequest,
    site: Site = Depends(get_owned_site),
    db: Session = Depends(get_db),
):
    try:
        pub_status = parse_pub_status(payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    images = payload.images or ([payload.cover_image_url] if payload.cover_image_url else [])
    pub = Publication(
        site_id=site.id,
        title=payload.title.strip(),
        description=payload.description,
        price=payload.price,
        price_visible=payload.price_visible,
        price_on_request=payload.price_on_request,
        status=pub_status,
        video_url=payload.video_url,
        category_id=payload.category_id,
    )
    db.add(pub)
    db.flush()
    try:
        replace_images(db, pub, images)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    db.commit()
    pub = load_publication(db, site.id, pub.id)
    return publication_owner_out(pub, site)


@router.get("/publications/{publication_id}", response_model=PublicationOwnerOut)
def get_publication(
    publication_id: int,
    site: Site = Depends(get_owned_site),
    db: Session = Depends(get_db),
):
    pub = load_publication(db, site.id, publication_id)
    if not pub:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    return publication_owner_out(pub, site)


@router.patch("/publications/{publication_id}", response_model=PublicationOwnerOut)
def update_publication(
    publication_id: int,
    payload: PublicationPatchRequest,
    site: Site = Depends(get_owned_site),
    db: Session = Depends(get_db),
):
    pub = load_publication(db, site.id, publication_id)
    if not pub:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] is not None:
        try:
            pub.status = parse_pub_status(data.pop("status"))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    images = data.pop("images", None)
    if "title" in data and data["title"] is not None:
        data["title"] = data["title"].strip()
    for key, value in data.items():
        setattr(pub, key, value)

    if images is not None:
        try:
            replace_images(db, pub, images)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    elif payload.cover_image_url is not None and not pub.images:
        try:
            replace_images(db, pub, [payload.cover_image_url] if payload.cover_image_url else [])
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    db.commit()
    pub = load_publication(db, site.id, publication_id)
    return publication_owner_out(pub, site)


@router.delete("/publications/{publication_id}", response_model=MessageOut)
def delete_publication(
    publication_id: int,
    site: Site = Depends(get_owned_site),
    db: Session = Depends(get_db),
):
    pub = load_publication(db, site.id, publication_id)
    if not pub:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    pub.status = PublicationStatus.DELETED
    db.commit()
    return MessageOut(message="Publicación eliminada")
