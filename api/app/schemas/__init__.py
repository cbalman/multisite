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


class RegisterRequest(BaseModel):
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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}


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
