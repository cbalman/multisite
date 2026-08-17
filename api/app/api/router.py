from fastapi import APIRouter

from app.api import admin, auth, categories, health, media, publications, public_sites, sites

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(public_sites.router, prefix="/public", tags=["public"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(sites.router, prefix="/me", tags=["me"])
api_router.include_router(publications.router, prefix="/me", tags=["publications"])
api_router.include_router(media.router, prefix="/me", tags=["media"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
