"""
Test fixtures.

IMPORTANT: env vars must be set before importing the app / settings.
"""

from __future__ import annotations

import os
from collections.abc import Generator

# --- configure test environment before app imports ---
os.environ["TESTING"] = "1"
# Always isolate tests on a dedicated DB (do not reuse the dev database).
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://multisite:multisite@db:5432/multisite_test",
)
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production"
os.environ["SUPERADMIN_EMAIL"] = "admin@test.com"
os.environ["SUPERADMIN_PASSWORD"] = "admin-test-password"
os.environ["SUPERADMIN_NAME"] = "Test Super Admin"
os.environ["APP_DOMAIN"] = "localhost"
os.environ["MEDIA_ROOT"] = "/tmp/multisite-test-uploads"

from urllib.parse import urlparse

import pyotp
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.categories import seed_categories
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models import Site, SiteStatus, User, UserRole


def _admin_url_from_database_url(database_url: str) -> tuple[str, str]:
    """Return (url_to_postgres_db, test_db_name)."""
    parsed = urlparse(database_url.replace("postgresql+psycopg", "postgresql"))
    db_name = parsed.path.lstrip("/") or "multisite_test"
    admin_url = parsed._replace(path="/postgres").geturl().replace(
        "postgresql://",
        "postgresql+psycopg://",
        1,
    )
    return admin_url, db_name


def ensure_test_database(database_url: str) -> None:
    admin_url, db_name = _admin_url_from_database_url(database_url)
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT", poolclass=NullPool)
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": db_name},
        ).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    admin_engine.dispose()


@pytest.fixture(scope="session")
def test_engine():
    database_url = os.environ["DATABASE_URL"]
    ensure_test_database(database_url)
    engine = create_engine(database_url, poolclass=NullPool, pool_pre_ping=True)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def db(test_engine) -> Generator[Session, None, None]:
    connection = test_engine.connect()
    transaction = connection.begin()
    SessionLocal = sessionmaker(bind=connection, autoflush=False, autocommit=False)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db: Session, test_engine) -> Generator[TestClient, None, None]:
    # Import app only after TESTING env is set
    from app.main import app

    def _override_get_db() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def superadmin(db: Session) -> User:
    user = User(
        name="Test Super Admin",
        email="admin@test.com",
        password_hash=hash_password("admin-test-password"),
        role=UserRole.SUPERADMIN,
        is_active=True,
        totp_enabled=False,
    )
    db.add(user)
    db.flush()
    return user


@pytest.fixture
def superadmin_with_2fa(db: Session, superadmin: User) -> tuple[User, str]:
    secret = pyotp.random_base32()
    superadmin.totp_secret = secret
    superadmin.totp_enabled = True
    db.flush()
    return superadmin, secret


@pytest.fixture
def site_owner(db: Session) -> tuple[User, Site]:
    user = User(
        name="Maria",
        email="maria@test.com",
        password_hash=hash_password("password123"),
        role=UserRole.USER,
        is_active=True,
    )
    db.add(user)
    db.flush()
    site = Site(
        owner_id=user.id,
        slug="maria",
        name="Maria Reposteria",
        status=SiteStatus.ACTIVE,
        whatsapp="5493411111111",
    )
    db.add(site)
    db.flush()
    return user, site


@pytest.fixture
def other_owner(db: Session) -> tuple[User, Site]:
    user = User(
        name="Ricardo",
        email="ricardo@test.com",
        password_hash=hash_password("password123"),
        role=UserRole.USER,
        is_active=True,
    )
    db.add(user)
    db.flush()
    site = Site(
        owner_id=user.id,
        slug="ricardo",
        name="Ricardo Bike",
        status=SiteStatus.ACTIVE,
    )
    db.add(site)
    db.flush()
    return user, site


@pytest.fixture
def categories(db: Session):
    seed_categories(db)
    return True


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def login_user(client: TestClient, email: str, password: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "ok"
    assert data["access_token"]
    return data["access_token"]


def login_superadmin_2fa(client: TestClient, secret: str) -> str:
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "admin-test-password"},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "need_2fa"
    temp = data["temp_token"]
    code = pyotp.TOTP(secret).now()
    verify = client.post(
        "/api/auth/2fa/verify",
        json={"code": code},
        headers=auth_header(temp),
    )
    assert verify.status_code == 200, verify.text
    body = verify.json()
    assert body["status"] == "ok"
    return body["access_token"]
