from pydantic import BaseModel, EmailStr, Field, field_validator
import re


RESERVED_SLUGS = {
    "www",
    "api",
    "app",
    "admin",
    "mail",
    "ftp",
    "cdn",
    "static",
    "media",
    "docs",
    "status",
    "support",
    "help",
    "blog",
    "dashboard",
}


def validate_slug(value: str) -> str:
    slug = value.strip().lower()
    if not re.fullmatch(r"[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?", slug):
        raise ValueError(
            "La dirección solo puede tener letras minúsculas, números y guiones."
        )
    if slug in RESERVED_SLUGS:
        raise ValueError("Esa dirección no está disponible.")
    return slug


class CreateSiteRequest(BaseModel):
    """Only Super Admin creates storefronts (sold accounts)."""

    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    site_name: str = Field(min_length=2, max_length=160)
    slug: str = Field(min_length=2, max_length=63)

    @field_validator("slug")
    @classmethod
    def slug_ok(cls, v: str) -> str:
        return validate_slug(v)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TotpCodeRequest(BaseModel):
    code: str = Field(min_length=6, max_length=8)


class LoginResponse(BaseModel):
    """Unified login response: ok | need_2fa | setup_2fa."""

    status: str
    access_token: str | None = None
    temp_token: str | None = None
    token_type: str = "bearer"
    role: str | None = None
    name: str | None = None
    message: str | None = None


class TotpSetupOut(BaseModel):
    secret: str
    otpauth_url: str
    qr_data_url: str
    message: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    totp_enabled: bool = False

    model_config = {"from_attributes": True}


class SiteAdminOut(BaseModel):
    id: int
    slug: str
    name: str
    status: str
    owner_id: int
    owner_name: str
    owner_email: str
    created_at: str | None = None


class SiteCreatedOut(BaseModel):
    user: UserOut
    site: SiteAdminOut
    full_host: str
    message: str


class SitePublicOut(BaseModel):
    id: int
    slug: str
    name: str
    description: str | None
    logo_url: str | None
    city: str | None
    status: str
    theme: str
    primary_color: str
    whatsapp: str | None
    phone1: str | None
    phone2: str | None
    socials: list[dict]

    model_config = {"from_attributes": True}


class PublicationPublicOut(BaseModel):
    id: int
    title: str
    description: str | None
    price: float | None
    price_visible: bool
    price_on_request: bool
    cover_image_url: str | None
    video_url: str | None
    status: str

    model_config = {"from_attributes": True}


class SlugCheckOut(BaseModel):
    slug: str
    available: bool
    full_host: str


class MessageOut(BaseModel):
    message: str
