from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.core.config import settings
from app.models import Site, SiteStatus, User, UserRole
from app.schemas import (
    LoginRequest,
    RegisterRequest,
    SlugCheckOut,
    TokenResponse,
    UserOut,
    validate_slug,
)

router = APIRouter()


@router.get("/slug-available/{slug}", response_model=SlugCheckOut)
def check_slug(slug: str, db: Session = Depends(get_db)):
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


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
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

    token = create_access_token(str(user.id), {"role": user.role.value})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario suspendido")

    token = create_access_token(str(user.id), {"role": user.role.value})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
