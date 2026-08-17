from sqlalchemy import select, text

from app.core.categories import seed_categories
from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.models import User, UserRole


def ensure_schema_patches() -> None:
    """Add columns introduced after first create_all (dev-friendly)."""
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))


def ensure_superadmin() -> None:
    """Bootstrap the platform owner account from env (idempotent)."""
    email = settings.SUPERADMIN_EMAIL.lower().strip()
    if not email:
        return

    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == email))
        if existing:
            if existing.role != UserRole.SUPERADMIN:
                existing.role = UserRole.SUPERADMIN
                db.commit()
            return

        admin = User(
            name=settings.SUPERADMIN_NAME.strip() or "Super Admin",
            email=email,
            password_hash=hash_password(settings.SUPERADMIN_PASSWORD),
            role=UserRole.SUPERADMIN,
            is_active=True,
            totp_enabled=False,
        )
        db.add(admin)
        db.commit()
    finally:
        db.close()


def ensure_categories() -> None:
    db = SessionLocal()
    try:
        seed_categories(db)
        db.commit()
    finally:
        db.close()
