from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import decode_token
from app.models import Site, User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def _user_from_token(db: Session, token: str | None, allowed_types: set[str]) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
    payload = decode_token(token)
    if not payload or payload.get("type") not in allowed_types:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    user_id = payload.get("sub")
    user = db.get(User, int(user_id)) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no válido")
    return user


def get_current_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
) -> User:
    return _user_from_token(db, token, {"access"})


def get_current_superadmin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.SUPERADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo super admin")
    if not user.totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debés activar Google Authenticator para usar el panel admin",
        )
    return user


def get_2fa_pending_superadmin(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
) -> User:
    user = _user_from_token(db, token, {"pre_2fa"})
    if user.role != UserRole.SUPERADMIN or not user.totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="2FA no pendiente")
    return user


def get_2fa_setup_superadmin(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
) -> User:
    user = _user_from_token(db, token, {"setup_2fa"})
    if user.role != UserRole.SUPERADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo super admin")
    return user


def get_owned_site(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Site:
    site = db.scalar(
        select(Site)
        .where(Site.owner_id == user.id)
        .options(selectinload(Site.socials), selectinload(Site.category))
    )
    if not site:
        raise HTTPException(status_code=404, detail="Todavía no tenés un sitio")
    return site
